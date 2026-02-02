const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para verificar JWT
 */
function authenticate(req, res, next) {
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

        req.user = decoded;
        next();
    } catch (error) {
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
