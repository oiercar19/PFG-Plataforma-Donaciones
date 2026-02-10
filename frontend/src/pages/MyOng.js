import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, donationAPI, needAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal, Form } from 'react-bootstrap';
import './MyOng.css';

const pinMarkerIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#dc2626;border:2px solid #7f1d1d;box-shadow:0 4px 10px rgba(15,23,42,0.25);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -12],
});

const DEFAULT_CENTER = [40.4168, -3.7038];

const MyOng = () => {
    const [ongData, setOngData] = useState(null);
    const [assignedDonations, setAssignedDonations] = useState([]);
    const [myNeeds, setMyNeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [manualCoords, setManualCoords] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const mapRef = useRef(null);
    const pendingCenterRef = useRef(null);
    const lastLocationRef = useRef({ city: null, address: null, postalCode: null, initialized: false });
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        city: '',
        address: '',
        postalCode: '',
        contactEmail: '',
        contactPhone: '',
    });
    const [editLoading, setEditLoading] = useState(false);
    const navigate = useNavigate();
    const { user, isOng } = useAuth();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            console.log('Cargando datos de ONG...');
            console.log('Usuario actual:', user);

            const [ongResponse, donationsResponse] = await Promise.all([
                authAPI.getMyOngData(),
                donationAPI.getMyAssignedDonations(),
            ]);

            console.log('Respuesta ONG:', ongResponse.data);
            console.log('Respuesta donaciones:', donationsResponse.data);

            setOngData(ongResponse.data.ong);
            setAssignedDonations(donationsResponse.data.donations);
            if (ongResponse.data.ong.status === 'APPROVED') {
                try {
                    const needsResponse = await needAPI.getMyNeeds();
                    setMyNeeds(needsResponse.data.needs || []);
                } catch (needsError) {
                    console.error('Error al cargar necesidades:', needsError);
                    setMyNeeds([]);
                }
            } else {
                setMyNeeds([]);
            }

            // Inicializar datos del formulario de edición
            setEditFormData({
                name: ongResponse.data.ong.name,
                description: ongResponse.data.ong.description || '',
                city: ongResponse.data.ong.city || ongResponse.data.ong.location || '',
                address: ongResponse.data.ong.address || '',
                postalCode: ongResponse.data.ong.postalCode || '',
                contactEmail: ongResponse.data.ong.contactEmail,
                contactPhone: ongResponse.data.ong.contactPhone,
            });

            if (typeof ongResponse.data.ong.latitude === 'number' && typeof ongResponse.data.ong.longitude === 'number') {
                setManualCoords([ongResponse.data.ong.latitude, ongResponse.data.ong.longitude]);
            } else {
                setManualCoords(null);
            }
        } catch (err) {
            console.error('Error completo:', err);
            console.error('Respuesta del error:', err.response);
            const errorMessage = err.response?.data?.error || 'Error al cargar información de la ONG';
            setError(errorMessage);

            // Si el error es de autorización, redirigir
            if (err.response?.status === 403 || err.response?.status === 404) {
                setTimeout(() => navigate('/'), 3000);
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, user]);

    useEffect(() => {
        // Verificar si el usuario es una ONG antes de cargar datos
        if (!isOng()) {
            setError('Solo los usuarios con rol de ONG pueden acceder a esta página');
            setLoading(false);
            return;
        }
        loadData();
    }, [isOng, loadData]);

    useEffect(() => {
        const current = {
            city: editFormData.city,
            address: editFormData.address,
            postalCode: editFormData.postalCode,
        };
        const last = lastLocationRef.current;

        if (last.initialized) {
            if (current.city !== last.city || current.address !== last.address || current.postalCode !== last.postalCode) {
                setManualCoords(null);
            }
        }

        lastLocationRef.current = { ...current, initialized: true };
    }, [editFormData.city, editFormData.address, editFormData.postalCode]);

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

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value,
        });
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
        const parts = [editFormData.address, editFormData.postalCode, editFormData.city].filter(Boolean);
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
        const fallbackQuery = editFormData.city || query;
        return geocodeWithOpenMeteo(fallbackQuery);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setEditLoading(true);
            setError('');
            setSuccess('');

            const geo = await geocodeOng();
            const fallbackCoords = manualCoords
                ? { latitude: manualCoords[0], longitude: manualCoords[1] }
                : null;
            const payload = { ...editFormData };

            if (geo) {
                if (Number.isFinite(geo.latitude)) {
                    payload.latitude = geo.latitude;
                }
                if (Number.isFinite(geo.longitude)) {
                    payload.longitude = geo.longitude;
                }
            } else if (fallbackCoords) {
                if (Number.isFinite(fallbackCoords.latitude)) {
                    payload.latitude = fallbackCoords.latitude;
                }
                if (Number.isFinite(fallbackCoords.longitude)) {
                    payload.longitude = fallbackCoords.longitude;
                }
            } else {
                setShowMapPicker(true);
                setError('No pudimos localizar la dirección. Marca la ubicación en el mapa.');
                setEditLoading(false);
                return;
            }

            await authAPI.updateMyOngData(payload);
            setSuccess('Información actualizada exitosamente');
            setShowEditModal(false);
            await loadData();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error al actualizar ONG:', err);
            setError(err.response?.data?.error || 'Error al actualizar información');
        } finally {
            setEditLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { variant: 'warning', text: 'Pendiente' },
            APPROVED: { variant: 'success', text: 'Aprobada' },
            REJECTED: { variant: 'danger', text: 'Rechazada' },
        };
        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    const getDonationStatusBadge = (status) => {
        const statusConfig = {
            DISPONIBLE: { variant: 'success', text: 'Disponible' },
            ASIGNADO: { variant: 'primary', text: 'Asignado' },
            ASIGNADA: { variant: 'primary', text: 'Asignado' },
            ENTREGADO: { variant: 'secondary', text: 'Entregado' },
            ENTREGADA: { variant: 'secondary', text: 'Entregado' },
        };
        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    const getNeedStatusBadge = (status) => {
        const statusConfig = {
            OPEN: { variant: 'success', text: 'Abierta' },
            CLOSED: { variant: 'secondary', text: 'Cerrada' },
        };
        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const needsOpenCount = myNeeds.filter((need) => need.status === 'OPEN').length;
    const needsClosedCount = myNeeds.filter((need) => need.status === 'CLOSED').length;

    if (loading) {
        return (
            <Container className="my-ong-container">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Cargando información de la ONG...</p>
                </div>
            </Container>
        );
    }

    if (error && !ongData) {
        return (
            <Container className="my-ong-container">
                <Card className="mt-4 border-danger">
                    <Card.Header className="bg-danger text-white">
                        <h4 className="mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Error al Cargar Información
                        </h4>
                    </Card.Header>
                    <Card.Body>
                        <Alert variant="danger" className="mb-3">
                            <strong>Mensaje de error:</strong> {error}
                        </Alert>

                        <div className="mt-3">
                            <h5>Posibles soluciones:</h5>
                            <ul>
                                <li>Verifica que tu cuenta tenga rol de ONG</li>
                                <li>Si acabas de registrarte como ONG, tu solicitud podría estar pendiente de aprobación</li>
                                <li>Intenta cerrar sesión e iniciar sesión nuevamente</li>
                                <li>Si el problema persiste, contacta al administrador</li>
                            </ul>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <Button variant="primary" onClick={() => navigate('/')}>
                                <i className="bi bi-house me-2"></i>
                                Ir al Inicio
                            </Button>
                            <Button variant="outline-secondary" onClick={() => window.location.reload()}>
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Reintentar
                            </Button>
                            <Button variant="outline-info" onClick={() => navigate('/profile/edit')}>
                                <i className="bi bi-person me-2"></i>
                                Ver Perfil
                            </Button>
                        </div>

                        <div className="mt-3 p-3 bg-light rounded">
                            <small className="text-muted">
                                <strong>Usuario actual:</strong> {user?.username || 'No disponible'} <br />
                                <strong>Rol:</strong> {user?.role || 'No disponible'} <br />
                                <strong>Email:</strong> {user?.email || 'No disponible'}
                            </small>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="my-ong-container">
            <div className="page-header">
                <h1>
                    <i className="bi bi-building me-2"></i>
                    Mi ONG
                </h1>
                <p>Gestiona la información de tu organización</p>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            {ongData && (
                <>
                                        {/* Informacion General de la ONG */}
                    <Card className="ong-info-card mb-4">
                        <div className="ong-hero">
                            <div className="ong-hero-main">
                                <span className="ong-hero-kicker">
                                    <i className="bi bi-shield-check me-2"></i>
                                    Perfil de ONG
                                </span>
                                <h2 className="ong-name">{ongData.name}</h2>
                                <div className="ong-status mb-2">
                                    Estado: {getStatusBadge(ongData.status)}
                                </div>
                                {ongData.description && (
                                    <p className="ong-hero-description">{ongData.description}</p>
                                )}
                            </div>
                            <div className="ong-hero-actions">
                                <Button
                                    variant="light"
                                    onClick={() => {
                                        setShowEditModal(true);
                                        setShowMapPicker(false);
                                    }}
                                    disabled={ongData.status !== 'APPROVED'}
                                >
                                    <i className="bi bi-pencil me-2"></i>
                                    Editar informacion
                                </Button>
                            </div>
                        </div>
                        <Card.Body>
                            {ongData.status === 'PENDING' && (
                                <Alert variant="info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Tu ONG esta pendiente de aprobacion por un administrador. Una vez aprobada,
                                    podras solicitar donaciones y gestionar tu organizacion.
                                </Alert>
                            )}

                            {ongData.status === 'REJECTED' && (
                                <Alert variant="danger">
                                    <i className="bi bi-exclamation-circle me-2"></i>
                                    <strong>Solicitud Rechazada</strong>
                                    {ongData.rejectionReason && (
                                        <p className="mb-0 mt-2">
                                            <strong>Motivo:</strong> {ongData.rejectionReason}
                                        </p>
                                    )}
                                </Alert>
                            )}

                            <Row className="ong-details mt-4">
                                <Col md={6} className="mb-3">
                                    <div className="detail-item">
                                        <i className="bi bi-card-text me-2 text-primary"></i>
                                        <strong>CIF:</strong> <span>{ongData.cif}</span>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="detail-item">
                                        <i className="bi bi-tag me-2 text-primary"></i>
                                        <strong>Tipo:</strong> <span>{ongData.type}</span>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="detail-item">
                                        <i className="bi bi-geo-alt me-2 text-primary"></i>
                                        <strong>Ubicacion:</strong>{' '}
                                        <span>
                                            {[ongData.address, ongData.postalCode, ongData.city || ongData.location]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </span>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="detail-item">
                                        <i className="bi bi-calendar me-2 text-primary"></i>
                                        <strong>Registrada:</strong> <span>{formatDate(ongData.createdAt)}</span>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="detail-item">
                                        <i className="bi bi-envelope me-2 text-primary"></i>
                                        <strong>Email:</strong> <span>{ongData.contactEmail}</span>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="detail-item">
                                        <i className="bi bi-telephone me-2 text-primary"></i>
                                        <strong>Telefono:</strong> <span>{ongData.contactPhone}</span>
                                    </div>
                                </Col>
                                {ongData.approvedAt && (
                                    <Col md={6} className="mb-3">
                                        <div className="detail-item">
                                            <i className="bi bi-check-circle me-2 text-success"></i>
                                            <strong>Aprobada el:</strong> <span>{formatDate(ongData.approvedAt)}</span>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Estadisticas */}
                    {ongData.status === 'APPROVED' && (
                        <Row className="statistics-row mb-4">
                            <Col md={3} className="mb-3">
                                <Card className="stat-card text-center">
                                    <Card.Body>
                                        <div className="stat-icon">
                                            <i className="bi bi-gift-fill"></i>
                                        </div>
                                        <h3 className="stat-number">{assignedDonations.length}</h3>
                                        <p className="stat-label">Donaciones Asignadas</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Card className="stat-card text-center">
                                    <Card.Body>
                                        <div className="stat-icon">
                                            <i className="bi bi-check-circle-fill"></i>
                                        </div>
                                        <h3 className="stat-number">
                                            {assignedDonations.filter(d => d.status === 'ENTREGADA' || d.status === 'ENTREGADO').length}
                                        </h3>
                                        <p className="stat-label">Donaciones Recibidas</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Card className="stat-card text-center">
                                    <Card.Body>
                                        <div className="stat-icon">
                                            <i className="bi bi-clock-fill"></i>
                                        </div>
                                        <h3 className="stat-number">
                                            {assignedDonations.filter(d => d.status === 'ASIGNADA' || d.status === 'ASIGNADO').length}
                                        </h3>
                                        <p className="stat-label">Pendientes de Recibir</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Card className="stat-card text-center">
                                    <Card.Body>
                                        <div className="stat-icon stat-icon-needs">
                                            <i className="bi bi-clipboard-heart-fill"></i>
                                        </div>
                                        <h3 className="stat-number">{needsOpenCount}</h3>
                                        <p className="stat-label">Necesidades Abiertas</p>
                                        <small className="text-muted d-block mt-2">{needsClosedCount} cerradas</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Donaciones y Necesidades */}
                    {ongData.status === 'APPROVED' && (
                        <Row className="mb-4">
                            <Col lg={6} className="mb-4">
                                <Card className="donations-card h-100">
                                    <Card.Header>
                                        <h3>
                                            <i className="bi bi-gift me-2"></i>
                                            Donaciones Recientes
                                        </h3>
                                    </Card.Header>
                                    <Card.Body>
                                        {assignedDonations.length === 0 ? (
                                            <div className="text-center py-4">
                                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                                <p className="text-muted mt-3">No tienes donaciones asignadas aun</p>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => navigate('/available-donations')}
                                                >
                                                    <i className="bi bi-search me-2"></i>
                                                    Buscar Donaciones
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="donations-list">
                                                {assignedDonations.slice(0, 5).map((donation) => (
                                                    <div
                                                        key={donation.id}
                                                        className="donation-item"
                                                        onClick={() => navigate(`/donations/${donation.id}`)}
                                                    >
                                                        <div className="donation-info">
                                                            <h5>{donation.title}</h5>
                                                            <p className="text-muted mb-1">
                                                                <i className="bi bi-tag me-1"></i>
                                                                {donation.category} | {donation.quantity}
                                                            </p>
                                                            <p className="text-muted mb-0">
                                                                <i className="bi bi-geo-alt me-1"></i>
                                                                {donation.city}
                                                            </p>
                                                        </div>
                                                        <div className="donation-status">
                                                            {getDonationStatusBadge(donation.status)}
                                                            <small className="text-muted d-block mt-2">
                                                                {formatDate(donation.createdAt)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                ))}
                                                {assignedDonations.length > 5 && (
                                                    <div className="text-center mt-3">
                                                        <Button
                                                            variant="outline-primary"
                                                            onClick={() => navigate('/donations')}
                                                        >
                                                            Ver todas las donaciones
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={6} className="mb-4">
                                <Card className="needs-card h-100">
                                    <Card.Header>
                                        <h3>
                                            <i className="bi bi-clipboard-heart me-2"></i>
                                            Necesidades Recientes
                                        </h3>
                                    </Card.Header>
                                    <Card.Body>
                                        {myNeeds.length === 0 ? (
                                            <div className="text-center py-4">
                                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                                <p className="text-muted mt-3">Aun no has publicado necesidades</p>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => navigate('/create-need')}
                                                >
                                                    <i className="bi bi-flag me-2"></i>
                                                    Publicar necesidad
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="needs-list">
                                                {myNeeds.slice(0, 5).map((need) => (
                                                    <div
                                                        key={need.id}
                                                        className="need-item"
                                                        onClick={() => navigate(`/needs/${need.id}`)}
                                                    >
                                                        <div className="need-info">
                                                            <h5>{need.title}</h5>
                                                            <p className="text-muted mb-1">
                                                                <i className="bi bi-tag me-1"></i>
                                                                {need.category}{need.quantity ? ` | ${need.quantity}` : ''}
                                                            </p>
                                                            <p className="text-muted mb-0">
                                                                <i className="bi bi-chat-dots me-1"></i>
                                                                {need._count?.conversations || 0} chats
                                                            </p>
                                                        </div>
                                                        <div className="need-status">
                                                            {getNeedStatusBadge(need.status)}
                                                            {need.urgent && (
                                                                <Badge bg="danger" className="ms-2">Urgente</Badge>
                                                            )}
                                                            <small className="text-muted d-block mt-2">
                                                                {formatDate(need.createdAt)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                ))}
                                                {myNeeds.length > 5 && (
                                                    <div className="text-center mt-3">
                                                        <Button
                                                            variant="outline-danger"
                                                            onClick={() => navigate('/my-needs')}
                                                        >
                                                            Ver todas las necesidades
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Acciones Rapidas */}
                    {ongData.status === 'APPROVED' && (
                        <Card className="quick-actions-card mt-4">
                            <Card.Header>
                                <h3>
                                    <i className="bi bi-lightning-fill me-2"></i>
                                    Acciones Rapidas
                                </h3>
                            </Card.Header>
                            <Card.Body>
                                <Row className="mb-2">
                                    <Col md={4} className="mb-3">
                                        <Button
                                            variant="primary"
                                            className="w-100 action-btn"
                                            onClick={() => navigate('/available-donations')}
                                        >
                                            <i className="bi bi-search fs-4 d-block mb-2"></i>
                                            Buscar Donaciones
                                        </Button>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Button
                                            variant="success"
                                            className="w-100 action-btn"
                                            onClick={() => navigate('/donations')}
                                        >
                                            <i className="bi bi-list-ul fs-4 d-block mb-2"></i>
                                            Mis Donaciones
                                        </Button>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Button
                                            variant="info"
                                            className="w-100 action-btn text-white"
                                            onClick={() => navigate('/create-donation')}
                                        >
                                            <i className="bi bi-plus-circle fs-4 d-block mb-2"></i>
                                            Crear Donacion
                                        </Button>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="danger"
                                            className="w-100 action-btn"
                                            onClick={() => navigate('/create-need')}
                                        >
                                            <i className="bi bi-flag fs-4 d-block mb-2"></i>
                                            Publicar Necesidad
                                        </Button>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="outline-danger"
                                            className="w-100 action-btn"
                                            onClick={() => navigate('/my-needs')}
                                        >
                                            <i className="bi bi-clipboard-heart fs-4 d-block mb-2"></i>
                                            Mis Necesidades
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}

            {/* Modal de Edición */}
            <Modal
                show={showEditModal}
                onHide={() => {
                    setShowEditModal(false);
                    setShowMapPicker(false);
                }}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-pencil me-2"></i>
                        Editar Información de la ONG
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la ONG *</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={editFormData.description}
                                onChange={handleEditChange}
                                placeholder="Describe brevemente la misión y actividades de tu organización"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Población / Ciudad *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="city"
                                        value={editFormData.city}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="Ciudad"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Calle / Dirección</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="address"
                                        value={editFormData.address}
                                        onChange={handleEditChange}
                                        placeholder="Calle, número, piso..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Código Postal</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="postalCode"
                                        value={editFormData.postalCode}
                                        onChange={handleEditChange}
                                        placeholder="08001"
                                        maxLength="5"
                                        pattern="[0-9]{5}"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

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
                            className="mb-3"
                        >
                            Ubicar en mapa
                        </Button>

                        {showMapPicker && (
                            <div className="mb-3">
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

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email de Contacto *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="contactEmail"
                                        value={editFormData.contactEmail}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Teléfono de Contacto *</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="contactPhone"
                                        value={editFormData.contactPhone}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowEditModal(false)}
                                disabled={editLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={editLoading}
                            >
                                {editLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle me-2"></i>
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default MyOng;

