const prisma = require('../config/database');

async function listConversations(req, res) {
    try {
        const userId = req.user.id;
        const status = (req.query.status || 'OPEN').toUpperCase();

        if (!['OPEN', 'CLOSED'].includes(status)) {
            return res.status(400).json({ error: 'Estado de conversaci?n inv?lido' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'ONG no encontrada' });
            }

            ongId = ong.id;
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                status,
                OR: [
                    { donation: { donorId: userId } },
                    ...(ongId ? [{ ongId }, { donation: { assignedOngId: ongId } }] : []),
                ],
            },
            include: {
                donation: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        status: true,
                        donor: { select: { id: true, username: true } },
                        assignedOngId: true,
                        assignedOng: { select: { id: true, name: true, contactEmail: true, contactPhone: true } },
                    },
                },
                ong: { select: { id: true, name: true, contactEmail: true, contactPhone: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, username: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conversation) => {
                const lastReadAt = req.user.role === 'ONG' ? conversation.ongLastReadAt : conversation.donorLastReadAt;
                const where = {
                    conversationId: conversation.id,
                    senderId: { not: userId },
                };

                if (lastReadAt) {
                    where.createdAt = { gt: lastReadAt };
                }

                const unreadCount = await prisma.message.count({ where });
                return { ...conversation, unreadCount };
            })
        );

        res.json({ conversations: conversationsWithUnread });
    } catch (error) {
        console.error('Error al listar conversaciones:', error);
        res.status(500).json({ error: 'Error al obtener conversaciones' });
    }
}

async function getConversationById(req, res) {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                donation: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        status: true,
                        donorId: true,
                        donor: { select: { id: true, username: true } },
                        assignedOngId: true,
                        assignedOng: { select: { id: true, name: true, contactEmail: true, contactPhone: true } },
                    },
                },
                ong: { select: { id: true, name: true, contactEmail: true, contactPhone: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, username: true, role: true },
                        },
                        ong: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Chat no encontrado' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'ONG no encontrada' });
            }

            ongId = ong.id;
        }

        const isDonor = conversation.donation.donorId === userId;
        const isAssignedOng = ongId && (conversation.ongId === ongId || conversation.donation.assignedOngId === ongId);

        if (isDonor) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { donorLastReadAt: new Date() },
            });
        } else if (isAssignedOng) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { ongLastReadAt: new Date() },
            });
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Error al obtener conversaci?n:', error);
        res.status(500).json({ error: 'Error al obtener el chat' });
    }
}

async function getConversationByDonation(req, res) {
    try {
        const userId = req.user.id;
        const { donationId } = req.params;

        const conversation = await prisma.conversation.findFirst({
            where: {
                donationId,
                status: 'OPEN',
            },
            include: {
                donation: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        status: true,
                        donorId: true,
                        donor: { select: { id: true, username: true } },
                        assignedOngId: true,
                        assignedOng: { select: { id: true, name: true, contactEmail: true, contactPhone: true } },
                    },
                },
                ong: { select: { id: true, name: true, contactEmail: true, contactPhone: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, username: true, role: true },
                        },
                        ong: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Chat no encontrado' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'ONG no encontrada' });
            }

            ongId = ong.id;
        }

        const isDonor = conversation.donation.donorId === userId;
        const isAssignedOng = ongId && (conversation.ongId === ongId || conversation.donation.assignedOngId === ongId);

        if (isDonor) {
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { donorLastReadAt: new Date() },
            });
        } else if (isAssignedOng) {
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { ongLastReadAt: new Date() },
            });
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Error al obtener conversaci?n:', error);
        res.status(500).json({ error: 'Error al obtener el chat' });
    }
}

async function postMessage(req, res) {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const content = (req.body.content || '').trim();

        if (!content) {
            return res.status(400).json({ error: 'El mensaje no puede estar vac?o' });
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                donation: {
                    select: {
                        donorId: true,
                        assignedOngId: true,
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Chat no encontrado' });
        }

        if (conversation.status !== 'OPEN') {
            return res.status(400).json({ error: 'La conversaci?n no est? activa' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'ONG no encontrada' });
            }

            ongId = ong.id;
        }

        const isDonor = conversation.donation.donorId === userId;
        const isAssignedOng = ongId && (conversation.ongId === ongId || conversation.donation.assignedOngId === ongId);

        if (!isDonor && !isAssignedOng) {
            return res.status(403).json({ error: 'No tienes permiso para enviar mensajes en este chat' });
        }

        const message = await prisma.message.create({
            data: {
                content,
                conversationId,
                senderId: userId,
                ongId,
            },
            include: {
                sender: { select: { id: true, username: true, role: true } },
                ong: { select: { id: true, name: true } },
            },
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        res.status(201).json({ message });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error al enviar el mensaje' });
    }
}

module.exports = {
    listConversations,
    getConversationById,
    getConversationByDonation,
    postMessage,
};
