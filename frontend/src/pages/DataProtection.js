import React from 'react';
import { Container, Card } from 'react-bootstrap';
import './LegalPages.css';

const DataProtection = () => {
    return (
        <div className="legal-page">
            <Container>
                <Card className="legal-card">
                    <Card.Body>
                        <h1 className="legal-title">Proteccion de datos</h1>
                        <p className="legal-lead">
                            Este resumen explica como tratamos los datos personales en la plataforma.
                            Ajustalo segun tus procesos reales y normativa aplicable.
                        </p>

                        <section className="legal-section">
                            <h2>Datos que recopilamos</h2>
                            <p>
                                Informacion de registro, perfil y actividad (publicaciones, solicitudes,
                                mensajes y seguimiento de donaciones).
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Finalidades</h2>
                            <p>
                                Gestion de cuentas, coordinacion de donaciones, comunicacion entre usuarios
                                y mejora del servicio.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Base legal</h2>
                            <p>
                                Consentimiento del usuario, ejecucion del servicio y cumplimiento de obligaciones
                                legales cuando proceda.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Conservacion</h2>
                            <p>
                                Los datos se conservan mientras la cuenta este activa o durante los plazos
                                legales requeridos.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Derechos</h2>
                            <p>
                                Puedes solicitar acceso, rectificacion, supresion u oposicion al tratamiento
                                de tus datos mediante los canales de soporte de la plataforma.
                            </p>
                        </section>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default DataProtection;
