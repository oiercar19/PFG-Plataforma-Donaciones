const prisma = require('../config/database');

function parseUrgent(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    }
    return false;
}

async function createNeed(req, res) {
    try {
        const { title, description, category, quantity, urgent } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const need = await prisma.need.create({
            data: {
                title,
                description,
                category,
                quantity: quantity !== undefined && quantity !== null ? String(quantity) : null,
                urgent: parseUrgent(urgent),
                status: 'OPEN',
                ongId: req.ong.id,
            },
            include: {
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
        });

        res.status(201).json({
            message: 'Need created successfully',
            need,
        });
    } catch (error) {
        console.error('Error creating need:', error);
        res.status(500).json({ error: 'Error creating need' });
    }
}

async function listNeeds(req, res) {
    try {
        const { search, category, urgent, status } = req.query;
        const where = {};

        if (status && ['OPEN', 'CLOSED'].includes(status.toUpperCase())) {
            where.status = status.toUpperCase();
        } else {
            where.status = 'OPEN';
        }

        if (category) {
            where.category = category;
        }

        if (urgent !== undefined && urgent !== '') {
            where.urgent = parseUrgent(urgent);
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const needs = await prisma.need.findMany({
            where,
            include: {
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
                _count: { select: { conversations: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ needs });
    } catch (error) {
        console.error('Error listing needs:', error);
        res.status(500).json({ error: 'Error listing needs' });
    }
}

async function getNeedById(req, res) {
    try {
        const { id } = req.params;

        const need = await prisma.need.findUnique({
            where: { id },
            include: {
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
                _count: { select: { conversations: true } },
            },
        });

        if (!need) {
            return res.status(404).json({ error: 'Need not found' });
        }

        res.json({ need });
    } catch (error) {
        console.error('Error getting need:', error);
        res.status(500).json({ error: 'Error getting need' });
    }
}

async function getMyNeeds(req, res) {
    try {
        const { status } = req.query;
        const where = { ongId: req.ong.id };

        if (status && ['OPEN', 'CLOSED'].includes(status.toUpperCase())) {
            where.status = status.toUpperCase();
        }

        const needs = await prisma.need.findMany({
            where,
            include: {
                _count: { select: { conversations: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ needs });
    } catch (error) {
        console.error('Error getting my needs:', error);
        res.status(500).json({ error: 'Error getting needs' });
    }
}

async function closeNeed(req, res) {
    try {
        const { id } = req.params;

        const existingNeed = await prisma.need.findUnique({
            where: { id },
        });

        if (!existingNeed) {
            return res.status(404).json({ error: 'Need not found' });
        }

        if (existingNeed.ongId !== req.ong.id) {
            return res.status(403).json({ error: 'You can only close your own needs' });
        }

        if (existingNeed.status === 'CLOSED') {
            return res.status(200).json({ message: 'Need already closed', need: existingNeed });
        }

        const need = await prisma.need.update({
            where: { id },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
            },
        });

        await prisma.conversation.updateMany({
            where: { needId: id, status: 'OPEN' },
            data: { status: 'CLOSED', closedAt: new Date() },
        });

        res.json({ message: 'Need closed successfully', need });
    } catch (error) {
        console.error('Error closing need:', error);
        res.status(500).json({ error: 'Error closing need' });
    }
}

module.exports = {
    createNeed,
    listNeeds,
    getNeedById,
    getMyNeeds,
    closeNeed,
};
