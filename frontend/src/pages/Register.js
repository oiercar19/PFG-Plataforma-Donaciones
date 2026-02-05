import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert, ButtonGroup } from 'react-bootstrap';

const Register = () => {
    const [isOng, setIsOng] = useState(false);
    const [formData, setFormData] = useState({
        // Datos de usuario
        username: '',
        email: '',
        password: '',
        location: '',
        // Datos de ONG
        name: '',
        cif: '',
        type: 'ONG',
        description: '',
        ongLocation: '',
        contactEmail: '',
        contactPhone: '',
        documentUrl: '',
    });
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { registerDonor, registerOng } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            setError('Máximo 5 archivos permitidos');
            e.target.value = '';
            return;
        }
        setDocuments(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;

            if (isOng) {
                // Registro de ONG con archivos
                const ongFormData = new FormData();

                // Agregar datos básicos
                ongFormData.append('username', formData.username);
                ongFormData.append('email', formData.email);
                ongFormData.append('password', formData.password);
                ongFormData.append('location', formData.ongLocation);
                ongFormData.append('name', formData.name);
                ongFormData.append('cif', formData.cif);
                ongFormData.append('type', formData.type);
                ongFormData.append('description', formData.description);
                ongFormData.append('contactEmail', formData.contactEmail);
                ongFormData.append('contactPhone', formData.contactPhone);
                if (formData.documentUrl) {
                    ongFormData.append('documentUrl', formData.documentUrl);
                }

                // Agregar archivos
                documents.forEach((file) => {
                    ongFormData.append('documents', file);
                });

                result = await registerOng(ongFormData);

                if (result.success) {
                    navigate('/ong-pending');
                }
            } else {
                // Registro de donante
                const donorData = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    location: formData.location,
                };

                result = await registerDonor(donorData);

                if (result.success) {
                    navigate('/');
                }
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Error inesperado al registrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh', paddingTop: '3rem', paddingBottom: '3rem' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={10} lg={8}>
                        <Card className="shadow-lg border-0">
                            <Card.Body className="p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <i className="bi bi-person-plus-fill" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                                    <h2 className="mt-3 fw-bold">Registro</h2>
                                    <p className="text-muted">Crea tu cuenta para comenzar</p>
                                </div>

                                <ButtonGroup className="w-100 mb-4" size="lg">
                                    <Button
                                        variant={!isOng ? 'primary' : 'outline-primary'}
                                        onClick={() => setIsOng(false)}
                                        className="py-3"
                                    >
                                        <i className="bi bi-person me-2"></i>
                                        Soy Donante
                                    </Button>
                                    <Button
                                        variant={isOng ? 'primary' : 'outline-primary'}
                                        onClick={() => setIsOng(true)}
                                        className="py-3"
                                    >
                                        <i className="bi bi-building me-2"></i>
                                        Soy una Entidad Social
                                    </Button>
                                </ButtonGroup>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    {/* Datos de usuario (comunes) */}
                                    <div className="mb-4">
                                        <h5 className="fw-bold mb-3 pb-2 border-bottom">Datos de Usuario</h5>

                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Nombre de usuario *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="juan_perez"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Email *</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="tu@email.com"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Contraseña *</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                        minLength="6"
                                                        placeholder="Mínimo 6 caracteres"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Población *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="Madrid"
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Datos de ONG (solo si es ONG) */}
                                    {isOng && (
                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-3 pb-2 border-bottom">Datos de la Entidad</h5>

                                            <Row>
                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Nombre de la entidad *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Cruz Roja Barcelona"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>CIF / NIF *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="cif"
                                                            value={formData.cif}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="G12345678"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Tipo de entidad *</Form.Label>
                                                        <Form.Select
                                                            name="type"
                                                            value={formData.type}
                                                            onChange={handleChange}
                                                            required
                                                            size="lg"
                                                        >
                                                            <option value="ONG">ONG</option>
                                                            <option value="ASOCIACION">Asociación</option>
                                                            <option value="FUNDACION">Fundación</option>
                                                            <option value="ENTIDAD_SOCIAL">Entidad Social</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Ubicación de la entidad *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="ongLocation"
                                                            value={formData.ongLocation}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Barcelona"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col xs={12} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Descripción</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            name="description"
                                                            value={formData.description}
                                                            onChange={handleChange}
                                                            rows="3"
                                                            placeholder="Describe brevemente las actividades de tu entidad"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Email de contacto *</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            name="contactEmail"
                                                            value={formData.contactEmail}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="contacto@entidad.org"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Teléfono de contacto *</Form.Label>
                                                        <Form.Control
                                                            type="tel"
                                                            name="contactPhone"
                                                            value={formData.contactPhone}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="+34 600 123 456"
                                                            size="lg"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col xs={12} className="mb-3">
                                                    <Form.Group>
                                                        <Form.Label>Documentos acreditativos *</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            multiple
                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                            onChange={handleFileChange}
                                                            size="lg"
                                                            required
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Sube documentos que acrediten tu entidad (CIF, estatutos, certificados). Máximo 5 archivos de 5MB cada uno.
                                                            Formatos: PDF, JPG, PNG, DOC, DOCX
                                                        </Form.Text>
                                                        {documents.length > 0 && (
                                                            <div className="mt-2">
                                                                <small className="text-success">
                                                                    <i className="bi bi-check-circle me-1"></i>
                                                                    {documents.length} archivo(s) seleccionado(s)
                                                                </small>
                                                            </div>
                                                        )}
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-100 mt-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Registrando...
                                            </>
                                        ) : (
                                            'Registrarse'
                                        )}
                                    </Button>
                                </Form>

                                <div className="text-center mt-4">
                                    <p className="text-muted">
                                        ¿Ya tienes cuenta? <Link to="/login" className="text-decoration-none fw-semibold">Inicia sesión</Link>
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Register;
