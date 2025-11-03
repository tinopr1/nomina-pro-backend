import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// --- Simulación de Base de Datos en Memoria ---
let users = [
    { id: 'admin1', name: 'Admin', email: 'admin@nomina.pro', password: 'adminpass123', role: 'ADMIN' },
    { id: 'user1', name: 'Contador de Prueba', email: 'test@contador.com', password: 'password123', role: 'CONTADOR' }
];
let businesses = []; // Empezamos sin negocios

// --- Lógica de Autenticación y Middleware ---
const authenticateToken = (req, res, next) => {
    // Aquí iría la lógica de validación de token (JWT) en una app real
    // Por ahora, lo dejamos pasar para simplificar
    next();
};

// --- Rutas de la API ---

// LOGIN
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        // En una app real, generarías un token JWT aquí
        const token = `fake-token-for-${user.id}`;
        const userResponse = { id: user.id, name: user.name, email: user.email, role: user.role };
        res.json({ token, user: userResponse });
    } else {
        res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

// --- Rutas de ADMIN ---
app.get('/api/admin/users', authenticateToken, (req, res) => {
    res.json(users.filter(u => u.role === 'CONTADOR')); // Solo devuelve contables
});

app.post('/api/admin/users', authenticateToken, (req, res) => {
   const { name, email, password } = req.body;
   const newUser = { id: `user${Date.now()}`, name, email, password, role: 'CONTADOR' };
   users.push(newUser);
   res.status(201).json(newUser);
});

// --- Rutas de CONTABLE ---
 app.get('/api/businesses', authenticateToken, (req, res) => {
    // En una app real, filtrarías por el userId del token
    res.json(businesses);
});

app.post('/api/businesses', authenticateToken, (req, res) => {
   const { name, industry } = req.body;
   const newBusiness = { id: `b${Date.now()}`, name, industry, employees: [] };
   businesses.push(newBusiness);
   res.status(201).json(newBusiness);
});

// ... Aquí irían todas las demás rutas (addEmployee, addPayment, etc.)

// RUTA PARA GEMINI
app.post('/api/reports/generate', authenticateToken, async (req, res) => {
    const { businessName, employees, monthYear } = req.body;

    if (!process.env.API_KEY) {
        return res.status(500).json({ message: 'API key for Gemini no está configurada.' });
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const employeeData = employees.map(e => `- ${e.name}: Salario ${e.salary}`).join('\n');
        const prompt = `Genera un resumen de nómina para ${businessName} para ${monthYear} con estos datos:\n${employeeData}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.json({ summary: response.text });
    } catch (error) {
        res.status(500).json({ message: 'Fallo al generar el informe con Gemini.' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});