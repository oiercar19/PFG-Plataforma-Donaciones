import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { authAPI, needAPI } from '../services/api';

const OngDetails = () => {
    const { id } = useParams();
    const [ong, setOng] = useState(null);
    const [needs, setNeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                setError('');
                const [ongsResponse, needsResponse] = await Promise.all([
                    authAPI.getPublicOngs(),
                    needAPI.getNeeds({ status: 'OPEN', ongId: id }),
                ]);

                const ongsData = ongsResponse.data?.ongs || [];
                const foundOng = ongsData.find((item) => String(item.id) === String(id));

                if (!foundOng) {
                    throw new Error('ONG no encontrada');
                }

                if (isMounted) {
                    setOng(foundOng);
                    setNeeds(needsResponse.data?.needs || []);
                }
            } catch (err) {
                if (isMounted) {
                    const message = err.response?.data?.error || err.message || 'Error al cargar la ONG';
                    setError(message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const address = useMemo(() => {
        if (!ong) return '';
        return [ong.address, ong.postalCode, ong.city || ong.location].filter(Boolean).join(', ');
    }, [ong]);

    const getCategoryBadge = (category) => {
        const badges = {
            ALIMENTOS: 'success',
            ROPA: 'info',
            MEDICINAS: 'danger',
            JUGUETES: 'warning',
            MUEBLES: 'secondary',
            ELECTRONICA: 'primary',
            OTRO: 'dark',
        };
        return badges[category] || 'secondary';
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando ONG...</p>
            </Container>
        );
    }

    if (error || !ong) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className="mb-4">
                    {error || 'ONG no encontrada'}
                </Alert>
                <Button as={Link} to="/map" variant="outline-primary">
                    Volver al mapa
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4 align-items-center">
                <Col>
                    <h1 className="fw-bold mb-1">{ong.name || 'ONG'}</h1>
                    <div className="text-muted">
                        {address || 'Ubicación no disponible'}
                    </div>
                </Col>
                <Col className="text-lg-end mt-3 mt-lg-0">
                    <Badge bg={needs.length > 0 ? 'warning' : 'secondary'} className="fs-6 px-3 py-2">
                        {needs.length > 0 ? `${needs.length} necesidades activas` : 'Sin necesidades activas'}
                    </Badge>
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={5}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Datos b&aacute;sicos</h5>
                            {ong.type && (
                                <p className="mb-2">
                                    <strong>Tipo:</strong> {ong.type}
                                </p>
                            )}
                            {ong.description && (
                                <p className="mb-2">
                                    <strong>Descripci&oacute;n:</strong> {ong.description}
                                </p>
                            )}
                            {ong.contactEmail && (
                                <p className="mb-2">
                                    <i className="bi bi-envelope me-1"></i>
                                    {ong.contactEmail}
                                </p>
                            )}
                            {ong.contactPhone && (
                                <p className="mb-2">
                                    <i className="bi bi-telephone me-1"></i>
                                    {ong.contactPhone}
                                </p>
                            )}
                            <Button as={Link} to="/map" variant="outline-primary" className="mt-3">
                                <i className="bi bi-geo-alt me-1"></i>
                                Volver al mapa
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={7}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Necesidades activas</h5>
                            {needs.length === 0 ? (
                                <div className="text-muted">
                                    Esta ONG no tiene necesidades activas en este momento.
                                </div>
                            ) : (
                                <Row>
                                    {needs.map((need) => (
                                        <Col md={6} key={need.id} className="mb-3">
                                            <Card className="h-100 border-0 shadow-sm">
                                                <Card.Body className="d-flex flex-column">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">{need.title}</h6>
                                                            <Badge bg={getCategoryBadge(need.category)} className="me-2">
                                                                {need.category}
                                                            </Badge>
                                                            {need.urgent && (
                                                                <Badge bg="danger">
                                                                    <i className="bi bi-exclamation-circle me-1"></i>
                                                                    Urgente
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-muted small mb-3 flex-grow-1">
                                                        {need.description && need.description.length > 120
                                                            ? `${need.description.substring(0, 120)}...`
                                                            : need.description}
                                                    </div>
                                                    <Button
                                                        as={Link}
                                                        to={`/needs/${need.id}`}
                                                        variant="primary"
                                                        size="sm"
                                                    >
                                                        Ver necesidad
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default OngDetails;
