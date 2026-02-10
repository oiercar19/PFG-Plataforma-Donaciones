const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { geocodeAddress } = require('../services/geocoding');

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
            city,
            address,
            postalCode,
            province,
            latitude,
            longitude,
            contactEmail,
            contactPhone,
            documentUrl,
        } = req.body;

        const ongCity = city || location;
        const locationLabel = location || city;

        // Validaciones básicas
        if (!username || !email || !password || !name || !cif || !type || !ongCity || !contactEmail || !contactPhone) {
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

        let parsedLatitude = latitude ? parseFloat(latitude) : null;
        let parsedLongitude = longitude ? parseFloat(longitude) : null;

        if ((parsedLatitude === null || Number.isNaN(parsedLatitude)) || (parsedLongitude === null || Number.isNaN(parsedLongitude))) {
            parsedLatitude = null;
            parsedLongitude = null;
        }

        if (parsedLatitude === null || parsedLongitude === null) {
            try {
                const geo = await geocodeAddress({ address, city: ongCity, province, postalCode });
                if (geo) {
                    parsedLatitude = geo.latitude;
                    parsedLongitude = geo.longitude;
                }
            } catch (geoError) {
                console.warn('No se pudo geocodificar la dirección de la ONG:', geoError.message);
            }
        }

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
                    location: locationLabel || ongCity,
                    city: ongCity,
                    address: address || null,
                    postalCode: postalCode || null,
                    province: province || null,
                    latitude: parsedLatitude,
                    longitude: parsedLongitude,
                    contactEmail,
                    contactPhone,
                    documentUrl,
                    status: 'PENDING',
                    userId: user.id,
                },
            });

            // Guardar documentos en la base de datos
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await tx.ongDocument.create({
                        data: {
                            filename: `${Date.now()}-${file.originalname}`,
                            originalName: file.originalname,
                            mimetype: file.mimetype,
                            size: file.size,
                            data: file.buffer,
                            ongId: ong.id,
                        },
                    });
                }
            }

            return { user, ong };
        });

        // Reintentar geocodificar si quedÃ³ sin coordenadas tras el registro
        if (
            (result.ong.latitude === null || result.ong.latitude === undefined || Number.isNaN(result.ong.latitude)) ||
            (result.ong.longitude === null || result.ong.longitude === undefined || Number.isNaN(result.ong.longitude))
        ) {
            try {
                const geo = await geocodeAddress({
                    address: result.ong.address,
                    city: result.ong.city || result.ong.location,
                    province: result.ong.province,
                    postalCode: result.ong.postalCode,
                });

                if (geo) {
                    await prisma.ong.update({
                        where: { id: result.ong.id },
                        data: {
                            latitude: geo.latitude,
                            longitude: geo.longitude,
                        },
                    });
                }
            } catch (geoError) {
                // Mantener datos actuales si no se puede geocodificar
            }
        }

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
                rejectionReason: user.ong.rejectionReason,
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

/**
 * Obtener datos de la ONG del usuario actual
 */
async function getMyOngData(req, res) {
    try {
        const userId = req.user.id;
        console.log('🔍 getMyOngData - Usuario ID:', userId);

        // Verificar que el usuario es una ONG
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                ong: true,
            },
        });

        console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No');
        console.log('📋 Rol del usuario:', user?.role);
        console.log('🏢 Tiene ONG:', user?.ong ? 'Sí' : 'No');

        if (!user || user.role !== 'ONG') {
            console.log('❌ Error: Usuario no es ONG o no existe');
            return res.status(403).json({ error: 'Solo las ONGs pueden acceder a esta información' });
        }

        if (!user.ong) {
            console.log('❌ Error: Usuario es ONG pero no tiene datos de ONG');
            return res.status(404).json({ error: 'No se encontró información de la ONG' });
        }

        let ongData = user.ong;

        if (
            (ongData.latitude === null || ongData.latitude === undefined || Number.isNaN(ongData.latitude)) ||
            (ongData.longitude === null || ongData.longitude === undefined || Number.isNaN(ongData.longitude))
        ) {
            try {
                const geo = await geocodeAddress({
                    address: ongData.address,
                    city: ongData.city || ongData.location,
                    province: ongData.province,
                    postalCode: ongData.postalCode,
                });
                if (geo) {
                    ongData = await prisma.ong.update({
                        where: { id: ongData.id },
                        data: {
                            latitude: geo.latitude,
                            longitude: geo.longitude,
                        },
                    });
                }
            } catch (geoError) {
                // Mantener datos actuales si no se puede geocodificar
            }
        }

        console.log('✅ ONG encontrada:', ongData.name);
        res.json({ ong: ongData });
    } catch (error) {
        console.error('💥 Error al obtener datos de ONG:', error);
        console.error('💥 Stack trace:', error.stack);
        res.status(500).json({ error: 'Error al obtener información de la ONG' });
    }
}

/**
 * Actualizar información de la ONG
 */
async function updateMyOngData(req, res) {
    try {
        const userId = req.user.id;
        const {
            name,
            description,
            location,
            city,
            address,
            postalCode,
            province,
            latitude,
            longitude,
            contactEmail,
            contactPhone,
        } = req.body;

        // Verificar que el usuario es una ONG
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { ong: true },
        });

        if (!user || user.role !== 'ONG') {
            return res.status(403).json({ error: 'Solo las ONGs pueden actualizar esta información' });
        }

        if (!user.ong) {
            return res.status(404).json({ error: 'No se encontró información de la ONG' });
        }

        // Preparar datos para actualizar
        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (location) updateData.location = location;
        if (city) {
            updateData.city = city;
            if (!location) {
                updateData.location = city;
            }
        }
        if (address !== undefined) updateData.address = address || null;
        if (postalCode !== undefined) updateData.postalCode = postalCode || null;
        if (province !== undefined) updateData.province = province || null;
        if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
        if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
        if (contactEmail) updateData.contactEmail = contactEmail;
        if (contactPhone) updateData.contactPhone = contactPhone;

        // Actualizar ONG
        let updatedOng = await prisma.ong.update({
            where: { id: user.ong.id },
            data: updateData,
        });

        if ((updatedOng.latitude === null || updatedOng.latitude === undefined || Number.isNaN(updatedOng.latitude)) ||
            (updatedOng.longitude === null || updatedOng.longitude === undefined || Number.isNaN(updatedOng.longitude))) {
            try {
                const geo = await geocodeAddress({
                    address: updatedOng.address,
                    city: updatedOng.city || updatedOng.location,
                    province: updatedOng.province,
                    postalCode: updatedOng.postalCode,
                });
                if (geo) {
                    updatedOng = await prisma.ong.update({
                        where: { id: updatedOng.id },
                        data: {
                            latitude: geo.latitude,
                            longitude: geo.longitude,
                        },
                    });
                }
            } catch (geoError) {
                // Mantener datos actuales si no se puede geocodificar
            }
        }

        res.json({
            message: 'Información de ONG actualizada exitosamente',
            ong: updatedOng,
        });
    } catch (error) {
        console.error('Error al actualizar ONG:', error);
        res.status(500).json({ error: 'Error al actualizar información de la ONG' });
    }
}

/**
 * Obtener ONGs registradas (uso pÃºblico)
 */
async function getPublicOngs(req, res) {
    try {
        const ongs = await prisma.ong.findMany({
            where: { status: { in: ['APPROVED', 'PENDING'] } },
            select: {
                id: true,
                name: true,
                status: true,
                type: true,
                description: true,
                city: true,
                address: true,
                postalCode: true,
                province: true,
                location: true,
                latitude: true,
                longitude: true,
                contactEmail: true,
                contactPhone: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({ ongs });
    } catch (error) {
        console.error('Error al obtener ONGs registradas:', error);
        res.status(500).json({ error: 'Error al obtener ONGs' });
    }
}

module.exports = {
    registerDonor,
    registerOng,
    login,
    getProfile,
    updateProfile,
    getMyOngData,
    updateMyOngData,
    getPublicOngs,
};



