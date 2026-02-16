import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AvailableDonations.css';

const AvailableDonations = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const emptyFilters = {
        search: '',
        category: '',
        location: '',
    };
    const [filters, setFilters] = useState(emptyFilters);
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

    // Verificar si el usuario ONG está aprobado
    useEffect(() => {
        if (user?.role === 'ONG' && user?.ong?.status !== 'APPROVED') {
            navigate('/');
        }
    }, [user, navigate]);

    const loadDonations = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await donationAPI.getAvailableDonations(appliedFilters);
            setDonations(response.data.donations);
        } catch (err) {
            console.error('Error al cargar donaciones:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Error al cargar las donaciones disponibles';
            setError(errorMsg + '. Por favor, intenta cerrar sesión y volver a iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }, [appliedFilters]);

    useEffect(() => {
        loadDonations();
    }, [loadDonations]);

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
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
        { value: '', label: 'Selecciona una categoría' },
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
                <p className="mt-3">Cargando donaciones...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="page-header mb-4">
                <h1>
                    <i className="bi bi-search me-2"></i>
                    Donaciones Disponibles
                </h1>
                <p className="text-muted">Busca y solicita donaciones de otros usuarios</p>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Filtros */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleSearch}>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-search me-1"></i>
                                        Buscar
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="search"
                                        placeholder="Buscar por título o descripción..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-tag me-1"></i>
                                        Categoría
                                    </Form.Label>
                                    <Form.Select
                                        name="category"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-geo-alt me-1"></i>
                                        Ubicación
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="location"
                                        placeholder="Ciudad o provincia..."
                                        value={filters.location}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex gap-2">
                            <Button type="submit" variant="primary">
                                <i className="bi bi-search me-1"></i>
                                Buscar
                            </Button>
                            <Button
                                type="button"
                                variant="outline-secondary"
                                onClick={handleClearFilters}
                            >
                                <i className="bi bi-x-circle me-1"></i>
                                Limpiar filtros
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Resultados */}
            {donations.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <i className="bi bi-inbox display-1 text-muted"></i>
                        <h3 className="mt-3">No hay donaciones disponibles</h3>
                        <p className="text-muted">
                            {appliedFilters.search || appliedFilters.category || appliedFilters.location
                                ? 'Intenta cambiar los filtros de búsqueda'
                                : 'No se encontraron donaciones en este momento'}
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    <div className="mb-3">
                        <Badge bg="info">
                            {donations.length} donación{donations.length !== 1 ? 'es' : ''} encontrada{donations.length !== 1 ? 's' : ''}
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
                                    </div>

                                    <Card.Body className="d-flex flex-column">
                                        {/* Título y categoría */}
                                        <div className="mb-2">
                                            <h5 className="card-title mb-2">{donation.title}</h5>
                                            <Badge bg={getCategoryBadge(donation.category)}>
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
                                                <i className="bi bi-person text-success"></i>
                                                <span>
                                                    {donation.donor.role === 'ONG' ? '🏢 ' : '👤 '}
                                                    {donation.donor.username}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Botón */}
                                        <Button
                                            variant="primary"
                                            className="w-100"
                                            onClick={() => navigate(`/available-donations/${donation.id}`)}
                                        >
                                            <i className="bi bi-eye me-2"></i>
                                            Ver detalles
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </Container>
    );
};

export default AvailableDonations;
