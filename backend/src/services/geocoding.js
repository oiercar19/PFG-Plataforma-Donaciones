const https = require('https');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function buildQuery({ address, city, province, postalCode }) {
    return [address, postalCode, city, province].filter(Boolean).join(', ');
}

function getUserAgent() {
    if (process.env.NOMINATIM_USER_AGENT) {
        return process.env.NOMINATIM_USER_AGENT;
    }
    if (process.env.NOMINATIM_EMAIL) {
        return `donation-platform/1.0 (${process.env.NOMINATIM_EMAIL})`;
    }
    return 'donation-platform/1.0';
}

function geocodeAddress({ address, city, province, postalCode }) {
    const query = buildQuery({ address, city, province, postalCode });
    if (!query) {
        return Promise.resolve(null);
    }

    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', query);

    const options = {
        headers: {
            'User-Agent': getUserAgent(),
            'Accept': 'application/json',
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.get(url, options, (res) => {
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const data = JSON.parse(rawData);
                    if (Array.isArray(data) && data.length > 0) {
                        const item = data[0];
                        return resolve({
                            latitude: parseFloat(item.lat),
                            longitude: parseFloat(item.lon),
                        });
                    }
                    return resolve(null);
                } catch (error) {
                    return reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });
    });
}

module.exports = {
    geocodeAddress,
};
