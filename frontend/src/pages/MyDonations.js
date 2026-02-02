import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { donationAPI } from '../services/api';
import './MyDonations.css';

function MyDonations() {
    const navigate = useNavigate();
    const location = useLocation();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadMyDonations();

        // Mostrar mensaje de éxito si viene del estado de navegación
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Limpiar el estado para que no se muestre de nuevo al refrescar
            window.history.replaceState({}, document.title);

            // Ocultar el mensaje después de 5 segundos
            setTimeout(() => {
                setSuccessMessage('');
            }, 5000);
        }
    }, [location]);

    const loadMyDonations = async () => {
        try {
            setLoading(true);
            const response = await donationAPI.getMyDonations();
            setDonations(response.data.donations || []);
            setError('');
        } catch (err) {
            console.error('Error al cargar donaciones:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Error al cargar tus donaciones';
            setError(errorMsg + '. Por favor, intenta cerrar sesión y volver a iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta donación?')) {
            try {
                await donationAPI.deleteDonation(id);
                setDonations(donations.filter(d => d.id !== id));
                setSuccessMessage('Donación eliminada exitosamente');
                setTimeout(() => setSuccessMessage(''), 5000);
            } catch (err) {
                console.error('Error al eliminar:', err);
                setError(err.response?.data?.error || 'Error al eliminar la donación');
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/donations/${id}/edit`);
    };

    const handleMarkAsDelivered = async (id) => {
        if (window.confirm('¿Confirmas que esta donación ha sido entregada?')) {
            try {
                await donationAPI.markAsDelivered(id);
                // Recargar las donaciones para mostrar el estado actualizado
                loadMyDonations();
                setSuccessMessage('Donación marcada como entregada');
                setTimeout(() => setSuccessMessage(''), 5000);
            } catch (err) {
                console.error('Error al marcar como entregada:', err);
                setError(err.response?.data?.error || 'Error al marcar como entregada');
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    const getStatusBadgeVariant = (status) => {
        const badges = {
            DISPONIBLE: 'success',
            ASIGNADO: 'warning',
            ENTREGADO: 'secondary'
        };
        return badges[status] || 'secondary';
    };

    const getStatusText = (status) => {
        const texts = {
            DISPONIBLE: 'Disponible',
            ASIGNADO: 'Asignado',
            ENTREGADO: 'Entregado'
        };
        return texts[status] || status;
    };

    const getCategoryBadgeVariant = (category) => {
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando tus donaciones...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="page-header mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <div>
                        <h1>
                            <i className="bi bi-box-seam me-2"></i>
                            Mis Donaciones
                        </h1>
                        <p className="text-muted">Gestiona tus donaciones creadas</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/create-donation')}
                        className="d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-plus-circle"></i>
                        Nueva Donación
                    </Button>
                </div>
            </div>

            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
                    <i className="bi bi-check-circle me-2"></i>
                    {successMessage}
                </Alert>
            )}

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </Alert>
            )}

            {donations.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <i className="bi bi-inbox display-1 text-muted"></i>
                        <h3 className="mt-3">No tienes donaciones</h3>
                        <p className="text-muted">Cuando crees una donación, aparecerá aquí</p>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/create-donation')}
                        >
                            Crear Primera Donación
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    <div className="mb-3">
                        <Badge bg="info">
                            {donations.length} donación{donations.length !== 1 ? 'es' : ''}
                        </Badge>
                    </div>
                    <Row>
                        {donations.map((donation) => (
                            <Col key={donation.id} lg={4} md={6} className="mb-4">
                                <Card className="h-100 donation-card shadow-sm">
                                    {/* Imagen */}
                                    <div className="donation-image-container">
                                        {donation.images && donation.images.length > 0 ? (
                                            <Card.Img
                                                variant="top"
                                                src={donation.images[0]}
                                                alt={donation.title}
                                                className="donation-image"
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen';
                                                }}
                                            />
                                        ) : (
                                            <div className="no-image">
                                                <i className="bi bi-image"></i>
                                                <p>Sin imagen</p>
                                            </div>
                                        )}
                                        {donation.images && donation.images.length > 1 && (
                                            <Badge bg="dark" className="image-count-badge">
                                                <i className="bi bi-images me-1"></i>
                                                {donation.images.length}
                                            </Badge>
                                        )}
                                        <Badge bg={getStatusBadgeVariant(donation.status)} className="status-badge">
                                            {getStatusText(donation.status)}
                                        </Badge>
                                    </div>

                                    <Card.Body className="d-flex flex-column">
                                        {/* Título y categoría */}
                                        <div className="mb-2">
                                            <h5 className="card-title mb-2">{donation.title}</h5>
                                            <Badge bg={getCategoryBadgeVariant(donation.category)}>
                                                {donation.category}
                                            </Badge>
                                        </div>

                                        {/* Descripción */}
                                        <Card.Text className="text-muted small flex-grow-1">
                                            {donation.description.length > 100
                                                ? `${donation.description.substring(0, 100)}...`
                                                : donation.description}
                                        </Card.Text>

                                        {/* Información adicional */}
                                        <div className="donation-info mb-3">
                                            <div className="info-item">
                                                <i className="bi bi-box-seam text-primary"></i>
                                                <span>Cantidad: {donation.quantity}</span>
                                            </div>
                                            <div className="info-item">
                                                <i className="bi bi-geo-alt text-danger"></i>
                                                <span>{donation.city}</span>
                                            </div>
                                            <div className="info-item">
                                                <i className="bi bi-calendar text-info"></i>
                                                <span>{formatDate(donation.createdAt)}</span>
                                            </div>
                                            {donation.assignedOng && (
                                                <div className="info-item">
                                                    <i className="bi bi-building text-success"></i>
                                                    <span>{donation.assignedOng.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones */}
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-fill"
                                                onClick={() => navigate(`/donations/${donation.id}`)}
                                            >
                                                <i className="bi bi-eye me-1"></i>
                                                Ver
                                            </Button>

                                            {donation.status === 'DISPONIBLE' && (
                                                <>
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        className="flex-fill"
                                                        onClick={() => handleEdit(donation.id)}
                                                    >
                                                        <i className="bi bi-pencil me-1"></i>
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(donation.id)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                </>
                                            )}

                                            {donation.status === 'ASIGNADO' && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="flex-fill"
                                                    onClick={() => handleMarkAsDelivered(donation.id)}
                                                >
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    Entregado
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </Container>
    );
}

export default MyDonations;
