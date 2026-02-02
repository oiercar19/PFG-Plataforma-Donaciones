const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticate } = require('../middlewares/auth');

// Todas las rutas requieren autenticación

// Crear donación - Cualquier usuario autenticado
router.post('/', authenticate, donationController.createDonation);

// Obtener donaciones disponibles - Cualquier usuario autenticado
router.get('/available', authenticate, donationController.getAvailableDonations);

// Obtener mis donaciones creadas - Cualquier usuario autenticado
router.get('/my-donations', authenticate, donationController.getMyDonations);

// Obtener donaciones asignadas a mi ONG - Solo ONGs
router.get('/assigned', authenticate, donationController.getMyAssignedDonations);

// Obtener una donación por ID - Cualquier usuario autenticado
router.get('/:id', authenticate, donationController.getDonationById);

// Actualizar donación - Solo el creador
router.put('/:id', authenticate, donationController.updateDonation);

// Eliminar donación - Solo el creador
router.delete('/:id', authenticate, donationController.deleteDonation);

// Solicitar/asignar donación - Solo ONGs
router.post('/:id/request', authenticate, donationController.requestDonation);

// Marcar donación como entregada - Solo el creador
router.post('/:id/delivered', authenticate, donationController.markAsDelivered);

module.exports = router;
