const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

/**
 * Registro de usuario donante
 */
async function registerDonor(req, res) {
    try {
        const { username, email, password, location } = req.body;

        // Validaciones básicas
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return res.status(409).json({ error: 'El usuario o email ya existe' });
        }

        // Hash de contraseña
        const hashedPassword = await hashPassword(password);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                location,
                role: 'DONANTE',
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                location: true,
                createdAt: true,
            },
        });

        // Generar token
        const token = generateToken(user);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user,
            token,
        });
    } catch (error) {
        console.error('Error en registro de donante:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
}

/**
 * Registro de ONG
 */
async function registerOng(req, res) {
    try {
        const {
            // Datos de usuario
            username,
            email,
            password,
            location: userLocation,
            // Datos de ONG
            name,
            cif,
            type,
            description,
            location,
            latitude,
            longitude,
            contactEmail,
            contactPhone,
            documentUrl,
        } = req.body;

        // Validaciones básicas
        if (!username || !email || !password || !name || !cif || !type || !location || !contactEmail || !contactPhone) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return res.status(409).json({ error: 'El usuario o email ya existe' });
        }

        // Verificar si el CIF ya existe
        const existingOng = await prisma.ong.findUnique({
            where: { cif },
        });

        if (existingOng) {
            return res.status(409).json({ error: 'El CIF ya está registrado' });
        }

        // Hash de contraseña
        const hashedPassword = await hashPassword(password);

        // Crear usuario y ONG en una transacción
        const result = await prisma.$transaction(async (tx) => {
            // Crear usuario
            const user = await tx.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    location: userLocation,
                    role: 'ONG',
                },
            });

            // Crear ONG asociada
            const ong = await tx.ong.create({
                data: {
                    name,
                    cif,
                    type,
                    description,
                    location,
                    latitude,
                    longitude,
                    contactEmail,
                    contactPhone,
                    documentUrl,
                    status: 'PENDING',
                    userId: user.id,
                },
            });

            return { user, ong };
        });

        // Generar token
        const token = generateToken(result.user);

        res.status(201).json({
            message: 'ONG registrada exitosamente. Pendiente de validación.',
            user: {
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                role: result.user.role,
            },
            ong: {
                id: result.ong.id,
                name: result.ong.name,
                status: result.ong.status,
            },
            token,
        });
    } catch (error) {
        console.error('Error en registro de ONG:', error);
        res.status(500).json({ error: 'Error al registrar ONG' });
    }
}

/**
 * Login (username o email + contraseña)
 */
async function login(req, res) {
    try {
        const { identifier, password } = req.body; // identifier puede ser username o email

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }

        // Buscar usuario por username o email
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
            include: {
                ong: true,
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token
        const token = generateToken(user);

        // Preparar respuesta
        const response = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            location: user.location,
            token,
        };

        // Si es ONG, incluir información de la ONG
        if (user.role === 'ONG' && user.ong) {
            response.ong = {
                id: user.ong.id,
                name: user.ong.name,
                status: user.ong.status,
                type: user.ong.type,
            };
        }

        res.json({
            message: 'Login exitoso',
            user: response,
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
}

/**
 * Obtener perfil de usuario actual
 */
async function getProfile(req, res) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                ong: true,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                location: true,
                createdAt: true,
                ong: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
}

/**
 * Actualizar perfil de usuario
 */
async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { username, email, password, location, currentPassword } = req.body;

        // Obtener usuario actual
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!currentUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Si se quiere cambiar la contraseña, validar la actual
        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Se requiere la contraseña actual para cambiarla' });
            }

            const isValidPassword = await comparePassword(currentPassword, currentUser.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Contraseña actual incorrecta' });
            }
        }

        // Verificar si el username o email ya existen (si se están cambiando)
        if (username && username !== currentUser.username) {
            const existingUsername = await prisma.user.findUnique({
                where: { username },
            });
            if (existingUsername) {
                return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
            }
        }

        if (email && email !== currentUser.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            });
            if (existingEmail) {
                return res.status(409).json({ error: 'El email ya está en uso' });
            }
        }

        // Preparar datos para actualizar
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (location !== undefined) updateData.location = location;
        if (password) updateData.password = await hashPassword(password);

        // Actualizar usuario
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                location: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
}

module.exports = {
    registerDonor,
    registerOng,
    login,
    getProfile,
    updateProfile,
};
