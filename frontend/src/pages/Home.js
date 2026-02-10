import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Badge, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Home.css';

const heroSlides = [
    {
        src: `${process.env.PUBLIC_URL}/hero/slide-1.jpg`,
        alt: 'Voluntariado entregando ayuda'
    },
    {
        src: `${process.env.PUBLIC_URL}/hero/slide-2.jpg`,
        alt: 'Donación de alimentos en comunidad'
    },
    {
        src: `${process.env.PUBLIC_URL}/hero/slide-3.jpg`,
        alt: 'Equipo de ONG coordinando recursos'
    }
];

const steps = [
    {
        title: 'Publica o solicita recursos',
        desc: 'Describe lo que ofreces o necesitas y define la disponibilidad.'
    },
    {
        title: 'Validamos y conectamos',
        desc: 'Las ONGs verificadas acceden a oportunidades reales y cercanas.'
    },
    {
        title: 'Coordina con confianza',
        desc: 'Chat en tiempo real y seguimiento transparente del proceso.'
    }
];


const features = [
    { icon: 'bi-box-seam', title: 'Publica donaciones', desc: 'Alimentos, ropa, medicinas y más en minutos.', color: '#16a34a' },
    { icon: 'bi-building-check', title: 'ONGs validadas', desc: 'Solo organizaciones verificadas acceden a recursos.', color: '#0f766e' },
    { icon: 'bi-geo-alt-fill', title: 'Mapa interactivo', desc: 'Encuentra iniciativas y donaciones cercanas.', color: '#0284c7' },
    { icon: 'bi-chat-dots-fill', title: 'Chat en tiempo real', desc: 'Coordina entregas sin fricción.', color: '#f59e0b' },
    { icon: 'bi-bullseye', title: 'Asignación inteligente', desc: 'Priorizamos urgencia, vulnerabilidad y proximidad.', color: '#db2777' },
    { icon: 'bi-clipboard-data', title: 'Seguimiento claro', desc: 'Todo queda registrado para una gestión transparente.', color: '#6b7280' }
];

const Home = () => {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="home-hero">
                <div className="home-hero-carousel">
                    <Carousel controls={false} indicators={false} fade interval={5200} pause={false}>
                        {heroSlides.map((slide, idx) => (
                            <Carousel.Item key={idx}>
                                <div
                                    className="home-hero-slide"
                                    role="img"
                                    aria-label={slide.alt}
                                    style={{ backgroundImage: `url(${slide.src})` }}
                                />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                    <div className="home-hero-overlay"></div>
                </div>
                <Container className="home-hero-inner">
                    <Row className="align-items-center g-5">
                        <Col lg={7}>
                            <div className="home-hero-kicker">Solidaridad local, impacto real</div>
                            <h1 className="home-hero-title">
                                <img src="/solidaridad.png" alt="Solidaridad" className="home-hero-logo" />
                                Conectamos donantes con organizaciones sociales
                            </h1>
                            <p className="home-hero-subtitle">
                                Plataforma que une personas y ONGs para redistribuir recursos de forma segura,
                                transparente y cercana.
                            </p>

                            {!isAuthenticated && (
                                <div className="home-hero-actions">
                                    <Button as={Link} to="/register" variant="light" size="lg" className="home-hero-btn-primary shadow-lg">
                                        Comenzar ahora
                                    </Button>
                                    <Button as={Link} to="/login" variant="outline-light" size="lg" className="home-hero-btn-secondary">
                                        Iniciar sesión
                                    </Button>
                                </div>
                            )}

                            <div className="home-hero-highlights">
                                <div><i className="bi bi-shield-check"></i>ONGs verificadas</div>
                                <div><i className="bi bi-lightning-charge"></i>Conexión rápida</div>
                                <div><i className="bi bi-geo-alt"></i>Impacto local</div>
                            </div>
                        </Col>
                        <Col lg={5}>
                            <div className="home-hero-card">
                                <span className="home-pill">Gestión confiable</span>
                                <h3 className="home-hero-card-title">Tu donación, bien acompañada</h3>
                                <p className="home-hero-card-text">
                                    Centralizamos la comunicación, la verificación y el seguimiento para que cada aporte
                                    llegue a quien más lo necesita.
                                </p>
                                <ul className="home-hero-card-list">
                                    <li><i className="bi bi-check-circle-fill"></i>Publicaciones claras y ordenadas</li>
                                    <li><i className="bi bi-check-circle-fill"></i>Alertas y coordinación en tiempo real</li>
                                    <li><i className="bi bi-check-circle-fill"></i>Historial completo de movimientos</li>
                                </ul>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Welcome Section for Authenticated Users */}
            {isAuthenticated && (
                <Container className="home-section">
                    <Card className="shadow-lg border-0 home-welcome-card">
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
                                        Crear nueva donación
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
                                                    Crear nueva donación
                                                </Button>
                                                <Button as={Link} to="/available-donations" variant="success" size="lg">
                                                    <i className="bi bi-search me-2"></i>
                                                    Buscar donaciones
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

            {/* Steps Section */}
            <section className="home-section">
                <Container>
                    <div className="home-section-header">
                        <h2 className="home-section-title">¿Cómo funciona?</h2>
                        <p className="home-section-subtitle">
                            Un flujo simple que respalda cada donación y solicitud con claridad y seguimiento.
                        </p>
                    </div>
                    <Row className="g-4">
                        {steps.map((step, idx) => (
                            <Col md={4} key={idx}>
                                <div className="home-step-card">
                                    <div className="home-step-number">0{idx + 1}</div>
                                    <h5>{step.title}</h5>
                                    <p className="text-muted mb-0">{step.desc}</p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section className="home-section home-features">
                <Container>
                    <div className="home-section-header">
                        <h2 className="home-section-title">Funcionalidades clave</h2>
                        <p className="home-section-subtitle">
                            Herramientas pensadas para coordinar recursos de forma profesional y cercana.
                        </p>
                    </div>
                    <Row className="g-4">
                        {features.map((feature, idx) => (
                            <Col md={6} lg={4} key={idx}>
                                <Card className="h-100 border-0 home-feature-card">
                                    <Card.Body className="p-4">
                                        <div className="home-feature-icon" style={{ color: feature.color }}>
                                            <i className={`bi ${feature.icon}`}></i>
                                        </div>
                                        <h5 className="fw-bold mb-2">{feature.title}</h5>
                                        <p className="text-muted mb-0">{feature.desc}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* CTA Section */}
            {!isAuthenticated && (
                <section className="home-cta">
                    <Container className="text-center">
                        <h2>¿Listo para hacer la diferencia?</h2>
                        <p>Únete a una comunidad comprometida con la solidaridad y la gestión responsable.</p>
                        <Button as={Link} to="/register" variant="light" size="lg" className="shadow-lg px-5 py-3 fw-semibold">
                            <i className="bi bi-person-plus me-2"></i>
                            Regístrate gratis
                        </Button>
                    </Container>
                </section>
            )}
        </div>
    );
};

export default Home;
