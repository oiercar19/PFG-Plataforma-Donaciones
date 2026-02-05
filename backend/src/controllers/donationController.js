const prisma = require('../config/database');
const { geocodeAddress } = require('../services/geocoding');

/**
 * Crear una donación
 * Cualquier usuario autenticado puede crear donaciones (donantes y ONGs)
 */
async function createDonation(req, res) {
    try {
        const userId = req.user.id;
        const { title, description, category, quantity, city, address, postalCode, province, latitude, longitude, images } = req.body;

        // Validaciones básicas
        if (!title || !description || !category || !quantity || !city) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        let parsedLatitude = latitude ? parseFloat(latitude) : null;
        let parsedLongitude = longitude ? parseFloat(longitude) : null;

        if ((parsedLatitude === null || Number.isNaN(parsedLatitude)) || (parsedLongitude === null || Number.isNaN(parsedLongitude))) {
            parsedLatitude = null;
            parsedLongitude = null;
        }

        if (parsedLatitude === null || parsedLongitude === null) {
            try {
                const geo = await geocodeAddress({ address, city, province, postalCode });
                if (geo) {
                    parsedLatitude = geo.latitude;
                    parsedLongitude = geo.longitude;
                }
            } catch (geoError) {
                console.warn('No se pudo geocodificar la dirección:', geoError.message);
            }
        }
        // Crear la donación
        const donation = await prisma.donation.create({
            data: {
                title,
                description,
                category,
                quantity: String(quantity),
                city,
                address: address || null,
                postalCode: postalCode || null,
                province: province || null,
                latitude: parsedLatitude,
                longitude: parsedLongitude,
                images: images || [],
                donorId: userId,
                status: 'DISPONIBLE',
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        location: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Donación creada exitosamente',
            donation,
        });
    } catch (error) {
        console.error('Error al crear donación:', error);
        res.status(500).json({ error: 'Error al crear la donación' });
    }
}

/**
 * Obtener todas las donaciones disponibles
 * Cualquier usuario autenticado puede ver las donaciones (excepto las propias)
 */
async function getAvailableDonations(req, res) {
    try {
        const userId = req.user.id;
        const { category, location, search, includeOwn } = req.query;

        // Construir filtros
        const where = {
            status: 'DISPONIBLE',
        };

        if (includeOwn !== 'true' && includeOwn !== '1') {
            // Excluir las donaciones propias
            where.donorId = {
                not: userId,
            };
        }

        if (category) {
            where.category = category;
        }

        if (location) {
            where.location = {
                contains: location,
                mode: 'insensitive',
            };
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const donations = await prisma.donation.findMany({
            where,
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        location: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ donations });
    } catch (error) {
        console.error('Error al obtener donaciones:', error);
        res.status(500).json({ error: 'Error al obtener donaciones' });
    }
}

/**
 * Obtener donaciones del usuario actual
 */
async function getMyDonations(req, res) {
    try {
        const userId = req.user.id;

        const donations = await prisma.donation.findMany({
            where: {
                donorId: userId,
            },
            include: {
                assignedOng: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ donations });
    } catch (error) {
        console.error('Error al obtener mis donaciones:', error);
        res.status(500).json({ error: 'Error al obtener tus donaciones' });
    }
}

/**
 * Obtener una donación por ID
 */
async function getDonationById(req, res) {
    try {
        const { id } = req.params;

        const donation = await prisma.donation.findUnique({
            where: { id },
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        location: true,
                    },
                },
                assignedOng: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                        location: true,
                    },
                },
            },
        });

        if (!donation) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        res.json({ donation });
    } catch (error) {
        console.error('Error al obtener donación:', error);
        res.status(500).json({ error: 'Error al obtener la donación' });
    }
}

/**
 * Actualizar una donación
 * Solo el creador puede actualizar su donación
 */
async function updateDonation(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description, category, quantity, city, address, postalCode, province, images } = req.body;

        // Verificar que la donación existe y pertenece al usuario
        const existingDonation = await prisma.donation.findUnique({
            where: { id },
        });

        if (!existingDonation) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        if (existingDonation.donorId !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para actualizar esta donación' });
        }

        // No permitir actualizar si ya está asignada o entregada
        if (existingDonation.status !== 'DISPONIBLE') {
            return res.status(400).json({ error: 'No puedes actualizar una donación que ya está asignada o entregada' });
        }

        // Actualizar la donación
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (quantity !== undefined) updateData.quantity = String(quantity);
        if (city !== undefined) updateData.city = city;
        if (address !== undefined) updateData.address = address;
        if (postalCode !== undefined) updateData.postalCode = postalCode;
        if (province !== undefined) updateData.province = province;
        if (images !== undefined) updateData.images = images;

        const donation = await prisma.donation.update({
            where: { id },
            data: updateData,
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        location: true,
                        role: true,
                    },
                },
            },
        });

        res.json({
            message: 'Donación actualizada exitosamente',
            donation,
        });
    } catch (error) {
        console.error('Error al actualizar donación:', error);
        res.status(500).json({ error: 'Error al actualizar la donación' });
    }
}

/**
 * Eliminar una donación
 * Solo el creador puede eliminar su donación
 */
async function deleteDonation(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verificar que la donación existe y pertenece al usuario
        const donation = await prisma.donation.findUnique({
            where: { id },
        });

        if (!donation) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        if (donation.donorId !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta donación' });
        }

        // No permitir eliminar si ya está asignada
        if (donation.status === 'ASIGNADO') {
            return res.status(400).json({ error: 'No puedes eliminar una donación que ya está asignada' });
        }

        await prisma.donation.delete({
            where: { id },
        });

        res.json({ message: 'Donación eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar donación:', error);
        res.status(500).json({ error: 'Error al eliminar la donación' });
    }
}

/**
 * Solicitar una donación
 * Solo usuarios con rol ONG pueden solicitar donaciones
 */
async function requestDonation(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verificar que el usuario es una ONG
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { ong: true },
        });

        if (user.role !== 'ONG') {
            return res.status(403).json({ error: 'Solo las ONGs pueden solicitar donaciones' });
        }

        if (!user.ong) {
            return res.status(400).json({ error: 'No se encontró información de la ONG' });
        }

        // Verificar que la ONG está aprobada
        if (user.ong.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Tu ONG debe estar aprobada para solicitar donaciones' });
        }

        // Verificar que la donación existe y está disponible
        const donation = await prisma.donation.findUnique({
            where: { id },
        });

        if (!donation) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        if (donation.status !== 'DISPONIBLE') {
            return res.status(400).json({ error: 'Esta donación ya no está disponible' });
        }

        // No permitir solicitar su propia donación
        if (donation.donorId === userId) {
            return res.status(400).json({ error: 'No puedes solicitar tu propia donación' });
        }

        // Asignar la donación a la ONG
        const updatedDonation = await prisma.donation.update({
            where: { id },
            data: {
                status: 'ASIGNADO',
                assignedOngId: user.ong.id,
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        location: true,
                    },
                },
                assignedOng: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                    },
                },
            },
        });

        // Cerrar cualquier conversación abierta previa y crear una nueva
        await prisma.conversation.updateMany({
            where: { donationId: id, status: 'OPEN' },
            data: { status: 'CLOSED', closedAt: new Date() },
        });

        const conversation = await prisma.conversation.create({
            data: {
                donationId: id,
                ongId: user.ong.id,
                status: 'OPEN',
            },
        });

        res.json({
            message: 'Donación solicitada exitosamente',
            donation: updatedDonation,
            conversation,
        });
    } catch (error) {
        console.error('Error al solicitar donación:', error);
        res.status(500).json({ error: 'Error al solicitar la donación' });
    }
}

/**
 * Rechazar una donación asignada
 * Solo el creador de la donación puede rechazarla
 */
async function rejectDonation(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const donation = await prisma.donation.findUnique({
            where: { id },
        });

        if (!donation) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        if (donation.donorId !== userId) {
            return res.status(403).json({ error: 'Solo el creador puede rechazar la donación' });
        }

        if (donation.status !== 'ASIGNADO') {
            return res.status(400).json({ error: 'La donación debe estar asignada para rechazarla' });
        }

        const updatedDonation = await prisma.donation.update({
            where: { id },
            data: {
                status: 'DISPONIBLE',
                assignedOngId: null,
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        location: true,
                    },
                },
            },
        });

        // Cerrar chat asociado a la donación
        await prisma.conversation.updateMany({
            where: { donationId: id, status: 'OPEN' },
            data: { status: 'CLOSED', closedAt: new Date() },
        });

        res.json({
            message: 'Donación rechazada y puesta nuevamente como disponible',
            donation: updatedDonation,
        });
    } catch (error) {
        console.error('Error al rechazar donación:', error);
        res.status(500).json({ error: 'Error al rechazar la donación' });
    }
}

/**
 * Marcar una donación como entregada
 * Solo el creador de la donación puede marcarla como entregada
 */
async function markAsDelivered(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verificar que la donación existe y pertenece al usuario
        const donation = await prisma.donation.findUnique({
            where: { id },
        });

        if (!donation) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        if (donation.donorId !== userId) {
            return res.status(403).json({ error: 'Solo el creador puede marcar la donación como entregada' });
        }

        if (donation.status !== 'ASIGNADO') {
            return res.status(400).json({ error: 'La donación debe estar asignada para marcarla como entregada' });
        }

        const updatedDonation = await prisma.donation.update({
            where: { id },
            data: {
                status: 'ENTREGADO',
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        location: true,
                    },
                },
                assignedOng: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Cerrar chat asociado a la donación
        await prisma.conversation.updateMany({
            where: { donationId: id, status: 'OPEN' },
            data: { status: 'CLOSED', closedAt: new Date() },
        });

        res.json({
            message: 'Donación marcada como entregada',
            donation: updatedDonation,
        });
    } catch (error) {
        console.error('Error al marcar donación como entregada:', error);
        res.status(500).json({ error: 'Error al actualizar el estado de la donación' });
    }
}

/**
 * Obtener donaciones asignadas a mi ONG
 * Solo para usuarios con rol ONG
 */
async function getMyAssignedDonations(req, res) {
    try {
        const userId = req.user.id;

        // Verificar que el usuario es una ONG
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { ong: true },
        });

        if (user.role !== 'ONG') {
            return res.status(403).json({ error: 'Solo las ONGs pueden acceder a esta información' });
        }

        if (!user.ong) {
            return res.status(400).json({ error: 'No se encontró información de la ONG' });
        }

        const donations = await prisma.donation.findMany({
            where: {
                assignedOngId: user.ong.id,
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        location: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ donations });
    } catch (error) {
        console.error('Error al obtener donaciones asignadas:', error);
        res.status(500).json({ error: 'Error al obtener las donaciones asignadas' });
    }
}

module.exports = {
    createDonation,
    getAvailableDonations,
    getMyDonations,
    getDonationById,
    updateDonation,
    deleteDonation,
    requestDonation,
    rejectDonation,
    markAsDelivered,
    getMyAssignedDonations,
};


