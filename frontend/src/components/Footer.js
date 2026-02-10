import React from 'react';
import { Container } from 'react-bootstrap';
import './Footer.css';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <div className="footer-brand">Plataforma de Donaciones</div>
                <div>
                    <div className="footer-meta">{year} Todos los derechos reservados.</div>
                    <div className="footer-warning">Primera versión en pruebas — errores posibles.</div>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
