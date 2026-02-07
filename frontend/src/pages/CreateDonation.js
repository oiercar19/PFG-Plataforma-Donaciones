import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import './CreateDonation.css';

const pinMarkerIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#dc2626;border:2px solid #7f1d1d;box-shadow:0 4px 10px rgba(15,23,42,0.25);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -12],
});

const DEFAULT_CENTER = [40.4168, -3.7038];

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
    const [manualCoords, setManualCoords] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const mapRef = useRef(null);
    const pendingCenterRef = useRef(null);
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

    useEffect(() => {
        setManualCoords(null);
    }, [formData.address, formData.postalCode, formData.city]);

    useEffect(() => {
        if (showMapPicker && mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 0);
        }
    }, [showMapPicker]);

    useEffect(() => {
        if (showMapPicker && manualCoords) {
            if (mapRef.current) {
                mapRef.current.flyTo(manualCoords, Math.max(mapRef.current.getZoom(), 15));
            } else {
                pendingCenterRef.current = manualCoords;
            }
        }
    }, [manualCoords, showMapPicker]);

    const buildGeoQuery = () => {
        const parts = [formData.address, formData.postalCode, formData.city].filter(Boolean);
        return parts.join(', ');
    };

    const geocodeWithNominatim = async (query) => {
        if (!query) return null;
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                };
            }
            return null;
        } catch (geoError) {
            return null;
        }
    };

    const geocodeWithOpenMeteo = async (query) => {
        if (!query) return null;
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es&format=json`;
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            if (data && Array.isArray(data.results) && data.results.length > 0) {
                return {
                    latitude: parseFloat(data.results[0].latitude),
                    longitude: parseFloat(data.results[0].longitude),
                };
            }
            return null;
        } catch (geoError) {
            return null;
        }
    };

    const geocodeDonation = async () => {
        const query = buildGeoQuery();
        if (!query) return null;
        const nominatim = await geocodeWithNominatim(query);
        if (nominatim) return nominatim;
        const fallbackQuery = formData.city || query;
        return geocodeWithOpenMeteo(fallbackQuery);
    };

    const LocationPicker = ({ position, onChange }) => {
        const map = useMap();
        useMapEvents({
            click: (event) => {
                const coords = [event.latlng.lat, event.latlng.lng];
                onChange(coords);
                map.flyTo(coords, Math.max(map.getZoom(), 15));
            },
        });

        if (!position) return null;
        return <Marker position={position} icon={pinMarkerIcon} />;
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
            if (manualCoords) {
                donationData.latitude = manualCoords[0];
                donationData.longitude = manualCoords[1];
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

                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={async () => {
                                    setShowMapPicker(true);
                                    const geo = await geocodeDonation();
                                    if (geo && Number.isFinite(geo.latitude) && Number.isFinite(geo.longitude)) {
                                        const coords = [geo.latitude, geo.longitude];
                                        setManualCoords(coords);
                                        if (mapRef.current) {
                                            mapRef.current.flyTo(coords, Math.max(mapRef.current.getZoom(), 15));
                                        } else {
                                            pendingCenterRef.current = coords;
                                        }
                                    } else if (manualCoords) {
                                        if (mapRef.current) {
                                            mapRef.current.flyTo(manualCoords, Math.max(mapRef.current.getZoom(), 15));
                                        } else {
                                            pendingCenterRef.current = manualCoords;
                                        }
                                    }
                                }}
                            >
                                Ubicar en mapa
                            </button>

                            {showMapPicker && (
                                <div className="mt-3">
                                    <div style={{ height: '240px', borderRadius: '12px', overflow: 'hidden' }}>
                                        <MapContainer
                                            center={manualCoords || DEFAULT_CENTER}
                                            zoom={manualCoords ? 15 : 6}
                                            scrollWheelZoom={false}
                                            style={{ height: '100%', width: '100%' }}
                                            whenCreated={(mapInstance) => {
                                                mapRef.current = mapInstance;
                                                setTimeout(() => {
                                                    mapInstance.invalidateSize();
                                                    if (pendingCenterRef.current) {
                                                        mapInstance.flyTo(pendingCenterRef.current, Math.max(mapInstance.getZoom(), 15));
                                                        pendingCenterRef.current = null;
                                                    }
                                                }, 0);
                                            }}
                                        >
                                            <TileLayer
                                                attribution='&copy; OpenStreetMap contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <LocationPicker
                                                position={manualCoords}
                                                onChange={(coords) => {
                                                    setManualCoords(coords);
                                                }}
                                            />
                                        </MapContainer>
                                    </div>
                                    {manualCoords && (
                                        <small className="form-help">
                                            Lat: {manualCoords[0].toFixed(6)} &middot; Lng: {manualCoords[1].toFixed(6)}
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Imágenes (opcional)</h2>
                        <p className="section-description">
                            Sube hasta 5 imágenes (máximo 5MB cada una)
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
                            <div>
                                <label htmlFor="images" className="file-input-label">
                                    <i className="bi bi-cloud-upload"></i>
                                    Seleccionar imágenes desde el dispositivo
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
