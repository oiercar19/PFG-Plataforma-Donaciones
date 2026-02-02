const jwt = require('jsonwebtoken');
const config = require('../config/jwt');

/**
 * Genera un JWT para un usuario
 */
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
    };

    return jwt.sign(payload, config.secret, {
        expiresIn: config.expiresIn,
    });
}

/**
 * Verifica y decodifica un JWT
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, config.secret);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken,
};
