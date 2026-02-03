import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Badge, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { conversationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Chats.css';

function Chats() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeKey, setActiveKey] = useState('OPEN');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [conversationsByStatus, setConversationsByStatus] = useState({ OPEN: [], CLOSED: [] });

    const loadConversations = useCallback(async (status) => {
        try {
            setLoading(true);
            setError('');
            const response = await conversationAPI.listConversations(status);
            setConversationsByStatus((prev) => ({
                ...prev,
                [status]: response.data.conversations || [],
            }));
            window.dispatchEvent(new Event('chat-read'));
        } catch (err) {
            console.error('Error al cargar conversaciones:', err);
            setError(err.response?.data?.error || 'Error al cargar las conversaciones');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations(activeKey);
    }, [activeKey, loadConversations]);

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDonationStatusBadge = (status) => {
        const map = {
            DISPONIBLE: { bg: 'success', text: 'Disponible' },
            ASIGNADO: { bg: 'warning', text: 'Asignado' },
            ENTREGADO: { bg: 'secondary', text: 'Entregado' },
        };
        return map[status] || { bg: 'secondary', text: status };
    };

    const renderConversationCard = (conversation) => {
        const lastMessage = conversation.messages?.[0];
        const lastPreview = lastMessage ? (lastMessage.content.length > 80 ? `${lastMessage.content.substring(0, 80)}...` : lastMessage.content) : null;
        const donationBadge = getDonationStatusBadge(conversation.donation?.status);

        let counterpart = 'Usuario';
        let ongInfo = null;
        if (user?.role === 'ONG') {
            counterpart = conversation.donation?.donor?.username || 'Donante';
        } else {
            counterpart = conversation.ong?.name || conversation.donation?.assignedOng?.name || 'ONG';
            ongInfo = conversation.ong || conversation.donation?.assignedOng;
        }

        return (
            <Card key={conversation.id} className="chat-card shadow-sm">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                            <h5 className="mb-1">{conversation.donation?.title || 'Donaci?n'}</h5>
                            <div className="text-muted small">
                                <i className="bi bi-people me-1"></i>
                                {counterpart}
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {conversation.unreadCount > 0 && (
                                <Badge bg="danger" pill>
                                    {conversation.unreadCount}
                                </Badge>
                            )}
                            <Badge bg={donationBadge.bg}>{donationBadge.text}</Badge>
                        </div>
                    </div>

                    {ongInfo && (ongInfo.contactEmail || ongInfo.contactPhone) && (
                        <div className="chat-ong-contact mt-2">
                            {ongInfo.contactEmail && (
                                <div className="text-muted small">
                                    <i className="bi bi-envelope me-1"></i>
                                    {ongInfo.contactEmail}
                                </div>
                            )}
                            {ongInfo.contactPhone && (
                                <div className="text-muted small">
                                    <i className="bi bi-telephone me-1"></i>
                                    {ongInfo.contactPhone}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="chat-meta mt-3">
                        <div className="text-muted small">
                            <i className="bi bi-chat-dots me-1"></i>
                            {lastPreview || 'Sin mensajes a?n'}
                        </div>
                        <div className="text-muted small">
                            <i className="bi bi-clock me-1"></i>
                            {formatDateTime(conversation.updatedAt)}
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/chats/${conversation.id}`)}
                        >
                            <i className="bi bi-chat-left-text me-1"></i>
                            Ver chat
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        );
    };

    const conversations = conversationsByStatus[activeKey] || [];

    return (
        <Container className="py-4">
            <div className="page-header mb-4">
                <h1>
                    <i className="bi bi-chat-dots me-2"></i>
                    Chats
                </h1>
                <p className="text-muted">Gestiona tus conversaciones con ONGs y donantes</p>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </Alert>
            )}

            <Tabs
                activeKey={activeKey}
                onSelect={(k) => k && setActiveKey(k)}
                className="mb-3"
            >
                <Tab eventKey="OPEN" title={`Abiertos${(conversationsByStatus.OPEN || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0) ? ` (${(conversationsByStatus.OPEN || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0)})` : ''}`}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Cargando chats...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                <h4 className="mt-3">No tienes chats abiertos</h4>
                                <p className="text-muted">Cuando una donaci?n sea asignada, aparecer? aqu?</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <div className="chat-list">
                            {conversations.map(renderConversationCard)}
                        </div>
                    )}
                </Tab>
                <Tab eventKey="CLOSED" title="Cerrados">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Cargando historial...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <i className="bi bi-archive fs-1 text-muted"></i>
                                <h4 className="mt-3">No tienes chats cerrados</h4>
                                <p className="text-muted">Aqu? se guardar? el historial cuando un chat se cierre</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <div className="chat-list">
                            {conversations.map(renderConversationCard)}
                        </div>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
}

export default Chats;
