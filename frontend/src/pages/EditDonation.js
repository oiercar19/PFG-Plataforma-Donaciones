import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donationAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import './EditDonation.css';

const pinMarkerIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#dc2626;border:2px solid #7f1d1d;box-shadow:0 4px 10px rgba(15,23,42,0.25);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -12],
});

const DEFAULT_CENTER = [40.4168, -3.7038];

function EditDonation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [manualCoords, setManualCoords] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const mapRef = useRef(null);
    const pendingCenterRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        quantity: '',
        city: '',
        address: '',
        postalCode: '',
        province: ''
    });
    const [newImages, setNewImages] = useState([]); // Imágenes nuevas para subir
    const [existingImages, setExistingImages] = useState([]); // Imágenes que ya existían

    const categories = [
        'Ropa',
        'Alimentos',
        'Muebles',
        'Electrodomésticos',
        'Libros',
        'Juguetes',
        'Material escolar',
        'Medicamentos',
        'Otros'
    ];

    const loadDonation = useCallback(async () => {
        try {
            setLoading(true);
            const response = await donationAPI.getDonationById(id);
            const donation = response.data.donation;

            // Verificar que la donación está disponible
            if (donation.status !== 'DISPONIBLE') {
                setError('Solo puedes editar donaciones disponibles');
                return;
            }

            setFormData({
                title: donation.title || '',
                description: donation.description || '',
                category: donation.category || '',
                quantity: donation.quantity || '',
                city: donation.city || '',
                address: donation.address || '',
                postalCode: donation.postalCode || '',
                province: donation.province || ''
            });
            if (typeof donation.latitude === 'number' && typeof donation.longitude === 'number') {
                setManualCoords([donation.latitude, donation.longitude]);
            } else {
                setManualCoords(null);
            }
            setExistingImages(donation.images || []);
            setError('');
        } catch (err) {
            console.error('Error al cargar donación:', err);
            setError(err.response?.data?.error || 'Error al cargar la donación');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDonation();
    }, [loadDonation]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        setManualCoords(null);
    }, [formData.address, formData.postalCode, formData.city, formData.province]);

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
        const parts = [formData.address, formData.postalCode, formData.city, formData.province].filter(Boolean);
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
        const totalImages = existingImages.length + newImages.length + files.length;

        if (totalImages > 5) {
            setError('Máximo 5 imágenes permitidas');
            return;
        }

        // Validar cada archivo
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Cada imagen debe pesar menos de 10MB');
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
            setNewImages(prev => [...prev, ...results]);
            setError('');
        });
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!formData.title.trim()) {
            setError('El título es obligatorio');
            return;
        }
        if (!formData.description.trim()) {
            setError('La descripción es obligatoria');
            return;
        }
        if (!formData.category) {
            setError('Selecciona una categoría');
            return;
        }
        if (!formData.quantity || formData.quantity < 1) {
            setError('La cantidad debe ser mayor a 0');
            return;
        }
        if (!formData.city.trim()) {
            setError('La ciudad es obligatoria');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            // Combinar imágenes existentes y nuevas
            const allImages = [
                ...existingImages,
                ...newImages.map(img => img.base64)
            ];

            const dataToSend = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category,
                quantity: formData.quantity.toString(),
                city: formData.city.trim(),
                address: formData.address.trim() || null,
                postalCode: formData.postalCode.trim() || null,
                province: formData.province.trim() || null,
                images: allImages
            };
            if (manualCoords) {
                dataToSend.latitude = manualCoords[0];
                dataToSend.longitude = manualCoords[1];
            }

            await donationAPI.updateDonation(id, dataToSend);
            navigate('/my-donations', {
                state: { message: 'Donación actualizada exitosamente' }
            });
        } catch (err) {
            console.error('Error al actualizar donación:', err);
            setError(err.response?.data?.error || 'Error al actualizar la donación');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="edit-donation-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando donación...</p>
                </div>
            </div>
        );
    }

    if (error && !formData.title) {
        return (
            <div className="edit-donation-container">
                <div className="error-state">
                    <i className="bi bi-exclamation-circle"></i>
                    <h2>{error}</h2>
                    <button onClick={() => navigate('/my-donations')}>
                        Volver a Mis Donaciones
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-donation-container">
            <div className="form-header">
                <button className="btn-back" onClick={() => navigate('/my-donations')}>
                    <i className="bi bi-arrow-left"></i>
                    Volver
                </button>
                <h1>
                    <i className="bi bi-pencil"></i>
                    Editar Donación
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="donation-form">
                {error && (
                    <div className="alert alert-error">
                        <i className="bi bi-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                <div className="form-section">
                    <h2>Información Básica</h2>

                    <div className="form-group">
                        <label htmlFor="title">
                            Título <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ej: Ropa de invierno en buen estado"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Descripción <span className="required">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe los artículos que quieres donar..."
                            rows="5"
                            maxLength={500}
                            required
                        ></textarea>
                        <small>{formData.description.length}/500 caracteres</small>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category">
                                Categoría <span className="required">*</span>
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecciona una categoría</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="quantity">
                                Cantidad <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="1"
                                placeholder="1"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Ubicación</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="city">
                                Ciudad <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Madrid"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="province">Provincia</label>
                            <input
                                type="text"
                                id="province"
                                name="province"
                                value={formData.province}
                                onChange={handleChange}
                                placeholder="Madrid"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="postalCode">Código Postal</label>
                            <input
                                type="text"
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleChange}
                                placeholder="28001"
                                maxLength={10}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Dirección</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Calle Principal, 123"
                            />
                        </div>
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
                    <h2>Imágenes</h2>
                    <p className="section-description">
                        Sube imágenes desde tu dispositivo (máximo 5 imágenes en total, máximo 10MB cada una)
                    </p>

                    {/* Imágenes existentes */}
                    {existingImages.length > 0 && (
                        <div className="existing-images-section">
                            <h3>Imágenes actuales</h3>
                            <div className="images-grid">
                                {existingImages.map((image, index) => (
                                    <div key={`existing-${index}`} className="image-preview-item">
                                        <img src={image} alt={`Existente ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="btn-remove-preview"
                                            onClick={() => removeExistingImage(index)}
                                            title="Eliminar imagen"
                                        >
                                            <i className="bi bi-x-circle-fill"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Nuevas imágenes */}
                    {newImages.length > 0 && (
                        <div className="new-images-section">
                            <h3>Nuevas imágenes</h3>
                            <div className="images-grid">
                                {newImages.map((image, index) => (
                                    <div key={`new-${index}`} className="image-preview-item">
                                        <img src={image.preview} alt={`Nueva ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="btn-remove-preview"
                                            onClick={() => removeNewImage(index)}
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
                    {(existingImages.length + newImages.length) < 5 && (
                        <div className="form-group">
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
                                Puedes seleccionar múltiples imágenes. Máximo 10MB por imagen.
                            </small>
                        </div>
                    )}

                    {(existingImages.length + newImages.length) === 5 && (
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
                        onClick={() => navigate('/my-donations')}
                        disabled={submitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-small"></span>
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle"></i>
                                Actualizar Donación
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditDonation;
