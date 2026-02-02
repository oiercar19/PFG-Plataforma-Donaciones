import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';

const NavigationBar = () => {
    const { user, logout, isAuthenticated, isAdmin, isDonor, isOng } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" style={{ marginBottom: 0 }}>
            <Container>
                <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
                    <i className="bi bi-heart-fill text-danger me-2"></i>
                    Plataforma de Donaciones
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-lg-center">
                        {!isAuthenticated ? (
                            <>
                                <Nav.Link as={Link} to="/login" className="text-white me-2">
                                    <i className="bi bi-box-arrow-in-right me-1"></i>
                                    Iniciar Sesión
                                </Nav.Link>
                                <Button
                                    as={Link}
                                    to="/register"
                                    variant="primary"
                                    size="sm"
                                >
                                    Registrarse
                                </Button>
                            </>
                        ) : (
                            <>
                                {isAdmin() && (
                                    <Nav.Link as={Link} to="/admin" className="text-warning fw-semibold me-2">
                                        <i className="bi bi-shield-fill me-1"></i>
                                        Panel Admin
                                    </Nav.Link>
                                )}

                                {isDonor() && (
                                    <>
                                        <Nav.Link as={Link} to="/donations" className="text-white me-2">
                                            <i className="bi bi-gift me-1"></i>
                                            Mis Donaciones
                                        </Nav.Link>
                                        <Nav.Link as={Link} to="/create-donation" className="text-white me-2">
                                            <i className="bi bi-plus-circle me-1"></i>
                                            Nueva Donación
                                        </Nav.Link>
                                    </>
                                )}

                                {isOng() && (
                                    <>
                                        <Nav.Link as={Link} to="/my-ong" className="text-success fw-semibold me-2">
                                            <i className="bi bi-building me-1"></i>
                                            Mi ONG
                                        </Nav.Link>
                                        <Nav.Link as={Link} to="/donations" className="text-white me-2">
                                            <i className="bi bi-gift me-1"></i>
                                            Mis Donaciones
                                        </Nav.Link>
                                        <Nav.Link as={Link} to="/create-donation" className="text-white me-2">
                                            <i className="bi bi-plus-circle me-1"></i>
                                            Crear
                                        </Nav.Link>
                                        <Nav.Link as={Link} to="/available-donations" className="text-white me-2">
                                            <i className="bi bi-search me-1"></i>
                                            Buscar
                                        </Nav.Link>
                                    </>
                                )}

                                <Nav.Link as={Link} to="/map" className="text-white me-2">
                                    <i className="bi bi-geo-alt me-1"></i>
                                    Mapa
                                </Nav.Link>

                                <NavDropdown
                                    title={
                                        <span className="text-white">
                                            <i className="bi bi-person-circle me-1"></i>
                                            {user.username}
                                        </span>
                                    }
                                    id="basic-nav-dropdown"
                                    className="text-white"
                                >
                                    <NavDropdown.Item as={Link} to="/profile/edit">
                                        <i className="bi bi-pencil-square me-2"></i>
                                        Editar Perfil
                                    </NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        Cerrar Sesión
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
