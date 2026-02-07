const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

/**
 * Middleware para verificar JWT
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        // Verificar que el usuario existe en la base de datos
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                location: true,
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado. Por favor, inicia sesión nuevamente' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error de autenticación:', error);
        return res.status(401).json({ error: 'Error de autenticación' });
    }
}

/**
 * Middleware para verificar roles
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        }

        next();
    };
}

/**
 * Middleware para verificar que la ONG esté aprobada
 */
async function requireApprovedOng(req, res, next) {
    try {
        const prisma = require('../config/database');

        if (req.user.role !== 'ONG') {
            return res.status(403).json({ error: 'Solo las ONGs pueden realizar esta acción' });
        }

        const ong = await prisma.ong.findUnique({
            where: { userId: req.user.id },
        });

        if (!ong) {
            return res.status(404).json({ error: 'ONG no encontrada' });
        }

        if (ong.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Tu ONG aún no ha sido aprobada' });
        }

        req.ong = ong;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Error al verificar estado de ONG' });
    }
}

module.exports = {
    authenticate,
    authorize,
    requireApprovedOng,
};
