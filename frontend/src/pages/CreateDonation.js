import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import './CreateDonation.css';

function CreateDonation() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        quantity: '',
        city: user?.location || '',
        address: '',
        postalCode: '',
    });

    const [images, setImages] = useState([]); // Array de imágenes con preview y base64
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = [
        'Alimentos',
        'Ropa',
        'Medicinas',
        'Muebles',
        'Electrónica',
        'Juguetes',
        'Libros',
        'Material Escolar',
        'Productos de Higiene',
        'Otros',
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
        setSuccess('');
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = images.length + files.length;

        if (totalImages > 5) {
            setError('Máximo 5 imágenes permitidas');
            return;
        }

        // Validar cada archivo
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Cada imagen debe pesar menos de 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                setError('Solo se permiten archivos de imagen');
                return;
            }
        }

        // Convertir archivos a base64
        const promises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        file,
                        preview: reader.result,
                        base64: reader.result
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(results => {
            setImages(prev => [...prev, ...results]);
            setError('');
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validaciones
        if (!formData.title || !formData.description || !formData.category || !formData.quantity || !formData.city) {
            setError('Por favor, completa todos los campos obligatorios');
            return;
        }

        setLoading(true);

        try {
            // Preparar datos con imágenes en base64
            const donationData = { ...formData };
            donationData.images = images.map(img => img.base64);

            await donationAPI.createDonation(donationData);

            setSuccess('¡Donación creada exitosamente!');

            // Limpiar formulario
            setFormData({
                title: '',
                description: '',
                category: '',
                quantity: '',
                city: user?.location || '',
                address: '',
                postalCode: '',
            });
            setImages([]);

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate('/donations');
            }, 2000);
        } catch (err) {
            console.error('Error al crear donación:', err);
            const message = err.response?.data?.error || 'Error al crear la donación';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    return (
        <div className="create-donation-container">
            <div className="create-donation-wrapper">
                <div className="create-donation-header">
                    <i className="bi bi-plus-circle-fill"></i>
                    <div>
                        <h1>Nueva Donación</h1>
                        <p>Comparte recursos que otros puedan necesitar</p>
                    </div>
                </div>

                {error && <div className="alert alert-error">
                    <i className="bi bi-exclamation-triangle"></i>
                    {error}
                </div>}

                {success && <div className="alert alert-success">
                    <i className="bi bi-check-circle"></i>
                    {success}
                </div>}

                <form onSubmit={handleSubmit} className="donation-form">
                    <div className="form-section">
                        <h2>Información Básica</h2>

                        <div className="form-group">
                            <label htmlFor="title">
                                Título de la donación *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ej: Ropa de invierno, Alimentos no perecederos..."
                                required
                                maxLength="100"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">
                                Descripción *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe en detalle qué estás donando, su estado, características especiales, etc."
                                required
                                rows="5"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">
                                    Categoría *
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="quantity">
                                    Cantidad *
                                </label>
                                <input
                                    type="text"
                                    id="quantity"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="Ej: 10 kg, 5 cajas, 20 unidades..."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Ubicación</h2>

                        <div className="form-group">
                            <label htmlFor="city">
                                Población / Ciudad *
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Ej: Madrid, Barcelona, Valencia..."
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="address">
                                    Calle / Dirección
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Calle, número, piso..."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="postalCode">
                                    Código Postal
                                </label>
                                <input
                                    type="text"
                                    id="postalCode"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    placeholder="28001"
                                    maxLength="5"
                                    pattern="[0-9]{5}"
                                />
                            </div>
                        </div>

                        <div className="info-box">
                            <i className="bi bi-info-circle"></i>
                            <span>Esta información ayudará a localizar mejor la donación y mostrarla en el mapa</span>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Imágenes (opcional)</h2>
                        <p className="section-description">
                            Sube hasta 5 imágenes desde tu PC (máximo 5MB cada una)
                        </p>

                        {/* Mostrar imágenes seleccionadas */}
                        {images.length > 0 && (
                            <div className="images-preview-section">
                                <div className="images-grid">
                                    {images.map((image, index) => (
                                        <div key={index} className="image-preview-item">
                                            <img src={image.preview} alt={`Imagen ${index + 1}`} />
                                            <button
                                                type="button"
                                                className="btn-remove-preview"
                                                onClick={() => removeImage(index)}
                                                title="Eliminar imagen"
                                            >
                                                <i className="bi bi-x-circle-fill"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input para añadir imágenes */}
                        {images.length < 5 && (
                            <div className="form-group">
                                <label htmlFor="images" className="file-input-label">
                                    <i className="bi bi-cloud-upload"></i>
                                    Seleccionar imágenes desde el PC
                                </label>
                                <input
                                    type="file"
                                    id="images"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="file-input-hidden"
                                />
                                <small className="form-help">
                                    Puedes seleccionar múltiples imágenes. Máximo 5MB por imagen.
                                </small>
                            </div>
                        )}

                        {images.length === 5 && (
                            <div className="info-box">
                                <i className="bi bi-info-circle"></i>
                                Has alcanzado el límite de 5 imágenes
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            <i className="bi bi-x-circle"></i>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            <i className="bi bi-check-circle"></i>
                            {loading ? 'Creando...' : 'Publicar Donación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateDonation;
