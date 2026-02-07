const prisma = require('../config/database');

/**
 * Obtener todas las ONGs pendientes de validación
 */
async function getPendingOngs(req, res) {
    try {
        const ongs = await prisma.ong.findMany({
            where: { status: 'PENDING' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        location: true,
                    },
                },
                documents: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ ongs });
    } catch (error) {
        console.error('Error al obtener ONGs pendientes:', error);
        res.status(500).json({ error: 'Error al obtener ONGs pendientes' });
    }
}

/**
 * Obtener detalles de una ONG específica
 */
async function getOngById(req, res) {
    try {
        const { id } = req.params;

        const ong = await prisma.ong.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        location: true,
                        createdAt: true,
                    },
                },
                documents: {
                    select: {
                        id: true,
                        filename: true,
                        originalName: true,
                        mimetype: true,
                        size: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!ong) {
            return res.status(404).json({ error: 'ONG no encontrada' });
        }

        res.json({ ong });
    } catch (error) {
        console.error('Error al obtener ONG:', error);
        res.status(500).json({ error: 'Error al obtener ONG' });
    }
}

/**
 * Aprobar una ONG
 */
async function approveOng(req, res) {
    try {
        const { id } = req.params;

        // Verificar que la ONG existe y está pendiente
        const ong = await prisma.ong.findUnique({
            where: { id },
        });

        if (!ong) {
            return res.status(404).json({ error: 'ONG no encontrada' });
        }

        if (ong.status !== 'PENDING') {
            return res.status(400).json({ error: 'La ONG ya ha sido procesada' });
        }

        // Aprobar ONG
        const updatedOng = await prisma.ong.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            message: 'ONG aprobada exitosamente',
            ong: updatedOng,
        });
    } catch (error) {
        console.error('Error al aprobar ONG:', error);
        res.status(500).json({ error: 'Error al aprobar ONG' });
    }
}

/**
 * Rechazar una ONG
 */
async function rejectOng(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Debe proporcionar un motivo de rechazo' });
        }

        // Verificar que la ONG existe y está pendiente
        const ong = await prisma.ong.findUnique({
            where: { id },
        });

        if (!ong) {
            return res.status(404).json({ error: 'ONG no encontrada' });
        }

        if (ong.status !== 'PENDING') {
            return res.status(400).json({ error: 'La ONG ya ha sido procesada' });
        }

        // Rechazar ONG
        const updatedOng = await prisma.ong.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            message: 'ONG rechazada',
            ong: updatedOng,
        });
    } catch (error) {
        console.error('Error al rechazar ONG:', error);
        res.status(500).json({ error: 'Error al rechazar ONG' });
    }
}

/**
 * Obtener todas las ONGs (con filtro opcional por estado)
 */
async function getAllOngs(req, res) {
    try {
        const { status } = req.query;

        const where = status ? { status } : {};

        const ongs = await prisma.ong.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ ongs });
    } catch (error) {
        console.error('Error al obtener ONGs:', error);
        res.status(500).json({ error: 'Error al obtener ONGs' });
    }
}

/**
 * Obtener estadísticas del panel de admin
 */
async function getAdminStats(req, res) {
    try {
        const [
            totalUsers,
            totalDonors,
            totalOngs,
            pendingOngs,
            approvedOngs,
            rejectedOngs,
            totalDonations,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'DONANTE' } }),
            prisma.ong.count(),
            prisma.ong.count({ where: { status: 'PENDING' } }),
            prisma.ong.count({ where: { status: 'APPROVED' } }),
            prisma.ong.count({ where: { status: 'REJECTED' } }),
            prisma.donation.count(),
        ]);

        res.json({
            stats: {
                users: {
                    total: totalUsers,
                    donors: totalDonors,
                },
                ongs: {
                    total: totalOngs,
                    pending: pendingOngs,
                    approved: approvedOngs,
                    rejected: rejectedOngs,
                },
                donations: {
                    total: totalDonations,
                },
            },
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
}

/**
 * Descargar documento de una ONG desde la base de datos
 */
async function downloadDocument(req, res) {
    try {
        const { documentId } = req.params;

        // Buscar el documento en la base de datos
        const document = await prisma.ongDocument.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        // Configurar headers para la descarga
        res.setHeader('Content-Type', document.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        res.setHeader('Content-Length', document.size);

        // Enviar el buffer del archivo
        res.send(document.data);
    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({ error: 'Error al descargar documento' });
    }
}

module.exports = {
    getPendingOngs,
    getOngById,
    approveOng,
    rejectOng,
    getAllOngs,
    getAdminStats,
    downloadDocument,
};
