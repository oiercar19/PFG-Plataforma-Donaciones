import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Badge, Carousel, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { donationAPI, needAPI } from '../services/api';
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
    },
    {
        src: `${process.env.PUBLIC_URL}/hero/slide-4.jpg`,
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
    const [recentNeeds, setRecentNeeds] = useState([]);
    const [recentDonations, setRecentDonations] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadRecentActivity = async () => {
            if (!isAuthenticated || !user) {
                setRecentNeeds([]);
                setRecentDonations([]);
                return;
            }

            const shouldLoadNeeds = user.role === 'DONANTE';
            const shouldLoadDonations = user.role === 'ONG' && user.ong?.status === 'APPROVED';

            if (!shouldLoadNeeds && !shouldLoadDonations) {
                setRecentNeeds([]);
                setRecentDonations([]);
                return;
            }

            try {
                setActivityLoading(true);
                setActivityError('');

                if (shouldLoadNeeds) {
                    const response = await needAPI.getNeeds({ status: 'OPEN' });
                    if (isMounted) {
                        setRecentNeeds((response.data.needs || []).slice(0, 3));
                    }
                }

                if (shouldLoadDonations) {
                    const response = await donationAPI.getAvailableDonations({});
                    if (isMounted) {
                        setRecentDonations((response.data.donations || []).slice(0, 3));
                    }
                }
            } catch (err) {
                console.error('Error cargando actividad reciente:', err);
                if (isMounted) {
                    setActivityError('No se pudo cargar la actividad reciente');
                }
            } finally {
                if (isMounted) {
                    setActivityLoading(false);
                }
            }
        };

        loadRecentActivity();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, user]);

    const formatRecentDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
        });
    };

    const renderQuickActions = () => {
        if (!user) return null;

        const donorActions = [
            { to: '/create-donation', icon: 'bi-plus-circle', title: 'Crear donacion', desc: 'Publica un recurso disponible', primary: true },
            { to: '/needs', icon: 'bi-clipboard-heart', title: 'Ver necesidades', desc: 'Explora solicitudes de ONGs' },
            { to: '/map', icon: 'bi-geo-alt', title: 'Mapa de ONGs', desc: 'Encuentra entidades cercanas' },
            { to: '/donations', icon: 'bi-list-check', title: 'Mis donaciones', desc: 'Consulta tu seguimiento' },
        ];

        const ongActions = [
            { to: '/available-donations', icon: 'bi-search', title: 'Buscar donaciones', desc: 'Recursos disponibles', primary: true },
            { to: '/create-need', icon: 'bi-flag', title: 'Publicar necesidad', desc: 'Solicita lo que falta' },
            { to: '/my-needs', icon: 'bi-clipboard-heart', title: 'Mis necesidades', desc: 'Gestiona solicitudes' },
            { to: '/my-ong', icon: 'bi-building', title: 'Mi entidad', desc: 'Perfil y datos públicos' },
        ];

        const adminActions = [
            { to: '/admin', icon: 'bi-shield-check', title: 'Panel admin', desc: 'Validaciones y estadisticas', primary: true },
        ];

        const actions = user.role === 'DONANTE'
            ? donorActions
            : user.role === 'ONG' && user.ong?.status === 'APPROVED'
                ? ongActions
                : user.role === 'ADMIN'
                    ? adminActions
                    : [];

        if (actions.length === 0) return null;

        return (
            <div className="home-quick-actions">
                {actions.map((action) => (
                    <Link
                        key={action.to}
                        to={action.to}
                        className={`home-quick-action ${action.primary ? 'primary' : ''}`}
                    >
                        <span className="home-quick-action-icon" aria-hidden="true">
                            <i className={`bi ${action.icon}`}></i>
                        </span>
                        <span>
                            <strong>{action.title}</strong>
                            <small>{action.desc}</small>
                        </span>
                    </Link>
                ))}
            </div>
        );
    };

    const renderActivityItem = (item, type) => {
        const isNeed = type === 'need';
        const donationImage = !isNeed && item.images?.length > 0 ? item.images[0] : null;
        const detailPath = isNeed ? `/needs/${item.id}` : `/available-donations/${item.id}`;
        const organization = isNeed ? item.ong?.name : item.donor?.username;
        const metaLocation = isNeed
            ? [item.ong?.city || item.ong?.location, item.ong?.postalCode].filter(Boolean).join(', ')
            : [item.city, item.province].filter(Boolean).join(', ');

        return (
            <Link to={detailPath} className="home-activity-item" key={item.id}>
                {donationImage ? (
                    <img
                        src={donationImage}
                        alt=""
                        className="home-activity-image"
                        aria-hidden="true"
                    />
                ) : (
                    <div className="home-activity-icon" aria-hidden="true">
                        <i className={`bi ${isNeed ? 'bi-megaphone' : 'bi-box-seam'}`}></i>
                    </div>
                )}
                <div className="home-activity-content">
                    <div className="home-activity-title">{item.title}</div>
                    <div className="home-activity-meta">
                        {organization && <span>{organization}</span>}
                        {item.category && <span>{item.category}</span>}
                        {metaLocation && <span>{metaLocation}</span>}
                    </div>
                </div>
                <div className="home-activity-side">
                    {isNeed && item.urgent && <Badge bg="danger">Urgente</Badge>}
                    {!isNeed && item.quantity && <span className="home-activity-quantity">{item.quantity}</span>}
                    <span className="home-activity-date">{formatRecentDate(item.createdAt)}</span>
                </div>
            </Link>
        );
    };

    const renderRecentActivity = () => {
        if (!isAuthenticated || !user) return null;

        const isDonor = user.role === 'DONANTE';
        const isApprovedOng = user.role === 'ONG' && user.ong?.status === 'APPROVED';

        if (!isDonor && !isApprovedOng) return null;

        const items = isDonor ? recentNeeds : recentDonations;
        const title = isDonor ? 'Necesidades recientes' : 'Donaciones disponibles';
        const subtitle = isDonor
            ? 'Actividad publicada por entidades sociales'
            : 'Oportunidades recientes para solicitar';
        const emptyText = isDonor
            ? 'No hay necesidades abiertas por ahora.'
            : 'No hay donaciones disponibles por ahora.';
        const ctaPath = isDonor ? '/needs' : '/available-donations';
        const ctaText = isDonor ? 'Ver todas las necesidades' : 'Ver todas las donaciones';

        return (
            <div className="home-activity-panel">
                <div className="home-activity-header">
                    <div>
                        <h3>{title}</h3>
                        <p>{subtitle}</p>
                    </div>
                    <i className={`bi ${isDonor ? 'bi-clipboard-heart' : 'bi-gift'} home-activity-header-icon`}></i>
                </div>

                {activityLoading ? (
                    <div className="home-activity-loading">
                        <Spinner animation="border" size="sm" />
                        <span>Cargando actividad...</span>
                    </div>
                ) : activityError ? (
                    <Alert variant="warning" className="mb-0 py-2">{activityError}</Alert>
                ) : items.length === 0 ? (
                    <div className="home-activity-empty">{emptyText}</div>
                ) : (
                    <div className="home-activity-list">
                        {items.map((item) => renderActivityItem(item, isDonor ? 'need' : 'donation'))}
                    </div>
                )}

                <Button as={Link} to={ctaPath} variant="outline-primary" className="home-activity-cta">
                    {ctaText}
                    <i className="bi bi-arrow-right"></i>
                </Button>
            </div>
        );
    };

    const welcomeActivity = renderRecentActivity();

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
                        <Card.Body className="p-4 p-lg-5">
                            <h2 className="mb-4">
                                Bienvenido, {user.username}! <i className="bi bi-emoji-smile text-warning"></i>
                            </h2>

                            <Row className="g-4 align-items-stretch">
                                <Col lg={welcomeActivity ? 6 : 12}>
                                    <div className="home-welcome-main">

                            {user.role === 'DONANTE' && (
                                <div>
                                    <span className="home-welcome-kicker">Panel de donante</span>
                                    <p className="lead mb-3">
                                        Publica recursos, revisa necesidades activas y coordina entregas desde un solo lugar.
                                    </p>
                                    {renderQuickActions()}
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
                                            <span className="home-welcome-kicker">Panel de entidad social</span>
                                            <p className="lead mb-3">
                                                Encuentra donaciones disponibles, publica necesidades y gestiona la actividad de tu entidad.
                                            </p>
                                            {renderQuickActions()}
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
                                    <ul className="home-welcome-list mb-4">
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Validar nuevas ONGs</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Ver estadísticas del sistema</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Gestionar usuarios y donaciones</li>
                                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Supervisar la plataforma</li>
                                    </ul>
                                    {renderQuickActions()}
                                </div>
                            )}
                                    </div>
                                </Col>

                                {welcomeActivity && (
                                    <Col lg={6}>
                                        {welcomeActivity}
                                    </Col>
                                )}
                            </Row>
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
