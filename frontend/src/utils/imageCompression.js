import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen y la convierte a base64
 * @param {File} file - Archivo de imagen a comprimir
 * @param {string} compressionLevel - Nivel de compresión: 'low', 'medium', 'high', 'extreme'
 * @returns {Promise<{file: Blob, preview: string, base64: string}>}
 */
export const compressAndEncodeImage = async (file, compressionLevel = 'extreme') => {
    try {
        // Configuraciones según el nivel de compresión
        const compressionProfiles = {
            low: {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                initialQuality: 0.9,
            },
            medium: {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                initialQuality: 0.8,
            },
            high: {
                maxSizeMB: 0.5, // 500KB
                maxWidthOrHeight: 1280,
                initialQuality: 0.7,
            },
            extreme: {
                maxSizeMB: 0.2, // 300KB
                maxWidthOrHeight: 1024,
                initialQuality: 0.5,
            }
        };

        const profile = compressionProfiles[compressionLevel] || compressionProfiles.high;

        // Opciones de compresión optimizadas
        const options = {
            ...profile,
            useWebWorker: true, // Usar Web Worker para mejor rendimiento
            fileType: 'image/jpeg', // Convertir a JPEG para mejor compresión
            alwaysKeepResolution: false, // Permitir reducción de resolución
            preserveExif: false, // Eliminar EXIF para reducir tamaño
        };

        // Comprimir la imagen
        let compressedFile = await imageCompression(file, options);

        // Si aún es muy grande, hacer una segunda pasada más agresiva
        if (compressedFile.size > options.maxSizeMB * 1024 * 1024) {
            const secondPassOptions = {
                ...options,
                maxSizeMB: options.maxSizeMB * 0.8,
                initialQuality: options.initialQuality * 0.85,
            };
            compressedFile = await imageCompression(compressedFile, secondPassOptions);
        }

        // Convertir a base64
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(compressedFile);
        });

        return {
            file: compressedFile,
            preview: base64,
            base64: base64,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1)
        };
    } catch (error) {
        console.error('Error al comprimir imagen:', error);
        throw error;
    }
};

/**
 * Comprime múltiples imágenes
 * @param {File[]} files - Array de archivos de imagen
 * @param {string} compressionLevel - Nivel de compresión: 'low', 'medium', 'high', 'extreme'
 * @returns {Promise<Array>}
 */
export const compressMultipleImages = async (files, compressionLevel = 'extreme') => {
    return Promise.all(files.map(file => compressAndEncodeImage(file, compressionLevel)));
};
