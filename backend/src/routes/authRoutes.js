const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const upload = require('../config/multer');

// Rutas públicas
router.post('/register/donor', authController.registerDonor);
router.post('/register/ong', upload.array('documents', 5), authController.registerOng);
router.post('/login', authController.login);
router.get('/ongs', authController.getPublicOngs);

// Rutas protegidas
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// Rutas para ONGs
router.get('/my-ong', authenticate, authController.getMyOngData);
router.put('/my-ong', authenticate, authController.updateMyOngData);

module.exports = router;
