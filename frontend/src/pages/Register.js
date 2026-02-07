import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Container, Row, Col, Card, Form, Button, Alert, ButtonGroup } from 'react-bootstrap';

const pinMarkerIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#dc2626;border:2px solid #7f1d1d;box-shadow:0 4px 10px rgba(15,23,42,0.25);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -12],
});

const DEFAULT_CENTER = [40.4168, -3.7038];

const Register = () => {
    const [isOng, setIsOng] = useState(false);
    const [formData, setFormData] = useState({
        // Datos de usuario
        username: '',
        email: '',
        password: '',
        location: '',
        // Datos de ONG
        name: '',
        cif: '',
        type: 'ONG',
        description: '',
        ongCity: '',
        ongAddress: '',
        ongPostalCode: '',
        contactEmail: '',
        contactPhone: '',
        documentUrl: '',
    });
    const [manualCoords, setManualCoords] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const mapRef = useRef(null);
    const pendingCenterRef = useRef(null);
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { registerDonor, registerOng } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOng) return;
        setManualCoords(null);
    }, [formData.ongAddress, formData.ongPostalCode, formData.ongCity, isOng]);

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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            setError('Máximo 5 archivos permitidos');
            e.target.value = '';
            return;
        }
        setDocuments(files);
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

    const buildGeoQuery = () => {
        const parts = [formData.ongAddress, formData.ongPostalCode, formData.ongCity].filter(Boolean);
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

    const geocodeOng = async () => {
        const query = buildGeoQuery();
        if (!query) return null;
        const nominatim = await geocodeWithNominatim(query);
        if (nominatim) return nominatim;
        const fallbackQuery = formData.ongCity || query;
        return geocodeWithOpenMeteo(fallbackQuery);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;

            if (isOng) {
                const geo = await geocodeOng();
                const manual = manualCoords
                    ? { latitude: manualCoords[0], longitude: manualCoords[1] }
                    : null;
                const coords = geo || manual;

                if (!coords) {
                    setShowMapPicker(true);
                    setError('No pudimos localizar la dirección. Marca la ubicación en el mapa.');
                    setLoading(false);
                    return;
                }

                // Registro de ONG con archivos
                const ongFormData = new FormData();

                // Agregar datos básicos
                ongFormData.append('username', formData.username);
                ongFormData.append('email', formData.email);
                ongFormData.append('password', formData.password);
                ongFormData.append('location', formData.ongCity);
                ongFormData.append('city', formData.ongCity);
                if (formData.ongAddress) {
                    ongFormData.append('address', formData.ongAddress);
                }
                if (formData.ongPostalCode) {
                    ongFormData.append('postalCode', formData.ongPostalCode);
                }
                if (coords) {
                    if (Number.isFinite(coords.latitude)) {
                        ongFormData.append('latitude', coords.latitude);
                    }
                    if (Number.isFinite(coords.longitude)) {
                        ongFormData.append('longitude', coords.longitude);
                    }
                }
                ongFormData.append('name', formData.name);
                ongFormData.append('cif', formData.cif);
                ongFormData.append('type', formData.type);
                ongFormData.append('description', formData.description);
                ongFormData.append('contactEmail', formData.contactEmail);
                ongFormData.append('contactPhone', formData.contactPhone);
                if (formData.documentUrl) {
                    ongFormData.append('documentUrl', formData.documentUrl);
                }

                // Agregar archivos
                documents.forEach((file) => {
                    ongFormData.append('documents', file);
                });

                result = await registerOng(ongFormData);

                if (result.success) {
                    navigate('/ong-pending');
                }
            } else {
                // Registro de donante
                const donorData = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    location: formData.location,
                };

                result = await registerDonor(donorData);

                if (result.success) {
                    navigate('/');
                }
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Error inesperado al registrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh', paddingTop: '3rem', paddingBottom: '3rem' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={10} lg={8}>
                        <Card className="shadow-lg border-0">
                            <Card.Body className="p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <i className="bi bi-person-plus-fill" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                                    <h2 className="mt-3 fw-bold">Registro</h2>
                                    <p className="text-muted">Crea tu cuenta para comenzar</p>
                                </div>

                                <ButtonGroup className="w-100 mb-4" size="lg">
                                    <Button
                                        variant={!isOng ? 'primary' : 'outline-primary'}
                                        onClick={() => {
                                            setIsOng(false);
                                            setShowMapPicker(false);
                                            setManualCoords(null);
                                        }}
                                        className="py-3"
                                    >
                                        <i className="bi bi-person me-2"></i>
                                        Soy Donante
                                    </Button>
                                    <Button
                                        variant={isOng ? 'primary' : 'outline-primary'}
                                        onClick={() => {
                                            setIsOng(true);
                                            setShowMapPicker(false);
                                            setManualCoords(null);
                                        }}
                                        className="py-3"
                                    >
                                        <i className="bi bi-building me-2"></i>
                                        Soy una Entidad Social
                                    </Button>
                                </ButtonGroup>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    {/* Datos de usuario (comunes) */}
                                    <div className="mb-4">
                                        <h5 className="fw-bold mb-3 pb-2 border-bottom">Datos de Usuario</h5>

                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Nombre de usuario *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="juan_perez"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Email *</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="tu@email.com"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Contraseña *</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                        minLength="6"
                                                        placeholder="Mínimo 6 caracteres"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Población *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="Madrid"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Datos de ONG (solo si es ONG) */}
                                    {isOng && (
                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-3 pb-2 border-bottom">Datos de la Entidad</h5>

                                            <Row>
                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Nombre de la entidad *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Cruz Roja Barcelona"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>CIF / NIF *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="cif"
                                                            value={formData.cif}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="G12345678"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Tipo de entidad *</Form.Label>
                                                        <Form.Select
                                                            name="type"
                                                            value={formData.type}
                                                            onChange={handleChange}
                                                            required
                                                            size="lg"
                                                        >
                                                            <option value="ONG">ONG</option>
                                                            <option value="ASOCIACION">Asociación</option>
                                                            <option value="FUNDACION">Fundación</option>
                                                            <option value="ENTIDAD_SOCIAL">Entidad Social</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Población / Ciudad de la entidad *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="ongCity"
                                                            value={formData.ongCity}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Barcelona"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Calle / Dirección</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="ongAddress"
                                                            value={formData.ongAddress}
                                                            onChange={handleChange}
                                                            placeholder="Calle, número, piso..."
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Código Postal</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="ongPostalCode"
                                                            value={formData.ongPostalCode}
                                                            onChange={handleChange}
                                                            placeholder="08001"
                                                            size="lg"
                                                            maxLength="5"
                                                            pattern="[0-9]{5}"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col xs={12} className="mb-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={async () => {
                                                            setShowMapPicker(true);
                                                            const geo = await geocodeOng();
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
                                                    </Button>

                                                    {showMapPicker && (
                                                        <div className="mt-3">
                                                            <Form.Label>Ubicación en el mapa *</Form.Label>
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
                                                                            setError('');
                                                                        }}
                                                                    />
                                                                </MapContainer>
                                                            </div>
                                                            <Form.Text className="text-muted">
                                                                Haz clic en el mapa para colocar el pin si no se localiza automáticamente.
                                                            </Form.Text>
                                                            {manualCoords && (
                                                                <div className="text-muted small mt-1">
                                                                    Lat: {manualCoords[0].toFixed(6)} &middot; Lng: {manualCoords[1].toFixed(6)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Col>


                                                <Col xs={12} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Descripción</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            name="description"
                                                            value={formData.description}
                                                            onChange={handleChange}
                                                            rows="3"
                                                            placeholder="Describe brevemente las actividades de tu entidad"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Email de contacto *</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            name="contactEmail"
                                                            value={formData.contactEmail}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="contacto@entidad.org"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Teléfono de contacto *</Form.Label>
                                                        <Form.Control
                                                            type="tel"
                                                            name="contactPhone"
                                                            value={formData.contactPhone}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="+34 600 123 456"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col xs={12} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Documentos acreditativos *</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            multiple
                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                            onChange={handleFileChange}
                                                            size="lg"
                                                            required
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Sube documentos que acrediten tu entidad (CIF, estatutos, certificados). Máximo 5 archivos de 10MB cada uno.
                                                            Formatos: PDF, JPG, PNG, DOC, DOCX
                                                        </Form.Text>
                                                        {documents.length > 0 && (
                                                            <div className="mt-2">
                                                                <small className="text-success">
                                                                    <i className="bi bi-check-circle me-1"></i>
                                                                    {documents.length} archivo(s) seleccionado(s)
                                                                </small>
                                                            </div>
                                                        )}
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-100 mt-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Registrando...
                                            </>
                                        ) : (
                                            'Registrarse'
                                        )}
                                    </Button>
                                </Form>

                                <div className="text-center mt-4">
                                    <p className="text-muted">
                                        ¿Ya tienes cuenta? <Link to="/login" className="text-decoration-none fw-semibold">Inicia sesión</Link>
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Register;



