import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DonationsMap.css';

const donationMarkerIcon = L.divIcon({
    className: '',
    html: '<div class="donation-marker"><div class="donation-marker-box"></div></div>',
    iconSize: [24, 28],
    iconAnchor: [12, 26],
    popupAnchor: [0, -12],
});

const DEFAULT_CENTER = [40.4168, -3.7038];
const DEFAULT_ZOOM = 6;

const DonationsMap = () => {
    const { isDonor } = useAuth();
    const includeOwn = isDonor();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        const loadDonations = async () => {
            try {
                const response = await donationAPI.getAvailableDonations({
                    includeOwn: includeOwn ? 'true' : 'false',
                });
                const data = response.data?.donations || [];
                if (isMounted) {
                    setDonations(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError('No se pudieron cargar las donaciones disponibles.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDonations();
        return () => {
            isMounted = false;
        };
    }, [includeOwn]);

    const donationsWithCoords = useMemo(
        () =>
            donations.filter(
                (donation) =>
                    typeof donation.latitude === 'number' &&
                    typeof donation.longitude === 'number'
            ),
        [donations]
    );

    const mapCenter = useMemo(() => {
        if (donationsWithCoords.length > 0) {
            return [donationsWithCoords[0].latitude, donationsWithCoords[0].longitude];
        }
        return DEFAULT_CENTER;
    }, [donationsWithCoords]);

    return (
        <div className="donations-map-page">
            <Container className="py-4">
                <Row className="mb-4 align-items-center">
                    <Col lg={8}>
                        <h1 className="fw-bold mb-2">Mapa de Donaciones Disponibles</h1>
                        <p className="text-muted mb-0">
                            Encuentra donaciones cercanas y accede a los detalles desde el mapa.
                        </p>
                    </Col>
                    <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
                        <Badge bg="info" className="fs-6 px-3 py-2">
                            {donationsWithCoords.length} con ubicaci&oacute;n
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

                {!loading && !error && donations.length === 0 && (
                    <Alert variant="info" className="mt-3">
                        No hay donaciones disponibles en este momento.
                    </Alert>
                )}

                {!loading && !error && donations.length > 0 && donationsWithCoords.length === 0 && (
                    <Alert variant="warning" className="mt-3">
                        Hay donaciones disponibles, pero ninguna tiene ubicaci&oacute;n asignada.
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
                            </MapContainer>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default DonationsMap;
