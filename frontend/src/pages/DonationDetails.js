import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donationAPI } from '../services/api';
import './DonationDetails.css';

function DonationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);

    const loadDonation = useCallback(async () => {
        try {
            setLoading(true);
            const response = await donationAPI.getDonationById(id);
            setDonation(response.data.donation);
            setError('');
        } catch (err) {
            console.error('Error al cargar donación:', err);
            setError('Error al cargar la donación');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDonation();
    }, [loadDonation]);

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta donación?')) {
            try {
                await donationAPI.deleteDonation(id);
                navigate('/my-donations', {
                    state: { message: 'Donación eliminada exitosamente' }
                });
            } catch (err) {
                console.error('Error al eliminar:', err);
                alert(err.response?.data?.error || 'Error al eliminar la donación');
            }
        }
    };

    const handleMarkAsDelivered = async () => {
        if (window.confirm('¿Confirmas que esta donación ha sido entregada?')) {
            try {
                await donationAPI.markAsDelivered(id);
                loadDonation();
            } catch (err) {
                console.error('Error al marcar como entregada:', err);
                alert('Error al marcar como entregada');
            }
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            DISPONIBLE: { text: 'Disponible', class: 'status-available', icon: 'bi-check-circle' },
            ASIGNADO: { text: 'Asignado', class: 'status-assigned', icon: 'bi-clock-history' },
            ENTREGADO: { text: 'Entregado', class: 'status-delivered', icon: 'bi-check-all' }
        };
        const badge = badges[status] || { text: status, class: '', icon: 'bi-circle' };
        return (
            <span className={`status-badge-large ${badge.class}`}>
                <i className={`bi ${badge.icon}`}></i>
                {badge.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="donation-details-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando detalles...</p>
                </div>
            </div>
        );
    }

    if (error || !donation) {
        return (
            <div className="donation-details-container">
                <div className="error-state">
                    <i className="bi bi-exclamation-circle"></i>
                    <h2>{error || 'Donación no encontrada'}</h2>
                    <button onClick={() => navigate('/my-donations')}>
                        Volver a Mis Donaciones
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="donation-details-container">
            <div className="details-header">
                <button className="btn-back" onClick={() => navigate('/my-donations')}>
                    <i className="bi bi-arrow-left"></i>
                    Volver
                </button>
                <div className="header-actions">
                    {donation.status === 'DISPONIBLE' && (
                        <>
                            <button
                                className="btn-edit"
                                onClick={() => navigate(`/donations/${id}/edit`)}
                            >
                                <i className="bi bi-pencil"></i>
                                Editar
                            </button>
                            <button
                                className="btn-delete"
                                onClick={handleDelete}
                            >
                                <i className="bi bi-trash"></i>
                                Eliminar
                            </button>
                        </>
                    )}
                    {donation.status === 'ASIGNADO' && (
                        <button
                            className="btn-delivered"
                            onClick={handleMarkAsDelivered}
                        >
                            <i className="bi bi-check-circle"></i>
                            Marcar como Entregado
                        </button>
                    )}
                </div>
            </div>

            <div className="details-content">
                <div className="details-main">
                    {/* Galería de imágenes */}
                    {donation.images && donation.images.length > 0 ? (
                        <div className="image-gallery">
                            <div className="main-image">
                                <img
                                    src={donation.images[selectedImage]}
                                    alt={donation.title}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/600x400?text=Sin+Imagen';
                                    }}
                                />
                            </div>
                            {donation.images.length > 1 && (
                                <div className="image-thumbnails">
                                    {donation.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(index)}
                                        >
                                            <img
                                                src={image}
                                                alt={`${donation.title} ${index + 1}`}
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/100?text=Sin+Imagen';
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="no-image-large">
                            <i className="bi bi-image"></i>
                            <p>Sin imágenes disponibles</p>
                        </div>
                    )}

                    {/* Información principal */}
                    <div className="info-section">
                        <div className="title-row">
                            <h1>{donation.title}</h1>
                            {getStatusBadge(donation.status)}
                        </div>

                        <div className="category-tag">
                            <i className="bi bi-tag"></i>
                            {donation.category}
                        </div>

                        <div className="description-section">
                            <h2>Descripción</h2>
                            <p>{donation.description}</p>
                        </div>

                        <div className="details-grid">
                            <div className="detail-card">
                                <i className="bi bi-box"></i>
                                <div>
                                    <span className="detail-label">Cantidad</span>
                                    <span className="detail-value">{donation.quantity}</span>
                                </div>
                            </div>

                            <div className="detail-card">
                                <i className="bi bi-calendar"></i>
                                <div>
                                    <span className="detail-label">Fecha de creación</span>
                                    <span className="detail-value">{formatDate(donation.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="details-sidebar">
                    {/* Ubicación */}
                    <div className="info-card">
                        <h3>
                            <i className="bi bi-geo-alt"></i>
                            Ubicación
                        </h3>
                        <div className="location-info">
                            <p><strong>{donation.city}</strong></p>
                            {donation.province && <p>{donation.province}</p>}
                            {donation.postalCode && <p>CP: {donation.postalCode}</p>}
                            {donation.address && (
                                <p className="address">
                                    <i className="bi bi-house"></i>
                                    {donation.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Información del donante */}
                    <div className="info-card">
                        <h3>
                            <i className="bi bi-person"></i>
                            Donante
                        </h3>
                        <div className="donor-info">
                            <p><strong>{donation.donor.username}</strong></p>
                            {donation.donor.location && (
                                <p>
                                    <i className="bi bi-geo"></i>
                                    {donation.donor.location}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Información de asignación */}
                    {donation.assignedOng && (
                        <div className="info-card assigned-card">
                            <h3>
                                <i className="bi bi-building"></i>
                                Asignado a
                            </h3>
                            <div className="ong-info">
                                <p className="ong-name">{donation.assignedOng.name}</p>
                                {donation.assignedOng.contactEmail && (
                                    <p>
                                        <i className="bi bi-envelope"></i>
                                        {donation.assignedOng.contactEmail}
                                    </p>
                                )}
                                {donation.assignedOng.contactPhone && (
                                    <p>
                                        <i className="bi bi-telephone"></i>
                                        {donation.assignedOng.contactPhone}
                                    </p>
                                )}
                                {donation.assignedOng.location && (
                                    <p>
                                        <i className="bi bi-geo"></i>
                                        {donation.assignedOng.location}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DonationDetails;
