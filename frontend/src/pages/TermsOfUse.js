import React from 'react';
import { Container, Card } from 'react-bootstrap';
import './LegalPages.css';

const TermsOfUse = () => {
    return (
        <div className="legal-page">
            <Container>
                <Card className="legal-card">
                    <Card.Body>
                        <h1 className="legal-title">Términos de uso</h1>
                        <p className="legal-lead">
                            Al utilizar la plataforma, usuarios y ONGs aceptan estos términos y se comprometen a
                            un uso lícito y responsable en la gestión de donaciones.
                        </p>

                        <section className="legal-section">
                            <h2>Compromiso de uso lícito</h2>
                            <p>
                                Todos los usuarios deben actuar conforme a la normativa vigente, evitando cualquier
                                actividad fraudulenta, engañosa o que vulnere derechos de terceros.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Obligaciones específicas de las ONGs</h2>
                            <p>
                                Las ONGs se comprometen a gestionar las donaciones de forma transparente, verificable
                                y alineada con sus fines estatutarios. Queda prohibido desviar recursos, solicitar o
                                aceptar donaciones fuera de la plataforma con fines ilícitos, o falsear información.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Contenido y veracidad</h2>
                            <p>
                                La información publicada debe ser precisa y actualizada. La plataforma podrá suspender
                                contenidos o cuentas que incumplan estos términos.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2>Incumplimientos</h2>
                            <p>
                                El incumplimiento de estos términos puede conllevar la limitación o cancelación de la
                                cuenta, además de las acciones legales que correspondan.
                            </p>
                        </section>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default TermsOfUse;
