import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { donationAPI, conversationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DonationDetails.css';

function DonationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImage, setModalImage] = useState('');

    const openImageModal = (imageUrl) => {
        setModalImage(imageUrl);
        setShowImageModal(true);
    };

    const loadDonation = useCallback(async () => {
        try {
            setLoading(true);
            const response = await donationAPI.getDonationById(id);
            setDonation(response.data.donation);
            setError('');
        } catch (err) {
            console.error('Error al cargar donación:', err);
            setError('Error al cargar la donación');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDonation();
    }, [loadDonation]);

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta donación?')) {
            try {
                await donationAPI.deleteDonation(id);
                navigate('/my-donations', {
                    state: { message: 'Donación eliminada exitosamente' }
                });
            } catch (err) {
                console.error('Error al eliminar:', err);
                setError(err.response?.data?.error || 'Error al eliminar la donación');
            }
        }
    };

    const handleMarkAsDelivered = async () => {
        if (window.confirm('¿Confirmas que esta donación ha sido entregada?')) {
            try {
                await donationAPI.markAsDelivered(id);
                setSuccess('Donación marcada como entregada exitosamente');
                loadDonation();
            } catch (err) {
                console.error('Error al marcar como entregada:', err);
                setError(err.response?.data?.error || 'Error al marcar como entregada');
            }
        }
    };

    const handleRejectDonation = async () => {
        if (window.confirm('?Deseas rechazar esta donaci?n y dejarla disponible nuevamente?')) {
            try {
                await donationAPI.rejectDonation(id);
                setSuccess('Donación rechazada y puesta como disponible');
                loadDonation();
            } catch (err) {
                console.error('Error al rechazar:', err);
                setError(err.response?.data?.error || 'Error al rechazar la donaci?n');
            }
        }
    };

    const handleOpenChat = async () => {
        try {
            const response = await conversationAPI.getConversationByDonation(id);
            const conversation = response.data.conversation;
            navigate(`/chats/${conversation.id}`);
        } catch (err) {
            console.error('Error al abrir chat:', err);
            setError(err.response?.data?.error || 'Error al abrir el chat');
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
            ASIGNADO: { bg: 'warning', text: 'Asignado' },
            ENTREGADO: { bg: 'secondary', text: 'Entregado' }
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
                    {error || 'Donación no encontrada'}
                </Alert>
                <Button variant="secondary" onClick={() => navigate('/my-donations')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a Mis Donaciones
                </Button>
            </Container>
        );
    }

    if (!donation) {
        return null;
    }

    const statusBadge = getStatusBadge(donation.status);


    return (
        <>
            <Container className="py-4">
            {/* Botón volver */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/my-donations')}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a Mis Donaciones
                </Button>

                {/* Botones de acción */}
                <div className="d-flex gap-2">
                    {donation.status === 'DISPONIBLE' && (
                        <>
                            <Button
                                variant="outline-warning"
                                onClick={() => navigate(`/donations/${id}/edit`)}
                            >
                                <i className="bi bi-pencil me-2"></i>
                                Editar
                            </Button>
                            <Button
                                variant="outline-danger"
                                onClick={handleDelete}
                            >
                                <i className="bi bi-trash me-2"></i>
                                Eliminar
                            </Button>
                        </>
                    )}
                    {donation.status === 'ASIGNADO' && (
                        <>
                            <Button
                                variant="outline-primary"
                                onClick={handleOpenChat}
                            >
                                <i className="bi bi-chat-dots me-2"></i>
                                Ver chat
                            </Button>
                            {donation.donorId === user?.id && (
                                <Button
                                    variant="outline-danger"
                                    onClick={handleRejectDonation}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Rechazar
                                </Button>
                            )}
                            {donation.donorId === user?.id && (
                                <Button
                                    variant="success"
                                    onClick={handleMarkAsDelivered}
                                >
                                    <i className="bi bi-check-circle me-2"></i>
                                    Marcar como Entregado
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

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
                                            className="main-image clickable-image"
                                            onClick={() => openImageModal(donation.images[selectedImage])}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/600x400?text=Sin+Imagen';
                                            }}
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
                                                    onDoubleClick={() => openImageModal(image)}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/100?text=Sin+Imagen';
                                                    }}
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

                            {/* Información de ONG asignada */}
                        </Col>
                    </Row>

                    {donation.assignedOng && (
                        <div className="ong-full">
                            <div className="donor-header">
                                <i className="bi bi-building"></i>
                                <h5>ONG Asignada</h5>
                            </div>
                            <div className="ong-content">
                                <div className="ong-text">
                                    <h6>{donation.assignedOng.name}</h6>
                                    {donation.assignedOng.contactEmail && (
                                        <div className="ong-line">
                                            <i className="bi bi-envelope"></i>
                                            <span>{donation.assignedOng.contactEmail}</span>
                                        </div>
                                    )}
                                    {donation.assignedOng.contactPhone && (
                                        <div className="ong-line">
                                            <i className="bi bi-telephone"></i>
                                            <span>{donation.assignedOng.contactPhone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
            </Container>

            <Modal
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                centered
                size="lg"
            >
                <Modal.Body className="p-0">
                    {modalImage && (
                        <img
                            src={modalImage}
                            alt="Vista ampliada"
                            className="w-100 modal-image"
                        />
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default DonationDetails;
