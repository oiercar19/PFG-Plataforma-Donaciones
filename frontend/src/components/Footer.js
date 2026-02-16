import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <div className="footer-brand">Plataforma de Donaciones</div>
                <div>
                    <div className="footer-meta">{year} Todos los derechos reservados.</div>
                    <div className="footer-warning">
                        Primera version en pruebas - errores posibles.
                        <br />
                        Si encuentras un error, por favor registralo en este{' '}
                        <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSdZvtAXDrBKBSKZY8AarBrJOnAPgvXjW0Fb5krQWS6qz2GOgg/viewform?usp=publish-editor"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            formulario
                        </a>
                        .
                    </div>
                    <div className="footer-links">
                        <Link to="/aviso-legal">Aviso legal</Link>
                        <span className="footer-links-sep">&middot;</span>
                        <Link to="/proteccion-datos">Proteccion de datos</Link>
                        <span className="footer-links-sep">&middot;</span>
                        <Link to="/terminos-uso">Terminos de uso</Link>
                    </div>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
