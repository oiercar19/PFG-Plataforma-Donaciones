import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Badge, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { needAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './MyNeeds.css';

const MyNeeds = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeKey, setActiveKey] = useState('OPEN');
    const [needsByStatus, setNeedsByStatus] = useState({ OPEN: [], CLOSED: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role === 'ONG' && user?.ong?.status !== 'APPROVED') {
            navigate('/');
        }
    }, [user, navigate]);

    const loadNeeds = useCallback(async (status) => {
        try {
            setLoading(true);
            setError('');
            const response = await needAPI.getMyNeeds({ status });
            setNeedsByStatus((prev) => ({
                ...prev,
                [status]: response.data.needs || [],
            }));
        } catch (err) {
            console.error('Error loading needs:', err);
            setError(err.response?.data?.error || 'Error loading needs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNeeds(activeKey);
    }, [activeKey, loadNeeds]);

    const handleCloseNeed = async (needId) => {
        if (!window.confirm('Close this need?')) return;
        try {
            await needAPI.closeNeed(needId);
            loadNeeds(activeKey);
        } catch (err) {
            console.error('Error closing need:', err);
            setError(err.response?.data?.error || 'Error closing need');
        }
    };

    const renderNeedCard = (need) => (
        <Card key={need.id} className="need-card shadow-sm">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                        <h5 className="mb-2">{need.title}</h5>
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
                    <Badge bg={need.status === 'OPEN' ? 'success' : 'secondary'}>
                        {need.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                    </Badge>
                </div>

                <p className="text-muted mt-3">
                    {need.description.length > 120
                        ? `${need.description.substring(0, 120)}...`
                        : need.description}
                </p>

                <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                        <i className="bi bi-chat-dots me-1"></i>
                        {need._count?.conversations || 0} chats
                    </small>
                    <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => navigate(`/needs/${need.id}`)}>
                            Ver detalles
                        </Button>
                        {need.status === 'OPEN' && (
                            <Button variant="outline-danger" size="sm" onClick={() => handleCloseNeed(need.id)}>
                                Cerrar
                            </Button>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <div>
                    <h1>
                        <i className="bi bi-clipboard-heart me-2"></i>
                        Mis necesidades
                    </h1>
                    <p className="text-muted">Gestiona las necesidades publicadas por tu ONG</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/create-need')}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Publicar necesidad
                </Button>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Tabs activeKey={activeKey} onSelect={(k) => k && setActiveKey(k)} className="mb-3">
                <Tab eventKey="OPEN" title="Abiertas">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Cargando...</p>
                        </div>
                    ) : needsByStatus.OPEN.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                <h4 className="mt-3">No tienes necesidades abiertas</h4>
                                <p className="text-muted">Publica una nueva necesidad para empezar</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <div className="needs-list">
                            {needsByStatus.OPEN.map(renderNeedCard)}
                        </div>
                    )}
                </Tab>
                <Tab eventKey="CLOSED" title="Cerradas">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Cargando...</p>
                        </div>
                    ) : needsByStatus.CLOSED.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <i className="bi bi-archive fs-1 text-muted"></i>
                                <h4 className="mt-3">No hay necesidades cerradas</h4>
                            </Card.Body>
                        </Card>
                    ) : (
                        <div className="needs-list">
                            {needsByStatus.CLOSED.map(renderNeedCard)}
                        </div>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default MyNeeds;
