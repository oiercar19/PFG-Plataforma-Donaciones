import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { donationAPI, authAPI, needAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DonationsMap.css';

const donationMarkerIcon = L.divIcon({
    className: '',
    html: '<div class="donation-marker"><div class="donation-marker-box"></div></div>',
    iconSize: [24, 28],
    iconAnchor: [12, 26],
    popupAnchor: [0, -12],
});

const ongMarkerIcon = L.divIcon({
    className: '',
    html: '<div class="ong-marker"><div class="ong-marker-dot"></div></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -12],
});

const ongMarkerActiveIcon = L.divIcon({
    className: '',
    html: '<div class="ong-marker ong-marker-active"><div class="ong-marker-dot"></div></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -12],
});

const DEFAULT_CENTER = [40.4168, -3.7038];
const DEFAULT_ZOOM = 6;

const DonationsMap = () => {
    const { isDonor, user } = useAuth();
    const navigate = useNavigate();
    const isDonorUser = isDonor();
    const showDonations = !isDonorUser;
    const [donations, setDonations] = useState([]);
    const [ongs, setOngs] = useState([]);
    const [activeNeedsByOng, setActiveNeedsByOng] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const normalizeCoords = (item) => ({
        ...item,
        latitude: typeof item.latitude === 'string' ? parseFloat(item.latitude) : item.latitude,
        longitude: typeof item.longitude === 'string' ? parseFloat(item.longitude) : item.longitude,
    });

    useEffect(() => {
        let isMounted = true;
        const loadMapData = async () => {
            try {
                const [donationsResponse, ongsResponse, needsResponse] = await Promise.all([
                    showDonations
                        ? donationAPI.getAvailableDonations({
                            includeOwn: isDonorUser ? 'true' : 'false',
                        })
                        : Promise.resolve({ data: { donations: [] } }),
                    authAPI.getPublicOngs(),
                    needAPI.getNeeds({ status: 'OPEN' }),
                ]);

                const donationsData = (donationsResponse.data?.donations || []).map(normalizeCoords);
                let ongsData = (ongsResponse.data?.ongs || []).map(normalizeCoords);
                const needsData = needsResponse.data?.needs || [];

                if (isDonorUser) {
                    ongsData = ongsData.filter((ong) => ong.status === 'APPROVED');
                }

                if (user?.role === 'ONG') {
                    try {
                        const myOngResponse = await authAPI.getMyOngData();
                        const myOng = myOngResponse.data?.ong ? normalizeCoords(myOngResponse.data.ong) : null;
                        if (myOng) {
                            const existing = ongsData.find((item) => item.id === myOng.id);
                            const merged = existing
                                ? {
                                    ...existing,
                                    ...myOng,
                                    latitude: typeof myOng.latitude === 'number' ? myOng.latitude : existing.latitude,
                                    longitude: typeof myOng.longitude === 'number' ? myOng.longitude : existing.longitude,
                                }
                                : myOng;
                            ongsData = [
                                ...ongsData.filter((item) => item.id !== myOng.id),
                                merged,
                            ];
                        }
                    } catch (myOngError) {
                        // Ignorar si no se puede cargar la ONG propia
                    }
                }

                const needsByOng = needsData.reduce((acc, need) => {
                    const ongId = need.ong?.id || need.ongId;
                    if (ongId) {
                        acc[ongId] = (acc[ongId] || 0) + 1;
                    }
                    return acc;
                }, {});

                if (isMounted) {
                    setDonations(donationsData);
                    setOngs(ongsData);
                    setActiveNeedsByOng(needsByOng);
                }
            } catch (err) {
                if (isMounted) {
                    setError('No se pudieron cargar las donaciones u ONGs disponibles.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadMapData();
        return () => {
            isMounted = false;
        };
    }, [isDonorUser, showDonations, user?.role]);

    const donationsWithCoords = useMemo(
        () =>
            showDonations
                ? donations.filter(
                    (donation) =>
                        typeof donation.latitude === 'number' &&
                        typeof donation.longitude === 'number'
                )
                : [],
        [donations, showDonations]
    );

    const ongsWithCoords = useMemo(
        () =>
            ongs.filter(
                (ong) =>
                    typeof ong.latitude === 'number' &&
                    typeof ong.longitude === 'number' &&
                    !Number.isNaN(ong.latitude) &&
                    !Number.isNaN(ong.longitude)
            ),
        [ongs]
    );

    const mapCenter = useMemo(() => {
        if (donationsWithCoords.length > 0) {
            return [donationsWithCoords[0].latitude, donationsWithCoords[0].longitude];
        }
        if (ongsWithCoords.length > 0) {
            return [ongsWithCoords[0].latitude, ongsWithCoords[0].longitude];
        }
        return DEFAULT_CENTER;
    }, [donationsWithCoords, ongsWithCoords]);

    const markersCount = donationsWithCoords.length + ongsWithCoords.length;

    return (
        <div className="donations-map-page">
            <Container className="py-4">
                <Row className="mb-4 align-items-center">
                    <Col lg={8}>
                        <h1 className="fw-bold mb-2">
                            {showDonations ? 'Mapa de Donaciones Disponibles' : 'Mapa de ONGs Registradas'}
                        </h1>
                        <p className="text-muted mb-0">
                            {showDonations
                                ? 'Encuentra donaciones cercanas y accede a los detalles desde el mapa.'
                                : 'Explora las ONGs registradas y sus necesidades activas. Haz clic en una ONG para ver su ficha.'}
                        </p>
                    </Col>
                    <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
                        <Badge bg="info" className="fs-6 px-3 py-2">
                            {markersCount} con ubicaci&oacute;n
                        </Badge>
                    </Col>
                </Row>

                {loading && (
                    <div className="d-flex align-items-center gap-2 text-muted">
                        <Spinner animation="border" size="sm" />
                        Cargando mapa...
                    </div>
                )}

                {!loading && error && (
                    <Alert variant="danger" className="mt-3">
                        {error}
                    </Alert>
                )}

                {!loading && !error && donations.length === 0 && ongs.length === 0 && (
                    <Alert variant="info" className="mt-3">
                        {showDonations
                            ? 'No hay donaciones ni ONGs disponibles en este momento.'
                            : 'No hay ONGs registradas en este momento.'}
                    </Alert>
                )}

                {!loading && !error && (donations.length > 0 || ongs.length > 0) && donationsWithCoords.length === 0 && ongsWithCoords.length === 0 && (
                    <Alert variant="warning" className="mt-3">
                        Hay datos disponibles, pero ninguno tiene ubicaci&oacute;n asignada.
                    </Alert>
                )}

                <Card className="shadow-sm border-0 mt-3">
                    <Card.Body className="p-0">
                        <div className="map-wrapper">
                            <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} scrollWheelZoom>
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {donationsWithCoords.map((donation) => (
                                    <Marker
                                        key={donation.id}
                                        position={[donation.latitude, donation.longitude]}
                                        icon={donationMarkerIcon}
                                    >
                                        <Popup>
                                            <div className="map-popup">
                                                <h6 className="fw-bold mb-1">{donation.title}</h6>
                                                <div className="text-muted small mb-2">
                                                    {donation.category} &middot; {donation.city}
                                                </div>
                                                <Button
                                                    as={Link}
                                                    to={`/available-donations/${donation.id}`}
                                                    size="sm"
                                                    variant="primary"
                                                >
                                                    Ver detalle
                                                </Button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                                {ongsWithCoords.map((ong) => {
                                    const ongAddress = [ong.address, ong.postalCode, ong.city || ong.location]
                                        .filter(Boolean)
                                        .join(', ');
                                    const needsCount = activeNeedsByOng[ong.id] || 0;
                                    const markerIcon = needsCount > 0 ? ongMarkerActiveIcon : ongMarkerIcon;
                                    return (
                                        <Marker
                                            key={`ong-${ong.id}`}
                                            position={[ong.latitude, ong.longitude]}
                                            icon={markerIcon}
                                            eventHandlers={{
                                                click: () => navigate(`/ongs/${ong.id}`),
                                            }}
                                        >
                                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                                <div className="map-popup">
                                                    <div className="fw-bold">{ong.name || 'ONG'}</div>
                                                    {ongAddress && (
                                                        <div className="text-muted small">
                                                            {ongAddress}
                                                        </div>
                                                    )}
                                                    {needsCount > 0 && (
                                                        <div className="text-warning small">
                                                            {needsCount} necesidad{needsCount > 1 ? 'es' : ''} activa{needsCount > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </Tooltip>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    </Card.Body>
                </Card>
                {!loading && !error && ongsWithCoords.length > 0 && (
                    <div className="d-flex flex-wrap gap-3 mt-3 text-muted small">
                        <span className="d-flex align-items-center gap-2">
                            <span className="legend-dot"></span>
                            ONG registrada
                        </span>
                        <span className="d-flex align-items-center gap-2">
                            <span className="legend-dot legend-dot-active"></span>
                            ONG con necesidades activas
                        </span>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default DonationsMap;
