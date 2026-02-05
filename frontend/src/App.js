import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

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
import AvailableDonations from './pages/AvailableDonations';
import AvailableDonationDetails from './pages/AvailableDonationDetails';
import MyOng from './pages/MyOng';
import Chats from './pages/Chats';
import ChatDetails from './pages/ChatDetails';
import DonationsMap from './pages/DonationsMap';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App" style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Navbar />
                    <div style={{ flex: 1 }}>
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
                                        <AvailableDonations />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/available-donations/:id"
                                element={
                                    <ProtectedRoute>
                                        <AvailableDonationDetails />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/my-ong"
                                element={
                                    <ProtectedRoute>
                                        <MyOng />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/chats"
                                element={
                                    <ProtectedRoute>
                                        <Chats />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/chats/:id"
                                element={
                                    <ProtectedRoute>
                                        <ChatDetails />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/map"
                                element={
                                    <ProtectedRoute requireOng={true}>
                                        <DonationsMap />
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
                    <Footer />
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
