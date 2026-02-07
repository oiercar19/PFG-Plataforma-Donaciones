const https = require('https');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

function normalizeText(value) {
    if (!value) return '';
    return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeAddressVariants(address) {
    const base = normalizeText(address);
    if (!base) return [];

    const variants = new Set([base]);

    const calleMatch = /^calle\s+/i;
    if (calleMatch.test(base)) {
        const without = base.replace(calleMatch, '');
        variants.add(without);
        variants.add(`C/ ${without}`);
    }

    const cSlashMatch = /^c\/\s*/i;
    if (cSlashMatch.test(base)) {
        const expanded = base.replace(cSlashMatch, 'Calle ');
        variants.add(expanded);
    }

    return Array.from(variants);
}

function normalizeCityVariants(city) {
    const base = normalizeText(city);
    if (!base) return [];

    const variants = new Set([base]);
    if (/bilbao/i.test(base)) {
        variants.add(base.replace(/bilbao/gi, 'Bilbo'));
    }
    if (/bilbo/i.test(base)) {
        variants.add(base.replace(/bilbo/gi, 'Bilbao'));
    }
    return Array.from(variants);
}

function buildQueries({ address, city, province, postalCode }) {
    const addressVariants = normalizeAddressVariants(address);
    const cityVariants = normalizeCityVariants(city);
    const normalizedProvince = normalizeText(province);
    const normalizedPostalCode = normalizeText(postalCode);
    const country = 'España';

    const queries = [];
    const pushQuery = (parts) => {
        const query = parts.filter(Boolean).join(', ');
        if (query && !queries.includes(query)) {
            queries.push(query);
        }
    };

    if (addressVariants.length > 0) {
        for (const addressVariant of addressVariants) {
            for (const cityVariant of cityVariants.length ? cityVariants : ['']) {
                pushQuery([addressVariant, normalizedPostalCode, cityVariant, normalizedProvince, country]);
                pushQuery([addressVariant, cityVariant, normalizedProvince, country]);
                pushQuery([addressVariant, cityVariant, country]);
            }
        }
    }

    for (const cityVariant of cityVariants) {
        pushQuery([cityVariant, normalizedProvince, country]);
        pushQuery([cityVariant, country]);
        if (normalizedPostalCode) {
            pushQuery([normalizedPostalCode, cityVariant, country]);
        }
    }

    return queries;
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

function requestJson(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers }, (res) => {
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const data = JSON.parse(rawData);
                    resolve({ statusCode: res.statusCode, data });
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });
    });
}

async function geocodeWithNominatim(query) {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', query);
    url.searchParams.set('countrycodes', 'es');
    if (process.env.NOMINATIM_EMAIL) {
        url.searchParams.set('email', process.env.NOMINATIM_EMAIL);
    }

    const headers = {
        'User-Agent': getUserAgent(),
        'Accept': 'application/json',
        'Accept-Language': 'es',
    };

    const response = await requestJson(url, headers);
    if (response.statusCode && response.statusCode >= 400) {
        return null;
    }

    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        };
    }
    return null;
}

async function geocodeWithOpenMeteo(query) {
    const url = new URL(OPEN_METEO_URL);
    url.searchParams.set('name', query);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'es');
    url.searchParams.set('format', 'json');
    url.searchParams.set('country', 'ES');

    const response = await requestJson(url);
    if (response.statusCode && response.statusCode >= 400) {
        return null;
    }

    const data = response.data;
    if (data && Array.isArray(data.results) && data.results.length > 0) {
        const item = data.results[0];
        return {
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
        };
    }
    return null;
}

function geocodeAddress({ address, city, province, postalCode }) {
    const queries = buildQueries({ address, city, province, postalCode });
    if (!queries.length) {
        return Promise.resolve(null);
    }

    return (async () => {
        for (const query of queries) {
            try {
                const nominatimResult = await geocodeWithNominatim(query);
                if (nominatimResult) {
                    return nominatimResult;
                }
            } catch (error) {
                // Ignorar y probar siguiente query
            }
        }

        for (const query of queries) {
            try {
                const fallbackResult = await geocodeWithOpenMeteo(query);
                if (fallbackResult) {
                    return fallbackResult;
                }
            } catch (error) {
                // Ignorar y probar siguiente query
            }
        }

        return null;
    })();
}

module.exports = {
    geocodeAddress,
};
