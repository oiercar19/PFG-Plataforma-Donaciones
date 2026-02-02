const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// Estadísticas
router.get('/stats', adminController.getAdminStats);

// Gestión de ONGs
router.get('/ongs', adminController.getAllOngs);
router.get('/ongs/pending', adminController.getPendingOngs);
router.get('/ongs/:id', adminController.getOngById);
router.put('/ongs/:id/approve', adminController.approveOng);
router.put('/ongs/:id/reject', adminController.rejectOng);

module.exports = router;
