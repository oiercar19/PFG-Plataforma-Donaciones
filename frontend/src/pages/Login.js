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
    const [googleLoading, setGoogleLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // Verificar si hay un mensaje de error de autenticacion guardado
    useEffect(() => {
        const authError = localStorage.getItem('authError');
        if (authError) {
            setError(authError);
            localStorage.removeItem('authError');
        }
    }, []);

    useEffect(() => {
        if (!googleClientId) {
            return undefined;
        }

        const renderGoogleButton = () => {
            if (!window.google?.accounts?.id) return;

            const buttonContainer = document.getElementById('google-signin-button');
            if (!buttonContainer) return;

            const parentWidth = buttonContainer.parentElement?.clientWidth ?? 320;
            const buttonWidth = Math.min(320, Math.max(220, Math.floor(parentWidth - 8)));

            buttonContainer.innerHTML = '';
            window.google.accounts.id.renderButton(buttonContainer, {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'signin_with',
                shape: 'pill',
                logo_alignment: 'left',
                width: buttonWidth,
            });
        };

        const initializeGoogleButton = () => {
            if (!window.google?.accounts?.id) return;

            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: async (response) => {
                    if (!response?.credential) {
                        setError('No se recibio el token de Google');
                        return;
                    }

                    setError('');
                    setGoogleLoading(true);

                    const result = await loginWithGoogle(response.credential);

                    if (result.success) {
                        navigate('/');
                    } else {
                        setError(result.error);
                    }

                    setGoogleLoading(false);
                },
            });

            renderGoogleButton();
        };

        if (window.google?.accounts?.id) {
            initializeGoogleButton();
            window.addEventListener('resize', renderGoogleButton);
            return () => window.removeEventListener('resize', renderGoogleButton);
        }

        const existingScript = document.querySelector('script[data-google-signin="true"]');
        if (existingScript) {
            existingScript.addEventListener('load', initializeGoogleButton);
            window.addEventListener('resize', renderGoogleButton);
            return () => {
                existingScript.removeEventListener('load', initializeGoogleButton);
                window.removeEventListener('resize', renderGoogleButton);
            };
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.googleSignin = 'true';
        script.addEventListener('load', initializeGoogleButton);
        window.addEventListener('resize', renderGoogleButton);
        document.head.appendChild(script);

        return () => {
            script.removeEventListener('load', initializeGoogleButton);
            window.removeEventListener('resize', renderGoogleButton);
        };
    }, [googleClientId, loginWithGoogle, navigate]);

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
                                <h2 className="mt-3 fw-bold">Iniciar Sesion</h2>
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
                                    <Form.Label>Contrasena</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Tu contrasena"
                                        size="lg"
                                    />
                                </Form.Group>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-100"
                                    disabled={loading || googleLoading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Iniciando sesion...
                                        </>
                                    ) : (
                                        'Iniciar Sesion'
                                    )}
                                </Button>
                            </Form>

                            {googleClientId && (
                                <>
                                    <div className="d-flex align-items-center my-4">
                                        <hr className="flex-grow-1" />
                                        <span className="px-2 text-muted small">o continua con</span>
                                        <hr className="flex-grow-1" />
                                    </div>
                                    <div className="d-flex justify-content-center">
                                        <div id="google-signin-button"></div>
                                    </div>
                                    <p className="text-muted small text-center mt-3 mb-0">
                                        Disponible solo para cuentas donante.
                                    </p>
                                </>
                            )}

                            <div className="text-center mt-4">
                                <p className="text-muted">
                                    No tienes cuenta? <Link to="/register" className="text-decoration-none fw-semibold">Registrate aqui</Link>
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
