import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { needAPI, conversationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './NeedDetails.css';

const NeedDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [need, setNeed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadNeed = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await needAPI.getNeedById(id);
            setNeed(response.data.need);
        } catch (err) {
            console.error('Error loading need:', err);
            setError(err.response?.data?.error || 'Error loading need');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadNeed();
    }, [loadNeed]);

    const handleOpenChat = async () => {
        try {
            const response = await conversationAPI.openNeedConversation(id);
            const conversation = response.data.conversation;
            navigate(`/chats/${conversation.id}`);
        } catch (err) {
            console.error('Error opening chat:', err);
            setError(err.response?.data?.error || 'Error opening chat');
        }
    };

    const handleCloseNeed = async () => {
        if (!window.confirm('Are you sure you want to close this need?')) {
            return;
        }
        try {
            await needAPI.closeNeed(id);
            setSuccess('Need closed successfully');
            loadNeed();
        } catch (err) {
            console.error('Error closing need:', err);
            setError(err.response?.data?.error || 'Error closing need');
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando detalles...</p>
            </Container>
        );
    }

    const backPath = user?.role === 'ONG' ? '/my-needs' : '/needs';

    if (error && !need) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={() => navigate(backPath)}>
                    Volver a necesidades
                </Button>
            </Container>
        );
    }

    if (!need) return null;

    const isOwnerOng = user?.role === 'ONG' && (user?.ong?.id === need.ong?.id || user?.ong?.id === need.ongId);
    const isDonor = user?.role === 'DONANTE';
    const statusBadge = need.status === 'OPEN' ? { bg: 'success', text: 'Abierta' } : { bg: 'secondary', text: 'Cerrada' };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <Button variant="outline-secondary" onClick={() => navigate(backPath)}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a necesidades
                </Button>
                <Badge bg={statusBadge.bg}>{statusBadge.text}</Badge>
            </div>

            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Card className="need-details-card shadow-sm mb-3">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                            <h2 className="mb-2">{need.title}</h2>
                            <div className="d-flex gap-2 flex-wrap">
                                <Badge bg="primary">{need.category}</Badge>
                                {need.urgent && (
                                    <Badge bg="danger">
                                        <i className="bi bi-exclamation-circle me-1"></i>
                                        Urgente
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {isOwnerOng && need.status === 'OPEN' && (
                            <Button variant="outline-danger" onClick={handleCloseNeed}>
                                <i className="bi bi-x-circle me-1"></i>
                                Cerrar necesidad
                            </Button>
                        )}
                    </div>

                    <div className="mt-4">
                        <h5 className="text-primary mb-2">
                            <i className="bi bi-file-text me-2"></i>
                            Descripcion
                        </h5>
                        <p className="text-muted">{need.description}</p>
                    </div>

                    {need.quantity && (
                        <div className="mt-3">
                            <h6 className="text-primary mb-2">
                                <i className="bi bi-box-seam me-2"></i>
                                Cantidad
                            </h6>
                            <p>{need.quantity}</p>
                        </div>
                    )}

                    {need.ong && (
                        <div className="mt-4">
                            <h5 className="text-primary mb-2">
                                <i className="bi bi-building me-2"></i>
                                ONG
                            </h5>
                            <div className="text-muted">
                                <div><strong>{need.ong.name}</strong></div>
                                {need.ong.contactEmail && (
                                    <div><i className="bi bi-envelope me-1"></i>{need.ong.contactEmail}</div>
                                )}
                                {need.ong.contactPhone && (
                                    <div><i className="bi bi-telephone me-1"></i>{need.ong.contactPhone}</div>
                                )}
                                {[need.ong.address, need.ong.postalCode, need.ong.city || need.ong.location].filter(Boolean).length > 0 && (
                                    <div>
                                        <i className="bi bi-geo-alt me-1"></i>
                                        {[need.ong.address, need.ong.postalCode, need.ong.city || need.ong.location].filter(Boolean).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isDonor && need.status === 'OPEN' && (
                        <div className="mt-4">
                            <Button variant="primary" onClick={handleOpenChat}>
                                <i className="bi bi-chat-dots me-2"></i>
                                Abrir chat con la ONG
                            </Button>
                        </div>
                    )}

                    {need.status === 'CLOSED' && (
                        <Alert variant="secondary" className="mt-4">
                            <i className="bi bi-lock me-2"></i>
                            Esta necesidad esta cerrada.
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default NeedDetails;
