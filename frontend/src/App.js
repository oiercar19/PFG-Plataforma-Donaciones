import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OngPending from './pages/OngPending';
import AdminPanel from './pages/admin/AdminPanel';
import EditProfile from './pages/EditProfile';
import CreateDonation from './pages/CreateDonation';
import MyDonations from './pages/MyDonations';
import DonationDetails from './pages/DonationDetails';
import EditDonation from './pages/EditDonation';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App" style={{ paddingTop: 0 }}>
                    <Navbar />
                    <div>
                        <Routes>
                            {/* Rutas públicas */}
                            <Route path="/" element={<Home />} />

                            <Route
                                path="/login"
                                element={
                                    <PublicRoute>
                                        <Login />
                                    </PublicRoute>
                                }
                            />

                            <Route
                                path="/register"
                                element={
                                    <PublicRoute>
                                        <Register />
                                    </PublicRoute>
                                }
                            />

                            {/* Página de confirmación para ONGs */}
                            <Route path="/ong-pending" element={<OngPending />} />

                            {/* Rutas protegidas - Solo Admin */}
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute requireAdmin={true}>
                                        <AdminPanel />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rutas protegidas - Cualquier usuario autenticado */}
                            <Route
                                path="/profile/edit"
                                element={
                                    <ProtectedRoute>
                                        <EditProfile />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/donations"
                                element={
                                    <ProtectedRoute>
                                        <MyDonations />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/create-donation"
                                element={
                                    <ProtectedRoute>
                                        <CreateDonation />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/my-donations"
                                element={
                                    <ProtectedRoute>
                                        <MyDonations />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/donations/:id"
                                element={
                                    <ProtectedRoute>
                                        <DonationDetails />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/donations/:id/edit"
                                element={
                                    <ProtectedRoute>
                                        <EditDonation />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/available-donations"
                                element={
                                    <ProtectedRoute>
                                        <div className="container" style={{ marginTop: '50px' }}>
                                            <h1>Donaciones Disponibles</h1>
                                            <p>Lista en construcción...</p>
                                        </div>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/my-ong"
                                element={
                                    <ProtectedRoute>
                                        <div className="container" style={{ marginTop: '50px' }}>
                                            <h1>Mi ONG</h1>
                                            <p>Página en construcción...</p>
                                        </div>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/map"
                                element={
                                    <ProtectedRoute>
                                        <div className="container" style={{ marginTop: '50px' }}>
                                            <h1>Mapa Interactivo</h1>
                                            <p>Mapa en construcción...</p>
                                        </div>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Ruta 404 */}
                            <Route
                                path="*"
                                element={
                                    <div className="container text-center" style={{ marginTop: '100px' }}>
                                        <h1>404</h1>
                                        <p>Página no encontrada</p>
                                        <a href="/" className="btn btn-primary mt-2">Volver al Inicio</a>
                                    </div>
                                }
                            />
                        </Routes>
                    </div>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
