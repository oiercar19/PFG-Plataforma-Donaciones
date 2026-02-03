import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Card, Button, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ChatDetails.css';

function ChatDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const loadConversation = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await conversationAPI.getConversationById(id);
            setConversation(response.data.conversation);
        } catch (err) {
            console.error('Error al cargar conversaci?n:', err);
            setError(err.response?.data?.error || 'Error al cargar el chat');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadConversation();
    }, [loadConversation]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            setSending(true);
            const response = await conversationAPI.sendMessage(id, message.trim());
            const newMessage = response.data.message;
            setConversation((prev) => ({
                ...prev,
                messages: [...(prev?.messages || []), newMessage],
                updatedAt: newMessage.createdAt,
            }));
            setMessage('');
        } catch (err) {
            console.error('Error al enviar mensaje:', err);
            setError(err.response?.data?.error || 'Error al enviar el mensaje');
        } finally {
            setSending(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const map = {
            OPEN: { bg: 'success', text: 'Abierto' },
            CLOSED: { bg: 'secondary', text: 'Cerrado' },
        };
        return map[status] || { bg: 'secondary', text: status };
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando chat...</p>
            </Container>
        );
    }

    if (!conversation) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error || 'Chat no encontrado'}
                </Alert>
                <Button variant="secondary" onClick={() => navigate('/chats')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a chats
                </Button>
            </Container>
        );
    }

    const statusBadge = getStatusBadge(conversation.status);
    const donation = conversation.donation;
    const ongInfo = conversation.ong || donation?.assignedOng || null;
    const isClosed = conversation.status === 'CLOSED';

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <Button variant="outline-secondary" onClick={() => navigate('/chats')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a chats
                </Button>
                <Badge bg={statusBadge.bg}>{statusBadge.text}</Badge>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </Alert>
            )}

            <Card className="chat-details-card shadow-sm mb-3">
                <Card.Body>
                    <div className="d-flex justify-content-between flex-wrap gap-2">
                        <div>
                            <h5 className="mb-1">{donation?.title || 'Donación'}</h5>
                            <div className="text-muted small">
                                <i className="bi bi-tag me-1"></i>
                                {donation?.category || 'Sin categor?a'}
                            </div>
                        </div>
                        <Button variant="outline-primary" size="sm" onClick={() => navigate(`/donations/${donation?.id}`)}>
                            <i className="bi bi-box-seam me-1"></i>
                            Ver donación
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {ongInfo && (
                <Card className="chat-details-card shadow-sm mb-3">
                    <Card.Body>
                        <div className="d-flex justify-content-between flex-wrap gap-2">
                            <div>
                                <h6 className="mb-1">
                                    <i className="bi bi-building me-2"></i>
                                    {ongInfo.name || 'ONG'}
                                </h6>
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
                        </div>
                    </Card.Body>
                </Card>
            )}

            {isClosed && (
                <Alert variant="secondary">
                    <i className="bi bi-lock me-2"></i>
                    Este chat est? cerrado y ya no admite nuevos mensajes.
                </Alert>
            )}

            <Card className="chat-messages-card shadow-sm">
                <Card.Body className="chat-messages">
                    {conversation.messages?.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <i className="bi bi-chat-dots fs-2"></i>
                            <p className="mt-2">A?n no hay mensajes</p>
                        </div>
                    ) : (
                        conversation.messages.map((msg) => {
                            const isMine = msg.sender?.id === user?.id;
                            return (
                                <div key={msg.id} className={`chat-message ${isMine ? 'mine' : ''}`}>
                                    <div className="message-bubble">
                                        <div className="message-header">
                                            <strong>{isMine ? 'Tú' : msg.sender?.username || 'Usuario'}</strong>
                                            <span className="message-time">{formatDateTime(msg.createdAt)}</span>
                                        </div>
                                        <div className="message-content">{msg.content}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </Card.Body>
            </Card>

            {!isClosed && (
                <Form onSubmit={handleSend} className="chat-input mt-3">
                    <Form.Control
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={sending}
                    />
                    <Button type="submit" variant="primary" disabled={sending || !message.trim()}>
                        {sending ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            <i className="bi bi-send"></i>
                        )}
                    </Button>
                </Form>
            )}
        </Container>
    );
}

export default ChatDetails;
