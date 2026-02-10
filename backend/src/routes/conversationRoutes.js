const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticate } = require('../middlewares/auth');


router.get('/', authenticate, conversationController.listConversations);

router.get('/donation/:donationId', authenticate, conversationController.getConversationByDonation);

router.get('/need/:needId', authenticate, conversationController.getConversationByNeed);

router.post('/need/:needId', authenticate, conversationController.openNeedConversation);

router.get('/:conversationId', authenticate, conversationController.getConversationById);

router.post('/:conversationId/messages', authenticate, conversationController.postMessage);

module.exports = router;
