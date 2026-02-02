import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { donationAPI } from '../services/api';
import './AvailableDonationDetails.css';

const AvailableDonationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const loadDonation = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await donationAPI.getDonationById(id);
            setDonation(response.data.donation);
        } catch (err) {
            console.error('Error al cargar donación:', err);
            setError('Error al cargar los detalles de la donación');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDonation();
    }, [loadDonation]);

    const handleRequestDonation = async () => {
        try {
            setRequesting(true);
            setError('');
            await donationAPI.requestDonation(id);
            setSuccess('¡Solicitud enviada correctamente! El donante será notificado.');
            setShowRequestModal(false);
            setTimeout(() => {
                navigate('/available-donations');
            }, 2000);
        } catch (err) {
            console.error('Error al solicitar donación:', err);
            setError(err.response?.data?.error || 'Error al solicitar la donación');
            setShowRequestModal(false);
        } finally {
            setRequesting(false);
        }
    };

    const getCategoryBadge = (category) => {
        const badges = {
            ALIMENTOS: 'success',
            ROPA: 'info',
            MEDICINAS: 'danger',
            JUGUETES: 'warning',
            MUEBLES: 'secondary',
            ELECTRONICA: 'primary',
            OTRO: 'dark'
        };
        return badges[category] || 'secondary';
    };

    const getStatusBadge = (status) => {
        const badges = {
            DISPONIBLE: { bg: 'success', text: 'Disponible' },
            ASIGNADA: { bg: 'warning', text: 'Asignada' },
            ENTREGADA: { bg: 'secondary', text: 'Entregada' }
        };
        return badges[status] || { bg: 'secondary', text: status };
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando detalles...</p>
            </Container>
        );
    }

    if (error && !donation) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </Alert>
                <Button variant="secondary" onClick={() => navigate('/available-donations')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a donaciones
                </Button>
            </Container>
        );
    }

    if (!donation) {
        return null;
    }

    const statusBadge = getStatusBadge(donation.status);

    return (
        <Container className="py-4">
            {/* Botón volver */}
            <Button
                variant="outline-secondary"
                className="mb-3"
                onClick={() => navigate('/available-donations')}
            >
                <i className="bi bi-arrow-left me-2"></i>
                Volver a donaciones
            </Button>

            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                </Alert>
            )}

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </Alert>
            )}

            <Card className="donation-details-card shadow">
                <Card.Body className="p-4">
                    {/* Encabezado */}
                    <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                            <h2 className="mb-2">{donation.title}</h2>
                            <div className="d-flex gap-2 flex-wrap">
                                <Badge bg={getCategoryBadge(donation.category)}>
                                    <i className="bi bi-tag me-1"></i>
                                    {donation.category}
                                </Badge>
                                <Badge bg={statusBadge.bg}>
                                    <i className="bi bi-circle-fill me-1"></i>
                                    {statusBadge.text}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Row>
                        {/* Galería de imágenes */}
                        <Col lg={6} className="mb-4">
                            {donation.images && donation.images.length > 0 ? (
                                <div className="image-gallery">
                                    <div className="main-image-container">
                                        <img
                                            src={donation.images[selectedImage]}
                                            alt={donation.title}
                                            className="main-image"
                                        />
                                    </div>
                                    {donation.images.length > 1 && (
                                        <div className="thumbnail-container">
                                            {donation.images.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={image}
                                                    alt={`${donation.title} ${index + 1}`}
                                                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                                    onClick={() => setSelectedImage(index)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-image-placeholder">
                                    <i className="bi bi-image"></i>
                                    <p>Sin imágenes disponibles</p>
                                </div>
                            )}
                        </Col>

                        {/* Información */}
                        <Col lg={6}>
                            {/* Descripción */}
                            <div className="mb-4">
                                <h5 className="text-primary mb-3">
                                    <i className="bi bi-file-text me-2"></i>
                                    Descripción
                                </h5>
                                <p className="description-text">{donation.description}</p>
                            </div>

                            {/* Detalles */}
                            <div className="mb-4">
                                <h5 className="text-primary mb-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Detalles
                                </h5>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <i className="bi bi-box-seam text-primary"></i>
                                        <div>
                                            <strong>Cantidad</strong>
                                            <p>{donation.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <i className="bi bi-geo-alt text-danger"></i>
                                        <div>
                                            <strong>Ubicación</strong>
                                            <p>
                                                {donation.city}
                                                {donation.province && `, ${donation.province}`}
                                            </p>
                                        </div>
                                    </div>
                                    {donation.address && (
                                        <div className="detail-item">
                                            <i className="bi bi-pin-map text-info"></i>
                                            <div>
                                                <strong>Dirección</strong>
                                                <p>{donation.address}</p>
                                            </div>
                                        </div>
                                    )}
                                    {donation.postalCode && (
                                        <div className="detail-item">
                                            <i className="bi bi-mailbox text-warning"></i>
                                            <div>
                                                <strong>Código Postal</strong>
                                                <p>{donation.postalCode}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Información del donante */}
                            <div className="mb-4">
                                <h5 className="text-primary mb-3">
                                    <i className="bi bi-person me-2"></i>
                                    Donante
                                </h5>
                                <Card className="bg-light border-0">
                                    <Card.Body>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="donor-icon">
                                                {donation.donor.role === 'ONG' ? (
                                                    <i className="bi bi-building"></i>
                                                ) : (
                                                    <i className="bi bi-person-circle"></i>
                                                )}
                                            </div>
                                            <div>
                                                <h6 className="mb-0">{donation.donor.username}</h6>
                                                <small className="text-muted">
                                                    {donation.donor.role === 'ONG' ? 'Organización' : 'Donante'}
                                                </small>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>

                            {/* Botón de solicitar */}
                            {donation.status === 'DISPONIBLE' && (
                                <div className="action-buttons">
                                    <Button
                                        variant="success"
                                        size="lg"
                                        className="w-100 mb-2"
                                        onClick={() => setShowRequestModal(true)}
                                        disabled={requesting}
                                    >
                                        <i className="bi bi-hand-thumbs-up me-2"></i>
                                        Solicitar Donación
                                    </Button>
                                    <Alert variant="info" className="mb-0 small">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Al solicitar esta donación, el donante recibirá una notificación.
                                        Próximamente podrás comunicarte mediante chat.
                                    </Alert>
                                </div>
                            )}

                            {donation.status === 'ASIGNADA' && (
                                <Alert variant="warning">
                                    <i className="bi bi-clock-history me-2"></i>
                                    Esta donación ya ha sido asignada a otra organización.
                                </Alert>
                            )}

                            {donation.status === 'ENTREGADA' && (
                                <Alert variant="secondary">
                                    <i className="bi bi-check-circle me-2"></i>
                                    Esta donación ya ha sido entregada.
                                </Alert>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Modal de confirmación */}
            <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-hand-thumbs-up me-2 text-success"></i>
                        Confirmar Solicitud
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Estás seguro de que deseas solicitar esta donación?</p>
                    <Alert variant="info" className="mb-0 small">
                        <i className="bi bi-info-circle me-1"></i>
                        El donante será notificado de tu solicitud y podrá ponerse en contacto contigo.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleRequestDonation}
                        disabled={requesting}
                    >
                        {requesting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Solicitando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle me-2"></i>
                                Confirmar Solicitud
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AvailableDonationDetails;
