import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
    const [stats, setStats] = useState(null);
    const [pendingOngs, setPendingOngs] = useState([]);
    const [selectedOng, setSelectedOng] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, ongsRes] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getPendingOngs(),
            ]);

            setStats(statsRes.data.stats);
            setPendingOngs(ongsRes.data.ongs);
        } catch (err) {
            setError('Error al cargar datos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (ongId) => {
        try {
            const response = await adminAPI.getOngById(ongId);
            console.log('ONG cargada:', response.data.ong);
            console.log('Documentos:', response.data.ong.documents);
            setSelectedOng(response.data.ong);
        } catch (err) {
            setError('Error al cargar detalles de la ONG');
            console.error('Error:', err);
        }
    };

    const handleApprove = async (ongId) => {
        if (!window.confirm('¿Estás seguro de aprobar esta ONG?')) return;

        try {
            setActionLoading(true);
            await adminAPI.approveOng(ongId);
            setSuccess('ONG aprobada exitosamente');
            setSelectedOng(null);
            await loadData();
        } catch (err) {
            setError('Error al aprobar ONG');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (ongId) => {
        if (!rejectionReason.trim()) {
            setError('Debes proporcionar un motivo de rechazo');
            return;
        }

        try {
            setActionLoading(true);
            await adminAPI.rejectOng(ongId, rejectionReason);
            setSuccess('ONG rechazada');
            setSelectedOng(null);
            setShowRejectModal(null);
            setRejectionReason('');
            await loadData();
        } catch (err) {
            setError('Error al rechazar ONG');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadDocument = async (documentId, originalName) => {
        try {
            const response = await adminAPI.downloadDocument(documentId);

            // Crear URL temporal para descargar
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Error al descargar documento');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ marginTop: '50px' }}>
                <div className="spinner"></div>
                <p className="text-center">Cargando panel de administración...</p>
            </div>
        );
    }

    return (
        <div className="container admin-panel">
            <h1>Panel de Administración</h1>

            {error && (
                <div className="alert alert-error">
                    {error}
                    <button onClick={() => setError('')} style={{ float: 'right' }}>×</button>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                    <button onClick={() => setSuccess('')} style={{ float: 'right' }}>×</button>
                </div>
            )}

            {/* Estadísticas */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>{stats.users.total}</h3>
                            <p>Usuarios Totales</p>
                            <small>{stats.users.donors} donantes</small>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🏢</div>
                        <div className="stat-info">
                            <h3>{stats.ongs.total}</h3>
                            <p>ONGs Registradas</p>
                            <small>{stats.ongs.approved} aprobadas</small>
                        </div>
                    </div>

                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h3>{stats.ongs.pending}</h3>
                            <p>ONGs Pendientes</p>
                            <small>Requieren validación</small>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🎁</div>
                        <div className="stat-info">
                            <h3>{stats.donations.total}</h3>
                            <p>Donaciones</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ONGs Pendientes */}
            <div className="card mt-3">
                <h2>ONGs Pendientes de Validación</h2>

                {pendingOngs.length === 0 ? (
                    <p className="text-center" style={{ padding: '20px', color: '#666' }}>
                        No hay ONGs pendientes de validación
                    </p>
                ) : (
                    <div className="ongs-list">
                        {pendingOngs.map((ong) => (
                            <div key={ong.id} className="ong-item">
                                <div className="ong-info">
                                    <h3>{ong.name}</h3>
                                    <p>
                                        <strong>CIF:</strong> {ong.cif} | <strong>Tipo:</strong> {ong.type}
                                    </p>
                                    <p>
                                        <strong>Ubicación:</strong> {ong.location}
                                    </p>
                                    <p>
                                        <strong>Contacto:</strong> {ong.contactEmail} | {ong.contactPhone}
                                    </p>
                                    <p>
                                        <strong>Registrado por:</strong> {ong.user.username} ({ong.user.email})
                                    </p>
                                    <p>
                                        <strong>Documentos adjuntos:</strong> {ong.documents?.length || 0}
                                    </p>
                                </div>
                                <div className="ong-actions">
                                    <button
                                        onClick={() => handleViewDetails(ong.id)}
                                        style={{
                                            backgroundColor: '#6c757d',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                                    >
                                        👁️ Ver Detalles
                                    </button>
                                    <button
                                        onClick={() => handleApprove(ong.id)}
                                        style={{
                                            backgroundColor: '#667eea',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                        }}
                                        disabled={actionLoading}
                                        onMouseEnter={(e) => !actionLoading && (e.target.style.backgroundColor = '#5568d3')}
                                        onMouseLeave={(e) => !actionLoading && (e.target.style.backgroundColor = '#667eea')}
                                    >
                                        ✓ Aprobar
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(ong.id)}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                        }}
                                        disabled={actionLoading}
                                        onMouseEnter={(e) => !actionLoading && (e.target.style.backgroundColor = '#c82333')}
                                        onMouseLeave={(e) => !actionLoading && (e.target.style.backgroundColor = '#dc3545')}
                                    >
                                        ✕ Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de detalles */}
            {selectedOng && (
                <div className="modal-overlay" onClick={() => setSelectedOng(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Detalles de {selectedOng.name}</h2>

                        <div className="detail-section">
                            <h3>Información de la Entidad</h3>
                            <p><strong>Nombre:</strong> {selectedOng.name}</p>
                            <p><strong>CIF:</strong> {selectedOng.cif}</p>
                            <p><strong>Tipo:</strong> {selectedOng.type}</p>
                            <p><strong>Ubicación:</strong> {selectedOng.location}</p>
                            <p><strong>Email:</strong> {selectedOng.contactEmail}</p>
                            <p><strong>Teléfono:</strong> {selectedOng.contactPhone}</p>
                            {selectedOng.description && (
                                <p><strong>Descripción:</strong> {selectedOng.description}</p>
                            )}
                            {selectedOng.documentUrl && (
                                <p>
                                    <strong>Documento (URL):</strong>{' '}
                                    <a href={selectedOng.documentUrl} target="_blank" rel="noopener noreferrer">
                                        Ver documento
                                    </a>
                                </p>
                            )}
                            <div style={{ marginTop: '1rem' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>Documentos adjuntos:</p>
                                {selectedOng.documents && selectedOng.documents.length > 0 ? (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                        padding: '10px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}>
                                        {selectedOng.documents.map((doc, idx) => {
                                            return (
                                                <button
                                                    key={doc.id || idx}
                                                    onClick={() => handleDownloadDocument(doc.id, doc.originalName)}
                                                    style={{
                                                        fontSize: '14px',
                                                        padding: '10px 15px',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        width: '100%',
                                                        backgroundColor: '#007bff',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                                                >
                                                    <span style={{ fontSize: '18px' }}>📄</span>
                                                    <span style={{ flex: 1, color: '#ffffff', fontWeight: '500' }}>{doc.originalName}</span>
                                                    <span style={{ fontSize: '12px', color: '#ffffff' }}>⬇️ Descargar ({(doc.size / 1024).toFixed(1)} KB)</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', fontStyle: 'italic', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                        No hay documentos adjuntos
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3>Usuario Responsable</h3>
                            <p><strong>Username:</strong> {selectedOng.user.username}</p>
                            <p><strong>Email:</strong> {selectedOng.user.email}</p>
                            <p><strong>Ubicación:</strong> {selectedOng.user.location}</p>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => handleApprove(selectedOng.id)}
                                style={{
                                    backgroundColor: '#667eea',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                                disabled={actionLoading}
                                onMouseEnter={(e) => !actionLoading && (e.target.style.backgroundColor = '#5568d3')}
                                onMouseLeave={(e) => !actionLoading && (e.target.style.backgroundColor = '#667eea')}
                            >
                                ✓ Aprobar
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(selectedOng.id);
                                    setSelectedOng(null);
                                }}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                                disabled={actionLoading}
                                onMouseEnter={(e) => !actionLoading && (e.target.style.backgroundColor = '#c82333')}
                                onMouseLeave={(e) => !actionLoading && (e.target.style.backgroundColor = '#dc3545')}
                            >
                                ✕ Rechazar
                            </button>
                            <button
                                onClick={() => setSelectedOng(null)}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#333',
                                    border: '2px solid #ddd',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                    e.target.style.borderColor = '#999';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ffffff';
                                    e.target.style.borderColor = '#ddd';
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de rechazo */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Rechazar ONG</h2>
                        <p>Por favor, proporciona un motivo de rechazo:</p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="4"
                            placeholder="Ej: Documentación incompleta, CIF no válido, etc."
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '20px',
                                color: '#333',
                                fontSize: '14px',
                                border: '1px solid #ddd',
                                borderRadius: '6px'
                            }}
                        />

                        <div className="modal-actions">
                            <button
                                onClick={() => handleReject(showRejectModal)}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: actionLoading || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    opacity: actionLoading || !rejectionReason.trim() ? 0.6 : 1
                                }}
                                disabled={actionLoading || !rejectionReason.trim()}
                                onMouseEnter={(e) => {
                                    if (!actionLoading && rejectionReason.trim()) {
                                        e.target.style.backgroundColor = '#c82333';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading && rejectionReason.trim()) {
                                        e.target.style.backgroundColor = '#dc3545';
                                    }
                                }}
                            >
                                Confirmar Rechazo
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectionReason('');
                                }}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#333',
                                    border: '2px solid #ddd',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                    e.target.style.borderColor = '#999';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ffffff';
                                    e.target.style.borderColor = '#ddd';
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
