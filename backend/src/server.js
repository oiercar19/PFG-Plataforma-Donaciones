require('dotenv').config();
const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

// Iniciar servidor
const server = app.listen(PORT, async () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);

    // Verificar conexión a base de datos
    try {
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos');
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
        process.exit(1);
    }
});

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM recibido, cerrando servidor...');
    server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('⚠️  SIGINT recibido, cerrando servidor...');
    server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});
