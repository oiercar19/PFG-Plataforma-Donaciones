import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal, Form } from 'react-bootstrap';
import './MyOng.css';

const MyOng = () => {
    const [ongData, setOngData] = useState(null);
    const [assignedDonations, setAssignedDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        location: '',
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

            // Inicializar datos del formulario de edición
            setEditFormData({
                name: ongResponse.data.ong.name,
                description: ongResponse.data.ong.description || '',
                location: ongResponse.data.ong.location,
                contactEmail: ongResponse.data.ong.contactEmail,
                contactPhone: ongResponse.data.ong.contactPhone,
            });
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

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value,
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setEditLoading(true);
            setError('');
            setSuccess('');

            await authAPI.updateMyOngData(editFormData);
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

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
                    {/* Información General de la ONG */}
                    <Card className="ong-info-card mb-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h2 className="ong-name">{ongData.name}</h2>
                                    <div className="ong-status mb-2">
                                        Estado: {getStatusBadge(ongData.status)}
                                    </div>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowEditModal(true)}
                                    disabled={ongData.status !== 'APPROVED'}
                                >
                                    <i className="bi bi-pencil me-2"></i>
                                    Editar Información
                                </Button>
                            </div>

                            {ongData.status === 'PENDING' && (
                                <Alert variant="info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Tu ONG está pendiente de aprobación por un administrador. Una vez aprobada,
                                    podrás solicitar donaciones y gestionar tu organización.
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
                                        <strong>Ubicación:</strong> <span>{ongData.location}</span>
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
                                        <strong>Teléfono:</strong> <span>{ongData.contactPhone}</span>
                                    </div>
                                </Col>
                                {ongData.description && (
                                    <Col xs={12} className="mb-3">
                                        <div className="detail-item">
                                            <i className="bi bi-info-circle me-2 text-primary"></i>
                                            <strong>Descripción:</strong>
                                            <p className="mt-2 mb-0">{ongData.description}</p>
                                        </div>
                                    </Col>
                                )}
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

                    {/* Estadísticas */}
                    {ongData.status === 'APPROVED' && (
                        <Row className="statistics-row mb-4">
                            <Col md={4} className="mb-3">
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
                            <Col md={4} className="mb-3">
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
                            <Col md={4} className="mb-3">
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
                        </Row>
                    )}

                    {/* Donaciones Asignadas Recientes */}
                    {ongData.status === 'APPROVED' && (
                        <Card className="donations-card">
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
                                        <p className="text-muted mt-3">No tienes donaciones asignadas aún</p>
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
                    )}

                    {/* Acciones Rápidas */}
                    {ongData.status === 'APPROVED' && (
                        <Card className="quick-actions-card mt-4">
                            <Card.Header>
                                <h3>
                                    <i className="bi bi-lightning-fill me-2"></i>
                                    Acciones Rápidas
                                </h3>
                            </Card.Header>
                            <Card.Body>
                                <Row>
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
                                            Crear Donación
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}

            {/* Modal de Edición */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
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

                        <Form.Group className="mb-3">
                            <Form.Label>Ubicación *</Form.Label>
                            <Form.Control
                                type="text"
                                name="location"
                                value={editFormData.location}
                                onChange={handleEditChange}
                                required
                                placeholder="Ciudad, Provincia"
                            />
                        </Form.Group>

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
