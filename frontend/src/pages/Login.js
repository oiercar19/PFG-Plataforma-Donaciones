import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const Login = () => {
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Verificar si hay un mensaje de error de autenticación guardado
    useEffect(() => {
        const authError = localStorage.getItem('authError');
        if (authError) {
            setError(authError);
            localStorage.removeItem('authError');
        }
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.identifier, formData.password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6} lg={5}>
                    <Card className="shadow-lg">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <i className="bi bi-box-arrow-in-right text-primary" style={{ fontSize: '3rem' }}></i>
                                <h2 className="mt-3 fw-bold">Iniciar Sesión</h2>
                                <p className="text-muted">Bienvenido de nuevo</p>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Usuario o Email</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="identifier"
                                        value={formData.identifier}
                                        onChange={handleChange}
                                        required
                                        placeholder="Escribe tu usuario o email"
                                        size="lg"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Tu contraseña"
                                        size="lg"
                                    />
                                </Form.Group>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-100"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Iniciando sesión...
                                        </>
                                    ) : (
                                        'Iniciar Sesión'
                                    )}
                                </Button>
                            </Form>

                            <div className="text-center mt-4">
                                <p className="text-muted">
                                    ¿No tienes cuenta? <Link to="/register" className="text-decoration-none fw-semibold">Regístrate aquí</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
