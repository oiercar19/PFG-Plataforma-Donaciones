const https = require('https');
const dns = require('dns').promises;
const nodemailer = require('nodemailer');

function isSmtpConfigured() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_FROM_EMAIL &&
        process.env.SMTP_FROM_NAME
    );
}

function isMailjetConfigured() {
    return Boolean(
        process.env.MAILJET_API_KEY &&
        process.env.MAILJET_API_SECRET &&
        process.env.MAILJET_FROM_EMAIL &&
        process.env.MAILJET_FROM_NAME
    );
}

function sendMailjetEmail(payload) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(
            `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_API_SECRET}`
        ).toString('base64');

        const data = JSON.stringify(payload);
        const req = https.request(
            {
                hostname: 'api.mailjet.com',
                path: '/v3.1/send',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${auth}`,
                    'Content-Length': Buffer.byteLength(data),
                },
            },
            (res) => {
                let body = '';

                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ statusCode: res.statusCode, body });
                        return;
                    }

                    reject(
                        new Error(`Mailjet error ${res.statusCode}: ${body}`)
                    );
                });
            }
        );

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function sendSmtpEmail({ toEmail, toName, subject, textPart, htmlPart, supportEmail, supportName }) {
    const port = Number(process.env.SMTP_PORT);
    const secure = process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === 'true'
        : port === 465;
    const smtpHost = process.env.SMTP_HOST;
    const smtpFamily = Number(process.env.SMTP_IP_FAMILY || 0);

    let transportHost = smtpHost;
    let tlsOptions = {};

    // Some platforms (eg. Railway) might not have outbound IPv6 routes.
    // If SMTP_IP_FAMILY=4, resolve SMTP host to an IPv4 address explicitly.
    if (smtpFamily === 4 && smtpHost) {
        try {
            const ipv4Addresses = await dns.resolve4(smtpHost);
            if (ipv4Addresses.length > 0) {
                transportHost = ipv4Addresses[0];
                tlsOptions.servername = smtpHost;
            }
        } catch (resolveError) {
            console.warn(`SMTP IPv4 resolution failed for ${smtpHost}: ${resolveError.message}`);
        }
    }

    const transporter = nodemailer.createTransport({
        host: transportHost,
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: tlsOptions,
    });

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: toName ? `"${toName}" <${toEmail}>` : toEmail,
        replyTo: supportName ? `"${supportName}" <${supportEmail}>` : supportEmail,
        subject,
        text: textPart,
        headers: {
            'X-Auto-Response-Suppress': 'All',
        },
    };

    if (htmlPart) {
        mailOptions.html = htmlPart;
    }

    return transporter.sendMail(mailOptions);
}

async function sendDonorWelcomeEmail({ toEmail, toName, registeredAt }) {
    const appName = process.env.APP_NAME || 'Plataforma de Donaciones';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.MAILJET_REPLY_TO_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.MAILJET_FROM_EMAIL;
    const supportName = process.env.MAILJET_REPLY_TO_NAME || process.env.SMTP_FROM_NAME || process.env.MAILJET_FROM_NAME;
    const organizationAddress = process.env.MAILER_COMPANY_ADDRESS || 'Direccion no especificada';
    const unsubscribeUrl = process.env.MAILJET_UNSUBSCRIBE_URL;
    const registrationDate = new Date(registeredAt || Date.now()).toISOString().replace('T', ' ').replace('Z', ' UTC');
    const displayName = toName || toEmail;
    const subject = `Confirmacion de alta - ${appName}`;
    const textPart =
        `Hola ${displayName},\n\n` +
        `Este mensaje confirma que se ha creado una cuenta en ${appName} con este correo.\n` +
        `Fecha de alta: ${registrationDate}\n` +
        `Acceso: ${frontendUrl}\n\n` +
        `Como funciona la app (resumen):\n` +
        `1. Publica una donacion indicando categoria, descripcion y ubicacion.\n` +
        `2. Las ONGs interesadas podran solicitar esa donacion.\n` +
        `3. Desde tus conversaciones podras coordinar entrega y seguimiento.\n` +
        `4. Cuando se complete la entrega, podras marcarla como entregada.\n\n` +
        `Si no has sido tu, responde a ${supportEmail} para revisar el caso.\n\n` +
        `${appName}\n${organizationAddress}`;
    const htmlPart = `
        <p>Hola ${displayName},</p>
        <p>Se ha creado una cuenta en ${appName} con este correo.</p>
        <p>Fecha de alta: ${registrationDate}</p>
        <p>Acceso: ${frontendUrl}</p>
        <p><strong>Como funciona la app (resumen):</strong></p>
        <p>1. Publica una donacion indicando categoria, descripcion y ubicacion.</p>
        <p>2. Las ONGs interesadas podran solicitar esa donacion.</p>
        <p>3. Desde tus conversaciones podras coordinar entrega y seguimiento.</p>
        <p>4. Cuando se complete la entrega, podras marcarla como entregada.</p>
        <p>Si no has sido tu, responde a ${supportEmail}.</p>
        <p>${appName} - ${organizationAddress}</p>
    `;

    if (isSmtpConfigured()) {
        try {
            return await sendSmtpEmail({
                toEmail,
                toName: displayName,
                subject,
                textPart,
                htmlPart: null,
                supportEmail,
                supportName,
            });
        } catch (smtpError) {
            if (!isMailjetConfigured()) {
                throw new Error(`SMTP failed and Mailjet is not configured: ${smtpError.message}`);
            }

            console.warn(`SMTP failed, falling back to Mailjet: ${smtpError.message}`);
        }
    }

    if (!isMailjetConfigured()) {
        return { skipped: true, reason: 'SMTP and Mailjet not configured' };
    }

    const headers = {};
    if (supportEmail) {
        headers['List-Unsubscribe'] = unsubscribeUrl
            ? `<${unsubscribeUrl}>, <mailto:${supportEmail}?subject=unsubscribe>`
            : `<mailto:${supportEmail}?subject=unsubscribe>`;
    }

    const payload = {
        Messages: [
            {
                From: {
                    Email: process.env.MAILJET_FROM_EMAIL,
                    Name: process.env.MAILJET_FROM_NAME,
                },
                To: [
                    {
                        Email: toEmail,
                        Name: displayName,
                    },
                ],
                ReplyTo: {
                    Email: supportEmail,
                    Name: supportName,
                },
                Headers: headers,
                CustomID: `welcome-donor-${Date.now()}`,
                Subject: subject,
                TextPart: textPart,
                HTMLPart: htmlPart,
            },
        ],
    };

    return sendMailjetEmail(payload);
}

async function sendOngWelcomeReviewEmail({ toEmail, toName, ongName, registeredAt }) {
    const appName = process.env.APP_NAME || 'Plataforma de Donaciones';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.MAILJET_REPLY_TO_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.MAILJET_FROM_EMAIL;
    const supportName = process.env.MAILJET_REPLY_TO_NAME || process.env.SMTP_FROM_NAME || process.env.MAILJET_FROM_NAME;
    const organizationAddress = process.env.MAILER_COMPANY_ADDRESS || 'Direccion no especificada';
    const unsubscribeUrl = process.env.MAILJET_UNSUBSCRIBE_URL;
    const registrationDate = new Date(registeredAt || Date.now()).toISOString().replace('T', ' ').replace('Z', ' UTC');
    const displayName = toName || toEmail;
    const entityName = ongName || 'tu entidad social';
    const subject = `Registro recibido - cuenta en revision (${appName})`;
    const textPart =
        `Hola ${displayName},\n\n` +
        `Hemos recibido el registro de la entidad social "${entityName}" en ${appName}.\n` +
        `Fecha de alta: ${registrationDate}\n\n` +
        `Importante: tu cuenta esta en revision por un administrador.\n` +
        `Durante esta revision no podras usar todas las funcionalidades de la app.\n` +
        `Te enviaremos otro email cuando la cuenta sea aprobada y quede habilitada.\n\n` +
        `Como funciona la app para entidades sociales:\n` +
        `1. Publicas necesidades de recursos con descripcion y ubicacion.\n` +
        `2. Los donantes y tus conversaciones te ayudan a coordinar entregas.\n` +
        `3. Desde la plataforma haces seguimiento de solicitudes y estado.\n` +
        `4. Cuando una necesidad se cubre, la cierras desde tu panel.\n\n` +
        `Condiciones de buen uso para entidades sociales:\n` +
        `- Publicar informacion real, actualizada y verificable.\n` +
        `- Usar la plataforma solo para fines sociales legitimos.\n` +
        `- Mantener trato respetuoso y profesional con donantes.\n` +
        `- No solicitar pagos ni desviar recursos fuera del proceso acordado.\n` +
        `- Proteger datos personales y cumplir la normativa aplicable.\n\n` +
        `Acceso: ${frontendUrl}\n` +
        `Si no has sido tu, responde a ${supportEmail}.\n\n` +
        `${appName}\n${organizationAddress}`;
    const htmlPart = `
        <p>Hola ${displayName},</p>
        <p>Hemos recibido el registro de la entidad social "<strong>${entityName}</strong>" en ${appName}.</p>
        <p><strong>Fecha de alta:</strong> ${registrationDate}</p>
        <p><strong>Importante:</strong> tu cuenta esta en revision por un administrador. Te enviaremos otro email cuando sea aprobada y puedas usar todas las funcionalidades.</p>
        <p><strong>Como funciona la app para entidades sociales:</strong></p>
        <p>1. Publicas necesidades de recursos con descripcion y ubicacion.</p>
        <p>2. Los donantes y tus conversaciones te ayudan a coordinar entregas.</p>
        <p>3. Desde la plataforma haces seguimiento de solicitudes y estado.</p>
        <p>4. Cuando una necesidad se cubre, la cierras desde tu panel.</p>
        <p><strong>Condiciones de buen uso:</strong></p>
        <p>- Publicar informacion real, actualizada y verificable.</p>
        <p>- Usar la plataforma solo para fines sociales legitimos.</p>
        <p>- Mantener trato respetuoso y profesional con donantes.</p>
        <p>- No solicitar pagos ni desviar recursos fuera del proceso acordado.</p>
        <p>- Proteger datos personales y cumplir la normativa aplicable.</p>
        <p><strong>Acceso:</strong> ${frontendUrl}</p>
        <p>Si no has sido tu, responde a ${supportEmail}.</p>
        <p>${appName} - ${organizationAddress}</p>
    `;

    if (isSmtpConfigured()) {
        try {
            return await sendSmtpEmail({
                toEmail,
                toName: displayName,
                subject,
                textPart,
                htmlPart: null,
                supportEmail,
                supportName,
            });
        } catch (smtpError) {
            if (!isMailjetConfigured()) {
                throw new Error(`SMTP failed and Mailjet is not configured: ${smtpError.message}`);
            }

            console.warn(`SMTP failed, falling back to Mailjet: ${smtpError.message}`);
        }
    }

    if (!isMailjetConfigured()) {
        return { skipped: true, reason: 'SMTP and Mailjet not configured' };
    }

    const headers = {};
    if (supportEmail) {
        headers['List-Unsubscribe'] = unsubscribeUrl
            ? `<${unsubscribeUrl}>, <mailto:${supportEmail}?subject=unsubscribe>`
            : `<mailto:${supportEmail}?subject=unsubscribe>`;
    }

    const payload = {
        Messages: [
            {
                From: {
                    Email: process.env.MAILJET_FROM_EMAIL,
                    Name: process.env.MAILJET_FROM_NAME,
                },
                To: [
                    {
                        Email: toEmail,
                        Name: displayName,
                    },
                ],
                ReplyTo: {
                    Email: supportEmail,
                    Name: supportName,
                },
                Headers: headers,
                CustomID: `welcome-ong-review-${Date.now()}`,
                Subject: subject,
                TextPart: textPart,
                HTMLPart: htmlPart,
            },
        ],
    };

    return sendMailjetEmail(payload);
}

async function sendOngApprovedEmail({ toEmail, toName, ongName, approvedAt }) {
    const appName = process.env.APP_NAME || 'Plataforma de Donaciones';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.MAILJET_REPLY_TO_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.MAILJET_FROM_EMAIL;
    const supportName = process.env.MAILJET_REPLY_TO_NAME || process.env.SMTP_FROM_NAME || process.env.MAILJET_FROM_NAME;
    const organizationAddress = process.env.MAILER_COMPANY_ADDRESS || 'Direccion no especificada';
    const unsubscribeUrl = process.env.MAILJET_UNSUBSCRIBE_URL;
    const approvalDate = new Date(approvedAt || Date.now()).toISOString().replace('T', ' ').replace('Z', ' UTC');
    const displayName = toName || toEmail;
    const entityName = ongName || 'tu entidad social';
    const subject = `Cuenta aprobada - ${appName}`;
    const textPart =
        `Hola ${displayName},\n\n` +
        `Tu entidad social "${entityName}" ha sido aprobada por un administrador.\n` +
        `Fecha de aprobacion: ${approvalDate}\n\n` +
        `Ya puedes acceder y usar todas las funcionalidades de la plataforma.\n` +
        `Acceso: ${frontendUrl}\n\n` +
        `Si tienes dudas, responde a ${supportEmail}.\n\n` +
        `${appName}\n${organizationAddress}`;
    const htmlPart = `
        <p>Hola ${displayName},</p>
        <p>Tu entidad social "<strong>${entityName}</strong>" ha sido aprobada por un administrador.</p>
        <p><strong>Fecha de aprobacion:</strong> ${approvalDate}</p>
        <p>Ya puedes acceder y usar todas las funcionalidades de la plataforma.</p>
        <p><strong>Acceso:</strong> ${frontendUrl}</p>
        <p>Si tienes dudas, responde a ${supportEmail}.</p>
        <p>${appName} - ${organizationAddress}</p>
    `;

    if (isSmtpConfigured()) {
        try {
            return await sendSmtpEmail({
                toEmail,
                toName: displayName,
                subject,
                textPart,
                htmlPart: null,
                supportEmail,
                supportName,
            });
        } catch (smtpError) {
            if (!isMailjetConfigured()) {
                throw new Error(`SMTP failed and Mailjet is not configured: ${smtpError.message}`);
            }

            console.warn(`SMTP failed, falling back to Mailjet: ${smtpError.message}`);
        }
    }

    if (!isMailjetConfigured()) {
        return { skipped: true, reason: 'SMTP and Mailjet not configured' };
    }

    const headers = {};
    if (supportEmail) {
        headers['List-Unsubscribe'] = unsubscribeUrl
            ? `<${unsubscribeUrl}>, <mailto:${supportEmail}?subject=unsubscribe>`
            : `<mailto:${supportEmail}?subject=unsubscribe>`;
    }

    const payload = {
        Messages: [
            {
                From: {
                    Email: process.env.MAILJET_FROM_EMAIL,
                    Name: process.env.MAILJET_FROM_NAME,
                },
                To: [
                    {
                        Email: toEmail,
                        Name: displayName,
                    },
                ],
                ReplyTo: {
                    Email: supportEmail,
                    Name: supportName,
                },
                Headers: headers,
                CustomID: `ong-approved-${Date.now()}`,
                Subject: subject,
                TextPart: textPart,
                HTMLPart: htmlPart,
            },
        ],
    };

    return sendMailjetEmail(payload);
}

async function sendDonationRequestToDonorEmail({
    toEmail,
    toName,
    donation,
    ong,
    conversationId,
}) {
    const appName = process.env.APP_NAME || 'Plataforma de Donaciones';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.MAILJET_REPLY_TO_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.MAILJET_FROM_EMAIL;
    const supportName = process.env.MAILJET_REPLY_TO_NAME || process.env.SMTP_FROM_NAME || process.env.MAILJET_FROM_NAME;
    const organizationAddress = process.env.MAILER_COMPANY_ADDRESS || 'Direccion no especificada';
    const unsubscribeUrl = process.env.MAILJET_UNSUBSCRIBE_URL;
    const displayName = toName || toEmail;
    const subject = `Nueva solicitud para tu donacion - ${appName}`;
    const chatUrl = `${frontendUrl}/chat`;
    const ongName = ong?.name || 'Entidad social';
    const ongType = ong?.type || 'No especificado';
    const ongContactEmail = ong?.contactEmail || 'No especificado';
    const ongContactPhone = ong?.contactPhone || 'No especificado';
    const donationTitle = donation?.title || 'Donacion';
    const donationCategory = donation?.category || 'No especificado';
    const donationQuantity = donation?.quantity || 'No especificado';
    const donationCity = donation?.city || 'No especificado';
    const textPart =
        `Hola ${displayName},\n\n` +
        `Una entidad social ha solicitado tu donacion y se ha abierto un chat para coordinar la entrega.\n\n` +
        `Datos de la donacion solicitada:\n` +
        `- Titulo: ${donationTitle}\n` +
        `- Categoria: ${donationCategory}\n` +
        `- Cantidad: ${donationQuantity}\n` +
        `- Ciudad: ${donationCity}\n\n` +
        `Datos de la entidad social solicitante:\n` +
        `- Nombre: ${ongName}\n` +
        `- Tipo: ${ongType}\n` +
        `- Email de contacto: ${ongContactEmail}\n` +
        `- Telefono de contacto: ${ongContactPhone}\n\n` +
        `Chat abierto: ${chatUrl}\n` +
        `ID de conversacion: ${conversationId}\n\n` +
        `Si no reconoces esta actividad, responde a ${supportEmail}.\n\n` +
        `${appName}\n${organizationAddress}`;
    const htmlPart = `
        <p>Hola ${displayName},</p>
        <p>Una entidad social ha solicitado tu donacion y se ha abierto un chat para coordinar la entrega.</p>
        <p><strong>Datos de la donacion solicitada:</strong></p>
        <p>- Titulo: ${donationTitle}</p>
        <p>- Categoria: ${donationCategory}</p>
        <p>- Cantidad: ${donationQuantity}</p>
        <p>- Ciudad: ${donationCity}</p>
        <p><strong>Datos de la entidad social solicitante:</strong></p>
        <p>- Nombre: ${ongName}</p>
        <p>- Tipo: ${ongType}</p>
        <p>- Email de contacto: ${ongContactEmail}</p>
        <p>- Telefono de contacto: ${ongContactPhone}</p>
        <p><strong>Chat abierto:</strong> ${chatUrl}</p>
        <p><strong>ID de conversacion:</strong> ${conversationId}</p>
        <p>Si no reconoces esta actividad, responde a ${supportEmail}.</p>
        <p>${appName} - ${organizationAddress}</p>
    `;

    if (isSmtpConfigured()) {
        try {
            return await sendSmtpEmail({
                toEmail,
                toName: displayName,
                subject,
                textPart,
                htmlPart: null,
                supportEmail,
                supportName,
            });
        } catch (smtpError) {
            if (!isMailjetConfigured()) {
                throw new Error(`SMTP failed and Mailjet is not configured: ${smtpError.message}`);
            }

            console.warn(`SMTP failed, falling back to Mailjet: ${smtpError.message}`);
        }
    }

    if (!isMailjetConfigured()) {
        return { skipped: true, reason: 'SMTP and Mailjet not configured' };
    }

    const headers = {};
    if (supportEmail) {
        headers['List-Unsubscribe'] = unsubscribeUrl
            ? `<${unsubscribeUrl}>, <mailto:${supportEmail}?subject=unsubscribe>`
            : `<mailto:${supportEmail}?subject=unsubscribe>`;
    }

    const payload = {
        Messages: [
            {
                From: {
                    Email: process.env.MAILJET_FROM_EMAIL,
                    Name: process.env.MAILJET_FROM_NAME,
                },
                To: [
                    {
                        Email: toEmail,
                        Name: displayName,
                    },
                ],
                ReplyTo: {
                    Email: supportEmail,
                    Name: supportName,
                },
                Headers: headers,
                CustomID: `donation-request-donor-${Date.now()}`,
                Subject: subject,
                TextPart: textPart,
                HTMLPart: htmlPart,
            },
        ],
    };

    return sendMailjetEmail(payload);
}

async function sendDonationStatusToOngEmail({
    toEmail,
    toName,
    donation,
    ong,
    donor,
    statusType,
}) {
    const appName = process.env.APP_NAME || 'Plataforma de Donaciones';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const supportEmail = process.env.MAILJET_REPLY_TO_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.MAILJET_FROM_EMAIL;
    const supportName = process.env.MAILJET_REPLY_TO_NAME || process.env.SMTP_FROM_NAME || process.env.MAILJET_FROM_NAME;
    const organizationAddress = process.env.MAILER_COMPANY_ADDRESS || 'Direccion no especificada';
    const unsubscribeUrl = process.env.MAILJET_UNSUBSCRIBE_URL;

    const displayName = toName || toEmail;
    const ongName = ong?.name || 'Entidad social';
    const donorName = donor?.username || 'Donante';
    const donationTitle = donation?.title || 'Donacion';
    const donationCategory = donation?.category || 'No especificado';
    const donationQuantity = donation?.quantity || 'No especificado';
    const donationCity = donation?.city || 'No especificado';
    const isDelivered = statusType === 'DELIVERED';
    const subject = isDelivered
        ? `Donacion marcada como entregada - ${appName}`
        : `Solicitud de donacion rechazada - ${appName}`;
    const statusLine = isDelivered
        ? 'El donante ha marcado la donacion como entregada.'
        : 'El donante ha rechazado la solicitud y la donacion ha vuelto a estado disponible.';
    const nextStep = isDelivered
        ? 'Puedes revisar el historial desde tu panel para seguimiento interno.'
        : 'Puedes buscar otras donaciones disponibles desde la plataforma.';

    const textPart =
        `Hola ${displayName},\n\n` +
        `${statusLine}\n\n` +
        `Entidad: ${ongName}\n` +
        `Donante: ${donorName}\n\n` +
        `Datos de la donacion:\n` +
        `- Titulo: ${donationTitle}\n` +
        `- Categoria: ${donationCategory}\n` +
        `- Cantidad: ${donationQuantity}\n` +
        `- Ciudad: ${donationCity}\n\n` +
        `${nextStep}\n` +
        `Acceso: ${frontendUrl}\n\n` +
        `Si necesitas ayuda, responde a ${supportEmail}.\n\n` +
        `${appName}\n${organizationAddress}`;
    const htmlPart = `
        <p>Hola ${displayName},</p>
        <p>${statusLine}</p>
        <p><strong>Entidad:</strong> ${ongName}</p>
        <p><strong>Donante:</strong> ${donorName}</p>
        <p><strong>Datos de la donacion:</strong></p>
        <p>- Titulo: ${donationTitle}</p>
        <p>- Categoria: ${donationCategory}</p>
        <p>- Cantidad: ${donationQuantity}</p>
        <p>- Ciudad: ${donationCity}</p>
        <p>${nextStep}</p>
        <p><strong>Acceso:</strong> ${frontendUrl}</p>
        <p>Si necesitas ayuda, responde a ${supportEmail}.</p>
        <p>${appName} - ${organizationAddress}</p>
    `;

    if (isSmtpConfigured()) {
        try {
            return await sendSmtpEmail({
                toEmail,
                toName: displayName,
                subject,
                textPart,
                htmlPart: null,
                supportEmail,
                supportName,
            });
        } catch (smtpError) {
            if (!isMailjetConfigured()) {
                throw new Error(`SMTP failed and Mailjet is not configured: ${smtpError.message}`);
            }

            console.warn(`SMTP failed, falling back to Mailjet: ${smtpError.message}`);
        }
    }

    if (!isMailjetConfigured()) {
        return { skipped: true, reason: 'SMTP and Mailjet not configured' };
    }

    const headers = {};
    if (supportEmail) {
        headers['List-Unsubscribe'] = unsubscribeUrl
            ? `<${unsubscribeUrl}>, <mailto:${supportEmail}?subject=unsubscribe>`
            : `<mailto:${supportEmail}?subject=unsubscribe>`;
    }

    const payload = {
        Messages: [
            {
                From: {
                    Email: process.env.MAILJET_FROM_EMAIL,
                    Name: process.env.MAILJET_FROM_NAME,
                },
                To: [
                    {
                        Email: toEmail,
                        Name: displayName,
                    },
                ],
                ReplyTo: {
                    Email: supportEmail,
                    Name: supportName,
                },
                Headers: headers,
                CustomID: `donation-status-ong-${Date.now()}`,
                Subject: subject,
                TextPart: textPart,
                HTMLPart: htmlPart,
            },
        ],
    };

    return sendMailjetEmail(payload);
}

module.exports = {
    sendDonorWelcomeEmail,
    sendOngWelcomeReviewEmail,
    sendOngApprovedEmail,
    sendDonationRequestToDonorEmail,
    sendDonationStatusToOngEmail,
};
