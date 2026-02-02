import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OngPending.css';

const OngPending = () => {
    const navigate = useNavigate();

    return (
        <div className="ong-pending-container">
            <div className="card pending-card">
                <div className="pending-icon">⏳</div>
                <h1>Solicitud Recibida</h1>
                <p className="pending-message">
                    Tu solicitud de registro como entidad social ha sido recibida correctamente.
                </p>
                <p className="pending-info">
                    Un administrador revisará tu solicitud y verificará la documentación proporcionada.
                    Recibirás una notificación por email cuando tu ONG sea aprobada.
                </p>
                <div className="pending-steps">
                    <h3>¿Qué sigue?</h3>
                    <ol>
                        <li>Revisión de documentación por parte del equipo</li>
                        <li>Verificación de la información proporcionada</li>
                        <li>Aprobación o rechazo de la solicitud</li>
                        <li>Notificación por email con el resultado</li>
                    </ol>
                </div>
                <button onClick={() => navigate('/')} className="btn btn-primary mt-2">
                    Ir al Inicio
                </button>
            </div>
        </div>
    );
};

export default OngPending;
