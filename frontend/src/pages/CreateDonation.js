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

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
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
        const file = e.target.files[0];
        if (file) {
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen debe pesar menos de 5MB');
                return;
            }

            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                setError('Solo se permiten archivos de imagen');
                return;
            }

            setImageFile(file);

            // Crear vista previa
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
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
            // Preparar datos con imagen en base64 si existe
            const donationData = { ...formData };
            if (imageFile) {
                donationData.images = [imagePreview]; // array con base64
            } else {
                donationData.images = [];
            }

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
            setImageFile(null);
            setImagePreview('');

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
                        <h2>Imagen (opcional)</h2>

                        <div className="form-group">
                            <label htmlFor="image">
                                Sube una imagen desde tu PC
                            </label>
                            <input
                                type="file"
                                id="image"
                                name="image"
                                onChange={handleImageChange}
                                accept="image/*"
                                className="file-input"
                            />
                            <small className="form-help">
                                Máximo 5MB. Formatos: JPG, PNG, GIF, WEBP
                            </small>
                        </div>

                        {imagePreview && (
                            <div className="image-preview-container">
                                <div className="image-preview">
                                    <img src={imagePreview} alt="Vista previa" />
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={removeImage}
                                        title="Eliminar imagen"
                                    >
                                        <i className="bi bi-x-circle-fill"></i>
                                    </button>
                                </div>
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
