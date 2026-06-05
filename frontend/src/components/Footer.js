import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <Container>
                <div className="footer-shell">
                    <div className="footer-main">
                        <div className="footer-brand">
                            <span className="footer-brand-mark" aria-hidden="true">
                                <i className="bi bi-box2-heart"></i>
                            </span>
                            <span>Plataforma de Donaciones</span>
                        </div>
                        <p className="footer-description">
                            Conectando donaciones disponibles con entidades sociales de forma clara y segura.
                        </p>
                    </div>

                    <div className="footer-side">
                        <div className="footer-links" aria-label="Enlaces legales">
                            <Link to="/aviso-legal">Aviso legal</Link>
                            <Link to="/proteccion-datos">Proteccion de datos</Link>
                            <Link to="/terminos-uso">Terminos de uso</Link>
                        </div>

                        <div className="footer-beta">
                            <span className="footer-beta-label">Version en pruebas</span>
                            <span>
                                Puedes registrar errores en este{' '}
                                <a
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSdZvtAXDrBKBSKZY8AarBrJOnAPgvXjW0Fb5krQWS6qz2GOgg/viewform?usp=publish-editor"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    formulario
                                </a>
                                .
                            </span>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>&copy; {year} Plataforma de Donaciones.</span>
                    <span>Todos los derechos reservados.</span>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
