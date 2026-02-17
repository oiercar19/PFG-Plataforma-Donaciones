async function verifyGoogleIdToken(idToken) {
    if (!idToken) {
        throw new Error('Google ID token requerido');
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
        throw new Error('GOOGLE_CLIENT_ID no configurado');
    }

    const url = new URL('https://oauth2.googleapis.com/tokeninfo');
    url.searchParams.set('id_token', idToken);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error('Google ID token invalido');
    }

    const payload = await response.json();

    if (payload.aud !== googleClientId) {
        throw new Error('Google ID token no corresponde al cliente configurado');
    }

    if (payload.email_verified !== 'true') {
        throw new Error('La cuenta de Google no tiene email verificado');
    }

    if (!payload.email || !payload.sub) {
        throw new Error('Google ID token sin datos requeridos');
    }

    return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.given_name || '',
    };
}

module.exports = {
    verifyGoogleIdToken,
};
