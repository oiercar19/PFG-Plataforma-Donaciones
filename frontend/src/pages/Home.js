import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
    const { user, isAuthenticated } = useAuth();

    return (
        <div>
            {/* Hero Section */}
            <div className="text-white py-5" style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #60a5fa 100%)',
                minHeight: '450px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <Container>
                    <Row className="align-items-center">
                        <Col lg={8} className="mx-auto text-center">
                            <h1 className="display-3 fw-bold mb-4">
                                <i className="bi bi-heart-fill me-3" style={{ color: '#ff6b9d' }}></i>
                                Conectando Solidaridad
                            </h1>
                            <p className="lead mb-4" style={{ fontSize: '1.3rem', opacity: 1 }}>
                                Plataforma que conecta donantes con organizaciones sociales para redistribuir recursos donde más se necesitan
                            </p>

                            {!isAuthenticated && (
                                <div className="d-flex gap-3 justify-content-center flex-wrap">
                                    <Button as={Link} to="/register" variant="light" size="lg" className="px-5 py-3 shadow-lg fw-semibold">
                                        Comenzar Ahora
                                    </Button>
                                    <Button as={Link} to="/login" variant="outline-light" size="lg" className="px-5 py-3 fw-semibold" style={{ borderWidth: '2px' }}>
                                        Iniciar Sesión
                                    </Button>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Welcome Section for Authenticated Users */}
            {isAuthenticated && (
                <Container className="py-5">
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <h2 className="mb-4">
                                Bienvenido, {user.username}! <i className="bi bi-emoji-smile text-warning"></i>
                            </h2>

                            {user.role === 'DONANTE' && (
                                <div>
                                    <p className="lead">Como donante, puedes:</p>
                                    <ul className="list-unstyled mb-4">
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Publicar anuncios de donación</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Ver el mapa de ONGs cercanas</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Comunicarte con organizaciones</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Hacer seguimiento de tus donaciones</li>
                                    </ul>
                                    <Button as={Link} to="/create-donation" variant="primary" size="lg">
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Crear Nueva Donación
                                    </Button>
                                </div>
                            )}

                            {user.role === 'ONG' && (
                                <div>
                                    {user.ong?.status === 'PENDING' && (
                                        <div className="alert alert-warning d-flex align-items-center">
                                            <i className="bi bi-clock-history me-2 fs-4"></i>
                                            <div>
                                                <strong>Tu cuenta está siendo revisada.</strong>
                                                <br />
                                                Tu ONG está pendiente de validación por un administrador de la aplicación, por lo que tendrás un uso reducido de la plataforma hasta que sea aprobada.
                                            </div>
                                        </div>
                                    )}

                                    {user.ong?.status === 'REJECTED' && (
                                        <div className="alert alert-danger d-flex align-items-start">
                                            <i className="bi bi-exclamation-triangle me-2 fs-4"></i>
                                            <div>
                                                <strong>Tu solicitud de ONG fue rechazada.</strong>
                                                <br />
                                                {user.ong?.rejectionReason && (
                                                    <>
                                                        <strong>Motivo:</strong> {user.ong.rejectionReason}
                                                        <br />
                                                    </>
                                                )}
                                                Por favor, corrige los problemas y contacta con soporte para más información.
                                            </div>
                                        </div>
                                    )}

                                    {user.ong?.status === 'APPROVED' && (
                                        <>
                                            <p className="lead">Como ONG aprobada, puedes:</p>
                                            <ul className="list-unstyled mb-4">
                                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Publicar anuncios de donación</li>
                                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Ver donaciones disponibles</li>
                                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Solicitar recursos</li>
                                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Comunicarte con donantes y otras ONGs</li>
                                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Gestionar tu perfil</li>
                                            </ul>
                                            <div className="d-flex gap-3 flex-wrap">
                                                <Button as={Link} to="/create-donation" variant="primary" size="lg">
                                                    <i className="bi bi-plus-circle me-2"></i>
                                                    Crear Nueva Donación
                                                </Button>
                                                <Button as={Link} to="/available-donations" variant="success" size="lg">
                                                    <i className="bi bi-search me-2"></i>
                                                    Buscar Donaciones
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {user.role === 'ADMIN' && (
                                <div>
                                    <Badge bg="warning" text="dark" className="mb-3 p-2">
                                        <i className="bi bi-shield-fill me-1"></i>
                                        Administrador
                                    </Badge>
                                    <p className="lead">Como administrador, puedes:</p>
                                    <ul className="list-unstyled mb-4">
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Validar nuevas ONGs</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Ver estadísticas del sistema</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Gestionar usuarios y donaciones</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Supervisar la plataforma</li>
                                    </ul>
                                    <Button as={Link} to="/admin" variant="warning" size="lg">
                                        <i className="bi bi-gear-fill me-2"></i>
                                        Ir al Panel de Administración
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Container>
            )}

            {/* Features Section */}
            <div className="bg-light py-5">
                <Container>
                    <h2 className="text-center mb-5 fw-bold">¿Cómo Funciona?</h2>
                    <Row className="g-4">
                        {[
                            { icon: 'bi-box-seam', title: 'Publica Donaciones', desc: 'Los donantes publican recursos disponibles: alimentos, ropa, medicinas, etc.', color: '#667eea' },
                            { icon: 'bi-building-check', title: 'ONGs Validadas', desc: 'Solo organizaciones verificadas pueden acceder a las donaciones.', color: '#11998e' },
                            { icon: 'bi-geo-alt-fill', title: 'Visualización Geográfica', desc: 'Mapa interactivo para encontrar recursos y organizaciones cercanas.', color: '#0ea5e9' },
                            { icon: 'bi-chat-dots-fill', title: 'Chat en Tiempo Real', desc: 'Comunicación directa entre donantes y organizaciones.', color: '#f59e0b' },
                            { icon: 'bi-bullseye', title: 'Asignación Inteligente', desc: 'Sistema que prioriza urgencia y proximidad.', color: '#ee0979' },
                            { icon: 'bi-shield-check', title: 'Seguro y Transparente', desc: 'Todas las acciones son trazables y verificables.', color: '#6b7280' }
                        ].map((feature, idx) => (
                            <Col md={6} lg={4} key={idx}>
                                <Card className="h-100 border-0 shadow-sm hover-card">
                                    <Card.Body className="text-center p-4">
                                        <div className="mb-3" style={{ color: feature.color }}>
                                            <i className={`bi ${feature.icon}`} style={{ fontSize: '3rem' }}></i>
                                        </div>
                                        <h5 className="fw-bold mb-3">{feature.title}</h5>
                                        <p className="text-muted mb-0">{feature.desc}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </div>

            {/* CTA Section */}
            {!isAuthenticated && (
                <div className="py-5 text-center text-white" style={{
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    minHeight: '300px',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Container>
                        <h2 className="fw-bold mb-3" style={{ fontSize: '2.5rem' }}>¿Listo para Hacer la Diferencia?</h2>
                        <p className="lead mb-4" style={{ fontSize: '1.2rem', opacity: 0.95 }}>Únete a nuestra comunidad de donantes y organizaciones</p>
                        <Button as={Link} to="/register" variant="light" size="lg" className="shadow-lg px-5 py-3 fw-semibold">
                            <i className="bi bi-person-plus me-2"></i>
                            Regístrate Gratis
                        </Button>
                    </Container>
                </div>
            )}
        </div>
    );
};

export default Home;
