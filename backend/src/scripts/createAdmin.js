// Script para crear el primer usuario administrador
// Ejecutar con: node src/scripts/createAdmin.js

require('dotenv').config();
const prisma = require('../config/database');
const { hashPassword } = require('../utils/password');

async function createAdmin() {
    try {
        const adminData = {
            username: 'admin',
            email: 'admin@donation-platform.com',
            password: await hashPassword('Admin123!'),
            role: 'ADMIN',
            location: 'Sistema',
        };

        // Verificar si ya existe un admin
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });

        if (existingAdmin) {
            console.log('Ya existe un usuario administrador');
            process.exit(0);
        }

        const admin = await prisma.user.create({
            data: adminData,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });

        console.log('Usuario administrador creado exitosamente:');
        console.log('   Username:', admin.username);
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
        console.log('   Password: Admin123!');

        process.exit(0);
    } catch (error) {
        console.error('Error al crear administrador:', error);
        process.exit(1);
    }
}

createAdmin();
