const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticate } = require('../middlewares/auth');

// Todas las rutas requieren autenticaci?n

// Listar conversaciones (abiertas o cerradas)
router.get('/', authenticate, conversationController.listConversations);

// Obtener conversaci?n activa por donaci?n
router.get('/donation/:donationId', authenticate, conversationController.getConversationByDonation);

// Obtener conversaci?n por ID
router.get('/:conversationId', authenticate, conversationController.getConversationById);

// Enviar mensaje a una conversaci?n
router.post('/:conversationId/messages', authenticate, conversationController.postMessage);

module.exports = router;
