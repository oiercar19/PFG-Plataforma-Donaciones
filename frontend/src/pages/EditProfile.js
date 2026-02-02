import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './EditProfile.css';

function EditProfile() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        location: user?.location || '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
    });

    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validaciones
        if (!formData.username || !formData.email) {
            setError('El nombre de usuario y el email son obligatorios');
            return;
        }

        if (showPasswordFields) {
            if (!formData.currentPassword) {
                setError('Debes ingresar tu contraseña actual para cambiarla');
                return;
            }

            if (!formData.password) {
                setError('Debes ingresar una nueva contraseña');
                return;
            }

            if (formData.password.length < 6) {
                setError('La nueva contraseña debe tener al menos 6 caracteres');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }
        }

        setLoading(true);

        // Preparar datos para enviar
        const updateData = {
            username: formData.username,
            email: formData.email,
            location: formData.location,
        };

        if (showPasswordFields && formData.password) {
            updateData.currentPassword = formData.currentPassword;
            updateData.password = formData.password;
        }

        const result = await updateProfile(updateData);

        if (result.success) {
            setSuccess('Perfil actualizado correctamente');
            // Limpiar campos de contraseña
            setFormData({
                ...formData,
                currentPassword: '',
                password: '',
                confirmPassword: '',
            });
            setShowPasswordFields(false);

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleCancel = () => {
        navigate('/');
    };

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-card">
                <h2>Editar Perfil</h2>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Nombre de usuario</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Población</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Opcional"
                        />
                    </div>

                    <div className="form-group">
                        <label>Rol</label>
                        <input
                            type="text"
                            value={user?.role || ''}
                            disabled
                            className="disabled-input"
                        />
                        <small className="form-help">El rol no se puede modificar</small>
                    </div>

                    <div className="password-section">
                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowPasswordFields(!showPasswordFields)}
                        >
                            {showPasswordFields ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                        </button>

                        {showPasswordFields && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="currentPassword">Contraseña actual</label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        required={showPasswordFields}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Nueva contraseña</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={showPasswordFields}
                                        minLength="6"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required={showPasswordFields}
                                        minLength="6"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;
