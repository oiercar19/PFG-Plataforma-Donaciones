const express = require('express');
const router = express.Router();
const needController = require('../controllers/needController');
const { authenticate, requireApprovedOng } = require('../middlewares/auth');

router.get('/', authenticate, needController.listNeeds);
router.get('/my', authenticate, requireApprovedOng, needController.getMyNeeds);
router.get('/:id', authenticate, needController.getNeedById);
router.post('/', authenticate, requireApprovedOng, needController.createNeed);
router.post('/:id/close', authenticate, requireApprovedOng, needController.closeNeed);

module.exports = router;
