import React from 'react';
import { Container, Card } from 'react-bootstrap';
import './LegalPages.css';

const LegalNotice = () => {
    return (
        <div className="legal-page">
            <Container>
                <Card className="legal-card">
                    <Card.Body>
                        <h1 className="legal-title">Aviso legal</h1>
                        <p className="legal-lead">
                            Esta pagina tiene caracter informativo. Si necesitas un texto legal definitivo,
                            revisalo con tu asesoria juridica.
                        </p>

                        <section className="legal-section">
                            <h2>Responsable</h2>
                            <p>
                                Plataforma de Donaciones. Para contacto general, utiliza el formulario o correo
                                que figure en la aplicacion.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Uso del sitio</h2>
                            <p>
                                El usuario se compromete a utilizar la plataforma de forma licita, respetando
                                la normativa aplicable y los derechos de terceros.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Propiedad intelectual</h2>
                            <p>
                                Los contenidos, marcas y elementos visuales de la plataforma pertenecen a sus
                                respectivos titulares y no pueden reproducirse sin autorizacion.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Limitacion de responsabilidad</h2>
                            <p>
                                La plataforma actua como intermediaria. No garantiza la disponibilidad continua
                                del servicio ni es responsable de acuerdos realizados entre usuarios y ONGs.
                            </p>
                        </section>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default LegalNotice;
