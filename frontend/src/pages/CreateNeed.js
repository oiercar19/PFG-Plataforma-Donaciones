import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { needAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CreateNeed.css';

const CreateNeed = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        quantity: '',
        urgent: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user?.role === 'ONG' && user?.ong?.status !== 'APPROVED') {
            navigate('/');
        }
    }, [user, navigate]);

    const categories = [
        { value: 'ALIMENTOS', label: 'Alimentos' },
        { value: 'ROPA', label: 'Ropa' },
        { value: 'MEDICINAS', label: 'Medicinas' },
        { value: 'JUGUETES', label: 'Juguetes' },
        { value: 'MUEBLES', label: 'Muebles' },
        { value: 'ELECTRONICA', label: 'Electronica' },
        { value: 'OTRO', label: 'Otro' },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.title || !formData.description || !formData.category) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            await needAPI.createNeed({
                ...formData,
                quantity: formData.quantity || null,
            });
            setSuccess('Need created successfully');
            setFormData({
                title: '',
                description: '',
                category: '',
                quantity: '',
                urgent: false,
            });
            setTimeout(() => navigate('/my-needs'), 1200);
        } catch (err) {
            console.error('Error creating need:', err);
            setError(err.response?.data?.error || 'Error creating need');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <div className="page-header mb-4">
                <h1>
                    <i className="bi bi-flag me-2"></i>
                    Publicar necesidad
                </h1>
                <p className="text-muted">Describe lo que tu ONG necesita</p>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Card className="shadow-sm create-need-card">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Titulo *</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ej: Alimentos no perecederos"
                                maxLength={120}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripcion *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Explica la necesidad y cualquier detalle importante"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Categoria *</Form.Label>
                            <Form.Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecciona una categoria</option>
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Cantidad (opcional)</Form.Label>
                            <Form.Control
                                type="text"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="Ej: 10 cajas, 50 unidades"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Check
                                type="checkbox"
                                id="urgent"
                                name="urgent"
                                checked={formData.urgent}
                                onChange={handleChange}
                                label="Marcar como urgente"
                            />
                        </Form.Group>

                        <div className="d-flex gap-2">
                            <Button type="button" variant="outline-secondary" onClick={() => navigate('/my-needs')}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Publicando...' : 'Publicar necesidad'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CreateNeed;
