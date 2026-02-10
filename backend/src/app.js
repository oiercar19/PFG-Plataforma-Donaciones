const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const prisma = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRoutes = require('./routes/donationRoutes');
const needRoutes = require('./routes/needRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();

// Middlewares de seguridad
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // Máximo 500 peticiones por ventana
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde',
});
app.use('/api/', limiter);

// Body parser con límite aumentado para aceptar imágenes en base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/needs', needRoutes);
app.use('/api/conversations', conversationRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta de health check con BD
app.get('/health/db', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'OK', db: 'OK', timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('DB health check error:', err);
        res.status(500).json({
            status: 'ERROR',
            db: 'ERROR',
            message: 'Database connection failed',
            timestamp: new Date().toISOString(),
        });
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'API de plataforma de donación y redistribución de recursos',
        version: '1.0.0',
    });
});

// Manejador de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
    });
});

module.exports = app;


