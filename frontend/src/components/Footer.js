import React from 'react';
import { Container } from 'react-bootstrap';
import './Footer.css';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <div className="footer-brand">Plataforma de Donaciones</div>
                <div className="footer-meta"> {year} Todos los derechos reservados.</div>
            </Container>
        </footer>
    );
};

export default Footer;
