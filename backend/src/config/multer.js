const multer = require('multer');

// Configurar almacenamiento en memoria (los archivos se guardarán en la BD)
const storage = multer.memoryStorage();

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF, imágenes (JPG, PNG) y documentos Word.'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB máximo por archivo
    }
});

module.exports = upload;
