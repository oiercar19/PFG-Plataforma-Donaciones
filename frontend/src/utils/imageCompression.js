import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen y la convierte a base64
 * @param {File} file - Archivo de imagen a comprimir
 * @returns {Promise<{file: Blob, preview: string, base64: string}>}
 */
export const compressAndEncodeImage = async (file) => {
    try {
        // Opciones de compresión
        const options = {
            maxSizeMB: 1, // Tamaño máximo de 1MB después de la compresión
            maxWidthOrHeight: 1920, // Máximo ancho o alto en píxeles
            useWebWorker: true, // Usar Web Worker para mejor rendimiento
            fileType: 'image/jpeg', // Convertir a JPEG para mejor compresión
            initialQuality: 0.8, // Calidad inicial (0-1)
        };

        // Comprimir la imagen
        const compressedFile = await imageCompression(file, options);

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
 * @returns {Promise<Array>}
 */
export const compressMultipleImages = async (files) => {
    return Promise.all(files.map(file => compressAndEncodeImage(file)));
};
