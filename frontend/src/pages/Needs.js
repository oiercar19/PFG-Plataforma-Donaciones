import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { needAPI } from '../services/api';
import './Needs.css';

const Needs = () => {
    const navigate = useNavigate();
    const [needs, setNeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const emptyFilters = {
        search: '',
        category: '',
        urgent: '',
    };
    const [filters, setFilters] = useState(emptyFilters);
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

    const loadNeeds = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await needAPI.getNeeds(appliedFilters);
            setNeeds(response.data.needs || []);
        } catch (err) {
            console.error('Error loading needs:', err);
            const message = err.response?.data?.error || 'Error loading needs';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [appliedFilters]);

    useEffect(() => {
        loadNeeds();
    }, [loadNeeds]);

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setAppliedFilters(filters);
    };

    const handleClearFilters = () => {
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
    };

    const getCategoryBadge = (category) => {
        const badges = {
            ALIMENTOS: 'success',
            Alimentos: 'success',
            ROPA: 'info',
            Ropa: 'info',
            MEDICINAS: 'danger',
            Medicinas: 'danger',
            JUGUETES: 'warning',
            Juguetes: 'warning',
            MUEBLES: 'secondary',
            Muebles: 'secondary',
            ELECTRONICA: 'primary',
            Electronica: 'primary',
            'Electrónica': 'primary',
            LIBROS: 'dark',
            Libros: 'dark',
            MATERIAL_ESCOLAR: 'secondary',
            'Material Escolar': 'secondary',
            PRODUCTOS_DE_HIGIENE: 'info',
            'Productos de Higiene': 'info',
            OTRO: 'dark',
            OTROS: 'dark',
            Otro: 'dark',
            Otros: 'dark',
        };
        return badges[category] || 'secondary';
    };

    const categories = [
        { value: '', label: 'Todas las categorias' },
        { value: 'Alimentos', label: 'Alimentos' },
        { value: 'Ropa', label: 'Ropa' },
        { value: 'Medicinas', label: 'Medicinas' },
        { value: 'Muebles', label: 'Muebles' },
        { value: 'Electrónica', label: 'Electrónica' },
        { value: 'Juguetes', label: 'Juguetes' },
        { value: 'Libros', label: 'Libros' },
        { value: 'Material Escolar', label: 'Material Escolar' },
        { value: 'Productos de Higiene', label: 'Productos de Higiene' },
        { value: 'Otros', label: 'Otros' },
    ];

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando necesidades...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="page-header mb-4">
                <h1>
                    <i className="bi bi-megaphone me-2"></i>
                    Necesidades publicadas
                </h1>
                <p className="text-muted">Explora las necesidades publicadas por las ONG</p>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleSearch}>
                        <Row>
                            <Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-search me-1"></i>
                                        Buscar
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="search"
                                        placeholder="Buscar por titulo o descripcion..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-tag me-1"></i>
                                        Categoria
                                    </Form.Label>
                                    <Form.Select
                                        name="category"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        Urgencia
                                    </Form.Label>
                                    <Form.Select name="urgent" value={filters.urgent} onChange={handleFilterChange}>
                                        <option value="">Todas</option>
                                        <option value="true">Urgentes</option>
                                        <option value="false">No urgentes</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex gap-2">
                            <Button type="submit" variant="primary">
                                <i className="bi bi-search me-1"></i>
                                Buscar
                            </Button>
                            <Button type="button" variant="outline-secondary" onClick={handleClearFilters}>
                                <i className="bi bi-x-circle me-1"></i>
                                Limpiar filtros
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {needs.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <i className="bi bi-inbox display-1 text-muted"></i>
                        <h3 className="mt-3">No hay necesidades disponibles</h3>
                        <p className="text-muted">
                            {appliedFilters.search || appliedFilters.category || appliedFilters.urgent
                                ? 'Prueba con otros filtros'
                                : 'No se encontraron necesidades en este momento'}
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {needs.map((need) => (
                        <Col key={need.id} lg={4} md={6} className="mb-4">
                            <Card className="h-100 need-card shadow-sm">
                                <Card.Body className="d-flex flex-column">
                                    <div className="mb-2 d-flex justify-content-between align-items-start gap-2">
                                        <div>
                                            <h5 className="card-title mb-2">{need.title}</h5>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Badge bg={getCategoryBadge(need.category)}>{need.category}</Badge>
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

                                    <Card.Text className="text-muted small flex-grow-1">
                                        {need.description.length > 120
                                            ? `${need.description.substring(0, 120)}...`
                                            : need.description}
                                    </Card.Text>

                                    <div className="need-info mb-3">
                                        <div className="info-item">
                                            <i className="bi bi-building text-primary"></i>
                                            <span>{need.ong?.name || 'ONG'}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-chat-dots text-success"></i>
                                            <span>{need._count?.conversations || 0} chats</span>
                                        </div>
                                    </div>

                                    <Button variant="primary" className="w-100" onClick={() => navigate(`/needs/${need.id}`)}>
                                        <i className="bi bi-eye me-2"></i>
                                        Ver detalles
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default Needs;
