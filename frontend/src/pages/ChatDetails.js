import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Card, Button, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ChatDetails.css';

const SHIPPING_TARIFFS = [
    { label: '0-1 kg', prices: ['4.90 EUR', '7.90 EUR', '10.90 EUR', '13.90 EUR'], extra: '+2.50 EUR/bulto' },
    { label: '1-3 kg', prices: ['5.90 EUR', '8.90 EUR', '11.90 EUR', '14.90 EUR'], extra: '+3.00 EUR/bulto' },
    { label: '3-5 kg', prices: ['6.90 EUR', '9.90 EUR', '12.90 EUR', '15.90 EUR'], extra: '+3.50 EUR/bulto' },
    { label: '5-10 kg', prices: ['8.90 EUR', '12.90 EUR', '16.90 EUR', '20.90 EUR'], extra: '+4.50 EUR/bulto' },
    { label: '10-15 kg', prices: ['10.90 EUR', '15.90 EUR', '20.90 EUR', '25.90 EUR'], extra: '+5.50 EUR/bulto' },
    { label: '15-20 kg', prices: ['12.90 EUR', '18.90 EUR', '24.90 EUR', '30.90 EUR'], extra: '+6.50 EUR/bulto' },
    { label: '20-30 kg', prices: ['15.90 EUR', '23.90 EUR', '31.90 EUR', '39.90 EUR'], extra: '+8.00 EUR/bulto' },
    { label: '30-40 kg', prices: ['20.90 EUR', '30.90 EUR', '40.90 EUR', '50.90 EUR'], extra: '+10.00 EUR/bulto' },
];

function ChatDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingEstimate, setShippingEstimate] = useState(null);
    const [shippingError, setShippingError] = useState('');
    const [shippingPanelVisible, setShippingPanelVisible] = useState(false);
    const [shippingWeightKg, setShippingWeightKg] = useState('1');
    const [shippingPackages, setShippingPackages] = useState('1');
    const [shippingExpress24h, setShippingExpress24h] = useState(false);
    const messagesEndRef = useRef(null);

    const loadConversation = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await conversationAPI.getConversationById(id);
            setConversation(response.data.conversation);
            window.dispatchEvent(new Event('chat-read'));
        } catch (err) {
            console.error('Error loading conversation:', err);
            setError(err.response?.data?.error || 'Error loading chat');
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
            console.error('Error sending message:', err);
            setError(err.response?.data?.error || 'Error sending message');
        } finally {
            setSending(false);
        }
    };

    const handleCalculateShippingCost = async () => {
        try {
            const parsedWeight = parseFloat(shippingWeightKg);
            const parsedPackages = parseInt(shippingPackages, 10);

            if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
                setShippingError('Introduce un peso valido mayor que 0 kg');
                setShippingEstimate(null);
                return;
            }

            if (!Number.isInteger(parsedPackages) || parsedPackages < 1) {
                setShippingError('Introduce un numero de bultos valido (minimo 1)');
                setShippingEstimate(null);
                return;
            }

            setShippingLoading(true);
            setShippingError('');
            const response = await conversationAPI.calculateShippingCost(id, {
                weightKg: parsedWeight,
                packages: parsedPackages,
                express24h: shippingExpress24h,
            });
            setShippingEstimate(response.data.shippingCost || null);
        } catch (err) {
            console.error('Error calculating shipping cost:', err);
            setShippingEstimate(null);
            setShippingError(err.response?.data?.error || 'No se pudo calcular el coste de envio');
        } finally {
            setShippingLoading(false);
        }
    };

    const handleToggleShippingPanel = async () => {
        if (shippingPanelVisible) {
            setShippingPanelVisible(false);
            return;
        }

        await handleCalculateShippingCost();
        setShippingPanelVisible(true);
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

    const formatMoney = (value) => {
        if (value === null || value === undefined) return '';
        return `${Number(value).toFixed(2)} EUR`;
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
    const isNeed = Boolean(conversation.need);
    const isDonation = !isNeed;
    const context = isNeed ? conversation.need : conversation.donation;
    const typeBadge = isNeed ? { bg: 'info', text: 'Necesidad' } : { bg: 'primary', text: 'Donacion' };
    const ongInfo = conversation.ong || conversation.need?.ong || conversation.donation?.assignedOng || null;
    const donorInfo = conversation.donation?.donor || null;
    const showDonorInfo = isDonation && user?.role === 'ONG';
    const contactCardData = showDonorInfo ? donorInfo : ongInfo;
    const isClosed = conversation.status === 'CLOSED';
    const ongAddress = ongInfo
        ? [ongInfo.address, ongInfo.postalCode, ongInfo.city || ongInfo.location].filter(Boolean).join(', ')
        : '';

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <Button variant="outline-secondary" onClick={() => navigate('/chats')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a chats
                </Button>
                <div className="d-flex gap-2">
                    <Badge bg={typeBadge.bg}>{typeBadge.text}</Badge>
                    <Badge bg={statusBadge.bg}>{statusBadge.text}</Badge>
                </div>
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
                            <h5 className="mb-1">{context?.title || (isNeed ? 'Necesidad' : 'Donacion')}</h5>
                            <div className="text-muted small">
                                <i className="bi bi-tag me-1"></i>
                                {context?.category || 'Sin categoria'}
                            </div>
                            {isNeed && context?.urgent && (
                                <Badge bg="danger" className="mt-2">Urgente</Badge>
                            )}
                        </div>
                        {context?.id && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(isNeed ? `/needs/${context.id}` : `/donations/${context.id}`)}
                            >
                                <i className="bi bi-box-seam me-1"></i>
                                Ver {isNeed ? 'necesidad' : 'donacion'}
                            </Button>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {contactCardData && (
                <Card className="chat-details-card shadow-sm mb-3">
                    <Card.Body>
                        <div className="d-flex justify-content-between flex-wrap gap-2">
                            <div>
                                <h6 className="mb-1">
                                    <i className={`bi ${showDonorInfo ? 'bi-person' : 'bi-building'} me-2`}></i>
                                    {showDonorInfo ? (donorInfo?.username || 'Donante') : (ongInfo?.name || 'ONG')}
                                </h6>
                                {showDonorInfo ? (
                                    <>
                                        {donorInfo?.email && (
                                            <div className="text-muted small">
                                                <i className="bi bi-envelope me-1"></i>
                                                {donorInfo.email}
                                            </div>
                                        )}
                                        {donorInfo?.location && (
                                            <div className="text-muted small">
                                                <i className="bi bi-geo-alt me-1"></i>
                                                {donorInfo.location}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {ongInfo?.contactEmail && (
                                            <div className="text-muted small">
                                                <i className="bi bi-envelope me-1"></i>
                                                {ongInfo.contactEmail}
                                            </div>
                                        )}
                                        {ongAddress && (
                                            <div className="text-muted small">
                                                <i className="bi bi-geo-alt me-1"></i>
                                                {ongAddress}
                                            </div>
                                        )}
                                        {ongInfo?.contactPhone && (
                                            <div className="text-muted small">
                                                <i className="bi bi-telephone me-1"></i>
                                                {ongInfo.contactPhone}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {isDonation && (
                            <div className="shipping-estimate mt-3">
                                <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={handleToggleShippingPanel}
                                    disabled={shippingLoading}
                                >
                                    {shippingLoading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Calculando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-truck me-2"></i>
                                            {shippingPanelVisible ? 'Ocultar coste de envio' : 'Calcular coste de envio'}
                                        </>
                                    )}
                                </Button>

                                {shippingPanelVisible && (
                                    <>
                                        <div className="shipping-controls mb-2 mt-2">
                                            <Form.Group className="shipping-field">
                                                <Form.Label>Peso total (kg)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={shippingWeightKg}
                                                    onChange={(e) => setShippingWeightKg(e.target.value)}
                                                />
                                            </Form.Group>

                                            <Form.Group className="shipping-field">
                                                <Form.Label>Numero de bultos</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={shippingPackages}
                                                    onChange={(e) => setShippingPackages(e.target.value)}
                                                />
                                            </Form.Group>
                                        </div>

                                <div className="shipping-options mb-2">
                                    <Form.Check
                                        id="shipping-express"
                                        type="checkbox"
                                                label="Urgente 24h (+25%)"
                                                checked={shippingExpress24h}
                                                onChange={(e) => setShippingExpress24h(e.target.checked)}
                                            />
                                        </div>

                                        {shippingError && (
                                            <Alert variant="warning" className="mt-2 mb-0 py-2">
                                                {shippingError}
                                            </Alert>
                                        )}

                                        {shippingEstimate && (
                                            <Alert variant="success" className="mt-2 mb-0 py-2">
                                                <div className="shipping-summary">
                                                    <div><strong>Coste estimado:</strong> {formatMoney(shippingEstimate.amount)}</div>
                                                    <div><strong>Base por peso y bultos:</strong> {formatMoney(shippingEstimate.baseAmount)}</div>
                                                    {shippingEstimate.expressSurcharge > 0 && (
                                                        <div><strong>Recargo urgente 24h:</strong> {formatMoney(shippingEstimate.expressSurcharge)}</div>
                                                    )}
                                                    <div><strong>Peso:</strong> {shippingEstimate.weightKg} kg</div>
                                                    <div><strong>Bultos:</strong> {shippingEstimate.packages}</div>
                                                    {shippingEstimate.distanceKm !== null && (
                                                        <div><strong>Distancia estimada:</strong> {shippingEstimate.distanceKm} km</div>
                                                    )}
                                                    {shippingEstimate.origin && (
                                                        <div><strong>Origen:</strong> {shippingEstimate.origin}</div>
                                                    )}
                                                    {shippingEstimate.destination && (
                                                        <div><strong>Destino:</strong> {shippingEstimate.destination}</div>
                                                    )}
                                                </div>
                                            </Alert>
                                        )}

                                        <div className="shipping-tariff-table mt-3">
                                            <div className="small fw-semibold mb-1">Tarifario de referencia (EUR)</div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered align-middle mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>Peso total</th>
                                                            <th>1 bulto</th>
                                                            <th>2 bultos</th>
                                                            <th>3 bultos</th>
                                                            <th>4 bultos</th>
                                                            <th>5+ bultos</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {SHIPPING_TARIFFS.map((row) => (
                                                            <tr key={row.label}>
                                                                <td>{row.label}</td>
                                                                <td>{row.prices[0]}</td>
                                                                <td>{row.prices[1]}</td>
                                                                <td>{row.prices[2]}</td>
                                                                <td>{row.prices[3]}</td>
                                                                <td>{row.extra}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {isClosed && (
                <Alert variant="secondary">
                    <i className="bi bi-lock me-2"></i>
                    Este chat esta cerrado y ya no admite nuevos mensajes.
                </Alert>
            )}

            <Card className="chat-messages-card shadow-sm">
                <Card.Body className="chat-messages">
                    {conversation.messages?.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <i className="bi bi-chat-dots fs-2"></i>
                            <p className="mt-2">Aun no hay mensajes</p>
                        </div>
                    ) : (
                        conversation.messages.map((msg) => {
                            const isMine = msg.sender?.id === user?.id;
                            return (
                                <div key={msg.id} className={`chat-message ${isMine ? 'mine' : ''}`}>
                                    <div className="message-bubble">
                                        <div className="message-header">
                                            <strong>{isMine ? 'Tu' : msg.sender?.username || 'Usuario'}</strong>
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


