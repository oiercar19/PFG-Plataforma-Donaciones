const port = process.env.PORT || 5000;
const serverUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${port}`;

const paths = {};

function addOperation(path, method, tag, summary, options = {}) {
    if (!paths[path]) paths[path] = {};

    const operation = {
        tags: [tag],
        summary,
        responses: options.responses || {
            200: { description: 'OK' },
            400: { description: 'Bad Request' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
            500: { description: 'Internal Server Error' },
        },
    };

    if (options.secured) {
        operation.security = [{ BearerAuth: [] }];
    }
    if (options.parameters) {
        operation.parameters = options.parameters;
    }
    if (options.requestBody) {
        operation.requestBody = options.requestBody;
    }

    paths[path][method] = operation;
}

addOperation('/', 'get', 'System', 'Informacion basica de la API', {
    responses: { 200: { description: 'Informacion de servicio' } },
});
addOperation('/health', 'get', 'System', 'Health check general');
addOperation('/health/db', 'get', 'System', 'Health check de base de datos');
addOperation('/api/docs', 'get', 'System', 'Interfaz Swagger UI');
addOperation('/api/openapi.json', 'get', 'System', 'OpenAPI spec en JSON');

addOperation('/api/auth/register/donor', 'post', 'Auth', 'Registrar donante', {
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                        location: { type: 'string' },
                    },
                },
            },
        },
    },
});
addOperation('/api/auth/register/ong', 'post', 'Auth', 'Registrar ONG', {
    requestBody: {
        required: true,
        content: {
            'multipart/form-data': {
                schema: {
                    type: 'object',
                    required: [
                        'username',
                        'email',
                        'password',
                        'name',
                        'cif',
                        'type',
                        'location',
                        'contactEmail',
                        'contactPhone',
                    ],
                    properties: {
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                        name: { type: 'string' },
                        cif: { type: 'string' },
                        type: { type: 'string', enum: ['ONG', 'ASOCIACION', 'FUNDACION', 'ENTIDAD_SOCIAL'] },
                        description: { type: 'string' },
                        location: { type: 'string' },
                        city: { type: 'string' },
                        address: { type: 'string' },
                        postalCode: { type: 'string' },
                        province: { type: 'string' },
                        latitude: { type: 'number' },
                        longitude: { type: 'number' },
                        contactEmail: { type: 'string', format: 'email' },
                        contactPhone: { type: 'string' },
                        documents: { type: 'array', items: { type: 'string', format: 'binary' } },
                    },
                },
            },
        },
    },
});
addOperation('/api/auth/login', 'post', 'Auth', 'Login (username o email)');
addOperation('/api/auth/login/google', 'post', 'Auth', 'Login con Google (donante)');
addOperation('/api/auth/ongs', 'get', 'Auth', 'Listar ONGs publicas');
addOperation('/api/auth/profile', 'get', 'Auth', 'Obtener perfil del usuario', { secured: true });
addOperation('/api/auth/profile', 'put', 'Auth', 'Actualizar perfil del usuario', {
    secured: true,
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        location: { type: 'string' },
                        currentPassword: { type: 'string' },
                        password: { type: 'string' },
                    },
                },
            },
        },
    },
});
addOperation('/api/auth/my-ong', 'get', 'Auth', 'Obtener datos de mi ONG', { secured: true });
addOperation('/api/auth/my-ong', 'put', 'Auth', 'Actualizar datos de mi ONG', {
    secured: true,
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        location: { type: 'string' },
                        city: { type: 'string' },
                        address: { type: 'string' },
                        postalCode: { type: 'string' },
                        province: { type: 'string' },
                        latitude: { type: 'number' },
                        longitude: { type: 'number' },
                        contactEmail: { type: 'string', format: 'email' },
                        contactPhone: { type: 'string' },
                    },
                },
            },
        },
    },
});

addOperation('/api/admin/stats', 'get', 'Admin', 'Obtener estadisticas de admin', { secured: true });
addOperation('/api/admin/ongs', 'get', 'Admin', 'Listar ONGs (filtro opcional)', {
    secured: true,
    parameters: [
        {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
        },
    ],
});
addOperation('/api/admin/ongs/pending', 'get', 'Admin', 'Listar ONGs pendientes', { secured: true });
addOperation('/api/admin/ongs/{id}', 'get', 'Admin', 'Detalle de ONG por ID', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/admin/documents/{documentId}', 'get', 'Admin', 'Descargar documento de ONG', {
    secured: true,
    parameters: [{ in: 'path', name: 'documentId', required: true, schema: { type: 'string' } }],
});
addOperation('/api/admin/ongs/{id}/approve', 'put', 'Admin', 'Aprobar ONG', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/admin/ongs/{id}/reject', 'put', 'Admin', 'Rechazar ONG', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    required: ['reason'],
                    properties: { reason: { type: 'string' } },
                },
            },
        },
    },
});

addOperation('/api/donations', 'post', 'Donations', 'Crear donacion', {
    secured: true,
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    required: ['title', 'description', 'category', 'quantity', 'city'],
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string' },
                        quantity: { type: 'string' },
                        city: { type: 'string' },
                        address: { type: 'string' },
                        postalCode: { type: 'string' },
                        province: { type: 'string' },
                        latitude: { type: 'number' },
                        longitude: { type: 'number' },
                        images: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
        },
    },
});
addOperation('/api/donations/available', 'get', 'Donations', 'Listar donaciones disponibles', {
    secured: true,
    parameters: [
        { in: 'query', name: 'category', schema: { type: 'string' } },
        { in: 'query', name: 'location', schema: { type: 'string' } },
        { in: 'query', name: 'search', schema: { type: 'string' } },
        { in: 'query', name: 'includeOwn', schema: { type: 'string' } },
    ],
});
addOperation('/api/donations/my-donations', 'get', 'Donations', 'Listar mis donaciones', { secured: true });
addOperation('/api/donations/assigned', 'get', 'Donations', 'Listar donaciones asignadas a mi ONG', { secured: true });
addOperation('/api/donations/{id}', 'get', 'Donations', 'Obtener donacion por ID', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/donations/{id}', 'put', 'Donations', 'Actualizar donacion por ID', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/donations/{id}', 'delete', 'Donations', 'Eliminar donacion por ID', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/donations/{id}/request', 'post', 'Donations', 'Solicitar/asignar donacion', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/donations/{id}/reject', 'post', 'Donations', 'Rechazar donacion asignada', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/donations/{id}/delivered', 'post', 'Donations', 'Marcar donacion como entregada', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});

addOperation('/api/needs', 'get', 'Needs', 'Listar necesidades', {
    secured: true,
    parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' } },
        { in: 'query', name: 'category', schema: { type: 'string' } },
        { in: 'query', name: 'urgent', schema: { type: 'string' } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['OPEN', 'CLOSED'] } },
        { in: 'query', name: 'ongId', schema: { type: 'string' } },
    ],
});
addOperation('/api/needs', 'post', 'Needs', 'Crear necesidad (ONG aprobada)', { secured: true });
addOperation('/api/needs/my', 'get', 'Needs', 'Listar mis necesidades (ONG aprobada)', {
    secured: true,
    parameters: [{ in: 'query', name: 'status', schema: { type: 'string', enum: ['OPEN', 'CLOSED'] } }],
});
addOperation('/api/needs/{id}', 'get', 'Needs', 'Obtener necesidad por ID', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});
addOperation('/api/needs/{id}/close', 'post', 'Needs', 'Cerrar necesidad', {
    secured: true,
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
});

addOperation('/api/conversations', 'get', 'Conversations', 'Listar conversaciones', {
    secured: true,
    parameters: [{ in: 'query', name: 'status', schema: { type: 'string', enum: ['OPEN', 'CLOSED'] } }],
});
addOperation('/api/conversations/donation/{donationId}', 'get', 'Conversations', 'Obtener chat por donacion', {
    secured: true,
    parameters: [{ in: 'path', name: 'donationId', required: true, schema: { type: 'string' } }],
});
addOperation('/api/conversations/need/{needId}', 'get', 'Conversations', 'Obtener chat por necesidad', {
    secured: true,
    parameters: [{ in: 'path', name: 'needId', required: true, schema: { type: 'string' } }],
});
addOperation('/api/conversations/need/{needId}', 'post', 'Conversations', 'Abrir chat por necesidad', {
    secured: true,
    parameters: [{ in: 'path', name: 'needId', required: true, schema: { type: 'string' } }],
});
addOperation('/api/conversations/{conversationId}', 'get', 'Conversations', 'Obtener chat por ID', {
    secured: true,
    parameters: [{ in: 'path', name: 'conversationId', required: true, schema: { type: 'string' } }],
});
addOperation('/api/conversations/{conversationId}/shipping-cost', 'get', 'Conversations', 'Calcular coste de envio', {
    secured: true,
    parameters: [
        { in: 'path', name: 'conversationId', required: true, schema: { type: 'string' } },
        { in: 'query', name: 'weightKg', required: true, schema: { type: 'number', minimum: 0.01 } },
        { in: 'query', name: 'packages', required: true, schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'remoteZone', schema: { type: 'boolean' } },
        { in: 'query', name: 'express24h', schema: { type: 'boolean' } },
    ],
});
addOperation('/api/conversations/{conversationId}/messages', 'post', 'Conversations', 'Enviar mensaje', {
    secured: true,
    parameters: [{ in: 'path', name: 'conversationId', required: true, schema: { type: 'string' } }],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    required: ['content'],
                    properties: { content: { type: 'string' } },
                },
            },
        },
    },
});

const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Donation Platform API',
        version: '1.0.0',
        description: 'Documentacion OpenAPI (Swagger) de todos los endpoints del backend.',
    },
    servers: [{ url: serverUrl }],
    tags: [
        { name: 'System' },
        { name: 'Auth' },
        { name: 'Admin' },
        { name: 'Donations' },
        { name: 'Needs' },
        { name: 'Conversations' },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                },
            },
        },
    },
    paths,
};

function getSwaggerUiHtml() {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Donation Platform API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout',
      deepLinking: true
    });
  </script>
</body>
</html>`;
}

module.exports = {
    openApiSpec,
    getSwaggerUiHtml,
};
