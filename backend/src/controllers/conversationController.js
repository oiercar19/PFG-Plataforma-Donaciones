const prisma = require('../config/database');

async function listConversations(req, res) {
    try {
        const userId = req.user.id;
        const status = (req.query.status || 'OPEN').toUpperCase();

        if (!['OPEN', 'CLOSED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid conversation status' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'Ong not found' });
            }

            ongId = ong.id;
        }

        const orFilters = [
            { donation: { donorId: userId } },
            { donorId: userId },
        ];

        if (ongId) {
            orFilters.push({ ongId });
            orFilters.push({ donation: { assignedOngId: ongId } });
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                status,
                OR: orFilters,
            },
            include: {
                donation: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        status: true,
                        images: true,
                        donor: { select: { id: true, username: true } },
                        assignedOngId: true,
                        assignedOng: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                                contactPhone: true,
                                city: true,
                                address: true,
                                postalCode: true,
                                location: true,
                            },
                        },
                    },
                },
                need: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        urgent: true,
                        status: true,
                        ong: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                                contactPhone: true,
                                city: true,
                                address: true,
                                postalCode: true,
                                location: true,
                            },
                        },
                    },
                },
                donor: { select: { id: true, username: true } },
                ong: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                        city: true,
                        address: true,
                        postalCode: true,
                        location: true,
                    },
                },
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
        console.error('Error listing conversations:', error);
        res.status(500).json({ error: 'Error listing conversations' });
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
                        assignedOng: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                                contactPhone: true,
                                city: true,
                                address: true,
                                postalCode: true,
                                location: true,
                            },
                        },
                    },
                },
                need: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        urgent: true,
                        status: true,
                        ongId: true,
                        ong: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                                contactPhone: true,
                                city: true,
                                address: true,
                                postalCode: true,
                                location: true,
                            },
                        },
                    },
                },
                donor: { select: { id: true, username: true } },
                ong: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                        city: true,
                        address: true,
                        postalCode: true,
                        location: true,
                    },
                },
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
            return res.status(404).json({ error: 'Chat not found' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'Ong not found' });
            }

            ongId = ong.id;
        }

        const isDonation = Boolean(conversation.donationId);
        const isNeed = Boolean(conversation.needId);

        const isDonor = isDonation
            ? conversation.donation?.donorId === userId
            : conversation.donorId === userId;

        const isAssignedOng = Boolean(ongId) && (
            conversation.ongId === ongId ||
            (isDonation && conversation.donation?.assignedOngId === ongId) ||
            (isNeed && conversation.need?.ongId === ongId)
        );

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
        console.error('Error getting conversation:', error);
        res.status(500).json({ error: 'Error getting chat' });
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
                        assignedOng: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                                contactPhone: true,
                                city: true,
                                address: true,
                                postalCode: true,
                                location: true,
                            },
                        },
                    },
                },
                ong: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                        city: true,
                        address: true,
                        postalCode: true,
                        location: true,
                    },
                },
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
            return res.status(404).json({ error: 'Chat not found' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'Ong not found' });
            }

            ongId = ong.id;
        }

        const isDonor = conversation.donation?.donorId === userId;
        const isAssignedOng = ongId && (conversation.ongId === ongId || conversation.donation?.assignedOngId === ongId);

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
        console.error('Error getting conversation:', error);
        res.status(500).json({ error: 'Error getting chat' });
    }
}

async function getConversationByNeed(req, res) {
    try {
        const userId = req.user.id;
        const { needId } = req.params;

        const conversation = await prisma.conversation.findFirst({
            where: {
                needId,
                donorId: userId,
                status: 'OPEN',
            },
            include: {
                need: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        urgent: true,
                        status: true,
                        ong: {
                            select: {
                                id: true,
                                name: true,
                                contactEmail: true,
                                contactPhone: true,
                                city: true,
                                address: true,
                                postalCode: true,
                                location: true,
                            },
                        },
                    },
                },
                ong: {
                    select: {
                        id: true,
                        name: true,
                        contactEmail: true,
                        contactPhone: true,
                        city: true,
                        address: true,
                        postalCode: true,
                        location: true,
                    },
                },
                donor: { select: { id: true, username: true } },
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
            return res.status(404).json({ error: 'Chat not found' });
        }

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { donorLastReadAt: new Date() },
        });

        res.json({ conversation });
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ error: 'Error getting chat' });
    }
}

async function openNeedConversation(req, res) {
    try {
        const userId = req.user.id;
        const { needId } = req.params;

        if (req.user.role === 'ONG') {
            return res.status(403).json({ error: 'Only donors can open this chat' });
        }

        const need = await prisma.need.findUnique({
            where: { id: needId },
        });

        if (!need) {
            return res.status(404).json({ error: 'Need not found' });
        }

        if (need.status !== 'OPEN') {
            return res.status(400).json({ error: 'This need is closed' });
        }

        let conversation = await prisma.conversation.findFirst({
            where: {
                needId,
                donorId: userId,
                status: 'OPEN',
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    needId,
                    donorId: userId,
                    ongId: need.ongId,
                    status: 'OPEN',
                },
            });
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Error opening need chat:', error);
        res.status(500).json({ error: 'Error opening chat' });
    }
}

async function postMessage(req, res) {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const content = (req.body.content || '').trim();

        if (!content) {
            return res.status(400).json({ error: 'Message cannot be empty' });
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
                need: {
                    select: {
                        ongId: true,
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (conversation.status !== 'OPEN') {
            return res.status(400).json({ error: 'Conversation is not active' });
        }

        let ongId = null;
        if (req.user.role === 'ONG') {
            const ong = await prisma.ong.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!ong) {
                return res.status(404).json({ error: 'Ong not found' });
            }

            ongId = ong.id;
        }

        const isDonation = Boolean(conversation.donationId);
        const isNeed = Boolean(conversation.needId);

        const isDonor = isDonation
            ? conversation.donation?.donorId === userId
            : conversation.donorId === userId;

        const isAssignedOng = Boolean(ongId) && (
            conversation.ongId === ongId ||
            (isDonation && conversation.donation?.assignedOngId === ongId) ||
            (isNeed && conversation.need?.ongId === ongId)
        );

        if (!isDonor && !isAssignedOng) {
            return res.status(403).json({ error: 'You cannot send messages in this chat' });
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
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
}

module.exports = {
    listConversations,
    getConversationById,
    getConversationByDonation,
    getConversationByNeed,
    openNeedConversation,
    postMessage,
};
