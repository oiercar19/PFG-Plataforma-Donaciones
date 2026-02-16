const prisma = require('../config/database');
const { geocodeAddress } = require('../services/geocoding');

function toRadians(value) {
    return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const originLat = toRadians(lat1);
    const destinationLat = toRadians(lat2);

    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function roundTo2(value) {
    return Math.round(value * 100) / 100;
}

function formatAddress({ address, postalCode, city, province, location }) {
    return [address, postalCode, city || location, province].filter(Boolean).join(', ');
}

const SHIPPING_TARIFFS = [
    { maxWeightKg: 1, prices: [4.9, 7.9, 10.9, 13.9], extraPerPackage: 2.5 },
    { maxWeightKg: 3, prices: [5.9, 8.9, 11.9, 14.9], extraPerPackage: 3 },
    { maxWeightKg: 5, prices: [6.9, 9.9, 12.9, 15.9], extraPerPackage: 3.5 },
    { maxWeightKg: 10, prices: [8.9, 12.9, 16.9, 20.9], extraPerPackage: 4.5 },
    { maxWeightKg: 15, prices: [10.9, 15.9, 20.9, 25.9], extraPerPackage: 5.5 },
    { maxWeightKg: 20, prices: [12.9, 18.9, 24.9, 30.9], extraPerPackage: 6.5 },
    { maxWeightKg: 30, prices: [15.9, 23.9, 31.9, 39.9], extraPerPackage: 8 },
    { maxWeightKg: 40, prices: [20.9, 30.9, 40.9, 50.9], extraPerPackage: 10 },
];

function parseBooleanInput(value) {
    if (value === true || value === 1) return true;
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'si';
}

function getTariffRow(weightKg) {
    return SHIPPING_TARIFFS.find((row) => weightKg <= row.maxWeightKg) || null;
}

function calculateTariffAmount({ weightKg, packages, isRemoteZone, isExpress24h }) {
    const row = getTariffRow(weightKg);
    if (!row) {
        return { error: 'For shipments above 40 kg per order, special transport is required' };
    }

    const base = packages <= 4
        ? row.prices[packages - 1]
        : row.prices[3] + ((packages - 4) * row.extraPerPackage);

    const remoteSurcharge = isRemoteZone ? (base * 0.15) : 0;
    const expressSurcharge = isExpress24h ? (base * 0.25) : 0;
    const amount = base + remoteSurcharge + expressSurcharge;

    return {
        weightBracketMaxKg: row.maxWeightKg,
        baseAmount: roundTo2(base),
        remoteSurcharge: roundTo2(remoteSurcharge),
        expressSurcharge: roundTo2(expressSurcharge),
        amount: roundTo2(amount),
    };
}

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
                        donor: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                location: true,
                            },
                        },
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
                        donor: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                location: true,
                            },
                        },
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

async function calculateShippingCost(req, res) {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const weightKg = parseFloat(req.query.weightKg);
        const packages = parseInt(req.query.packages, 10);
        const isRemoteZone = parseBooleanInput(req.query.remoteZone);
        const isExpress24h = parseBooleanInput(req.query.express24h);

        if (!Number.isFinite(weightKg) || weightKg <= 0) {
            return res.status(400).json({ error: 'weightKg must be a number greater than 0' });
        }

        if (!Number.isInteger(packages) || packages < 1) {
            return res.status(400).json({ error: 'packages must be an integer greater than or equal to 1' });
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                donation: {
                    select: {
                        id: true,
                        donorId: true,
                        assignedOngId: true,
                        city: true,
                        address: true,
                        postalCode: true,
                        province: true,
                        latitude: true,
                        longitude: true,
                        assignedOng: {
                            select: {
                                id: true,
                                name: true,
                                city: true,
                                address: true,
                                postalCode: true,
                                province: true,
                                location: true,
                                latitude: true,
                                longitude: true,
                            },
                        },
                    },
                },
                need: {
                    select: {
                        ongId: true,
                    },
                },
                ong: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        address: true,
                        postalCode: true,
                        province: true,
                        location: true,
                        latitude: true,
                        longitude: true,
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (!conversation.donationId || !conversation.donation) {
            return res.status(400).json({ error: 'Shipping cost is only available for donation chats' });
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

        const isDonor = conversation.donation.donorId === userId;
        const isAssignedOng = Boolean(ongId) && (
            conversation.ongId === ongId ||
            conversation.donation.assignedOngId === ongId ||
            conversation.need?.ongId === ongId
        );

        if (!isDonor && !isAssignedOng) {
            return res.status(403).json({ error: 'You cannot access this chat' });
        }

        const originDonation = conversation.donation;
        const destinationOng = originDonation.assignedOng || conversation.ong;

        if (!destinationOng) {
            return res.status(400).json({ error: 'No destination ONG available for this donation chat' });
        }

        let originLatitude = originDonation.latitude;
        let originLongitude = originDonation.longitude;

        if (originLatitude === null || originLongitude === null) {
            const geocodedOrigin = await geocodeAddress({
                address: originDonation.address,
                city: originDonation.city,
                province: originDonation.province,
                postalCode: originDonation.postalCode,
            });

            if (geocodedOrigin) {
                originLatitude = geocodedOrigin.latitude;
                originLongitude = geocodedOrigin.longitude;

                await prisma.donation.update({
                    where: { id: originDonation.id },
                    data: {
                        latitude: geocodedOrigin.latitude,
                        longitude: geocodedOrigin.longitude,
                    },
                });
            }
        }

        let destinationLatitude = destinationOng.latitude;
        let destinationLongitude = destinationOng.longitude;

        if (destinationLatitude === null || destinationLongitude === null) {
            const geocodedDestination = await geocodeAddress({
                address: destinationOng.address,
                city: destinationOng.city || destinationOng.location,
                province: destinationOng.province,
                postalCode: destinationOng.postalCode,
            });

            if (geocodedDestination) {
                destinationLatitude = geocodedDestination.latitude;
                destinationLongitude = geocodedDestination.longitude;

                await prisma.ong.update({
                    where: { id: destinationOng.id },
                    data: {
                        latitude: geocodedDestination.latitude,
                        longitude: geocodedDestination.longitude,
                    },
                });
            }
        }

        const tariff = calculateTariffAmount({
            weightKg,
            packages,
            isRemoteZone,
            isExpress24h,
        });

        if (tariff.error) {
            return res.status(400).json({ error: tariff.error });
        }

        let distanceKm = null;
        if (
            originLatitude !== null
            && originLongitude !== null
            && destinationLatitude !== null
            && destinationLongitude !== null
        ) {
            distanceKm = roundTo2(haversineDistanceKm(
                originLatitude,
                originLongitude,
                destinationLatitude,
                destinationLongitude
            ));
        }

        res.json({
            shippingCost: {
                amount: tariff.amount,
                currency: 'EUR',
                distanceKm,
                weightKg: roundTo2(weightKg),
                packages,
                weightBracketMaxKg: tariff.weightBracketMaxKg,
                baseAmount: tariff.baseAmount,
                remoteSurcharge: tariff.remoteSurcharge,
                expressSurcharge: tariff.expressSurcharge,
                isRemoteZone,
                isExpress24h,
                origin: formatAddress(originDonation),
                destination: formatAddress(destinationOng),
            },
        });
    } catch (error) {
        console.error('Error calculating shipping cost:', error);
        res.status(500).json({ error: 'Error calculating shipping cost' });
    }
}

module.exports = {
    listConversations,
    getConversationById,
    getConversationByDonation,
    getConversationByNeed,
    openNeedConversation,
    postMessage,
    calculateShippingCost,
};
