import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationAPI } from '../services/api';
import './MyDonations.css';

function MyDonations() {
    const navigate = useNavigate();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMyDonations();
    }, []);

    const loadMyDonations = async () => {
        try {
            setLoading(true);
            const response = await donationAPI.getMyDonations();
            setDonations(response.data.donations || []);
            setError('');
        } catch (err) {
            console.error('Error al cargar donaciones:', err);
            setError('Error al cargar tus donaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta donación?')) {
            try {
                await donationAPI.deleteDonation(id);
                setDonations(donations.filter(d => d.id !== id));
            } catch (err) {
                console.error('Error al eliminar:', err);
                alert('Error al eliminar la donación');
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/donations/${id}/edit`);
    };

    const getStatusBadge = (status) => {
        const badges = {
            DISPONIBLE: { text: 'Disponible', class: 'status-available' },
            ASIGNADO: { text: 'Asignado', class: 'status-assigned' },
            ENTREGADO: { text: 'Entregado', class: 'status-delivered' }
        };
        const badge = badges[status] || { text: status, class: '' };
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="my-donations-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando tus donaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-donations-container">
            <div className="donations-header">
                <h1>
                    <i className="bi bi-box-seam"></i>
                    Mis Donaciones
                </h1>
                <button
                    className="btn-create-new"
                    onClick={() => navigate('/create-donation')}
                >
                    <i className="bi bi-plus-circle"></i>
                    Nueva Donación
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <i className="bi bi-exclamation-circle"></i>
                    {error}
                </div>
            )}

            {donations.length === 0 ? (
                <div className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <h2>No tienes donaciones</h2>
                    <p>Cuando crees una donación, aparecerá aquí</p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/create-donation')}
                    >
                        Crear Primera Donación
                    </button>
                </div>
            ) : (
                <div className="donations-grid">
                    {donations.map((donation) => (
                        <div key={donation.id} className="donation-card">
                            {donation.images && donation.images.length > 0 && (
                                <div className="donation-image">
                                    <img
                                        src={donation.images[0]}
                                        alt={donation.title}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen';
                                        }}
                                    />
                                    {getStatusBadge(donation.status)}
                                </div>
                            )}
                            {(!donation.images || donation.images.length === 0) && (
                                <div className="donation-image no-image">
                                    <i className="bi bi-image"></i>
                                    <span>Sin imagen</span>
                                    {getStatusBadge(donation.status)}
                                </div>
                            )}

                            <div className="donation-content">
                                <div className="donation-category">
                                    <i className="bi bi-tag"></i>
                                    {donation.category}
                                </div>

                                <h3>{donation.title}</h3>

                                <p className="donation-description">
                                    {donation.description}
                                </p>

                                <div className="donation-details">
                                    <div className="detail-item">
                                        <i className="bi bi-box"></i>
                                        <span>Cantidad: {donation.quantity}</span>
                                    </div>
                                    <div className="detail-item">
                                        <i className="bi bi-geo-alt"></i>
                                        <span>
                                            {donation.city}
                                            {donation.postalCode && ` (${donation.postalCode})`}
                                        </span>
                                    </div>
                                    {donation.address && (
                                        <div className="detail-item">
                                            <i className="bi bi-house"></i>
                                            <span>{donation.address}</span>
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <i className="bi bi-calendar"></i>
                                        <span>{formatDate(donation.createdAt)}</span>
                                    </div>
                                </div>

                                {donation.assignedOng && (
                                    <div className="assigned-info">
                                        <i className="bi bi-building"></i>
                                        Asignado a: <strong>{donation.assignedOng.name}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="donation-actions">
                                <button
                                    className="btn-view"
                                    onClick={() => navigate(`/donations/${donation.id}`)}
                                    title="Ver detalles"
                                >
                                    <i className="bi bi-eye"></i>
                                    Ver
                                </button>

                                {donation.status === 'DISPONIBLE' && (
                                    <>
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(donation.id)}
                                            title="Editar donación"
                                        >
                                            <i className="bi bi-pencil"></i>
                                            Editar
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(donation.id)}
                                            title="Eliminar donación"
                                        >
                                            <i className="bi bi-trash"></i>
                                            Eliminar
                                        </button>
                                    </>
                                )}

                                {donation.status === 'ASIGNADO' && (
                                    <button
                                        className="btn-delivered"
                                        onClick={() => {/* TODO: marcar como entregado */ }}
                                        title="Marcar como entregado"
                                    >
                                        <i className="bi bi-check-circle"></i>
                                        Marcar Entregado
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyDonations;
