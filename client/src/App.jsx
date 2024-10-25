import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navigation from './components/Navigation';
import ArtworkList from './components/ArtworkList';
import CreateArtwork from './components/CreateArtwork';
import ArtworkDetails from './components/ArtworkDetails';
import EditProfile from './components/EditProfile';
import UserProfile from './components/UserProfile';
import VerifyUser from './components/Auth/VerifyUser';
import EmailVerification from './components/Auth/EmailVerification';
import ResetPassword from './components/Auth/ResetPassword';
import SearchResults from './components/SearchResults';
import LoadingSpinner from './components/common/LoadingSpinner';
import NotFound from './components/NotFound';
import About from './components/About';

const App = () => {

  useEffect(() => {
    const token = localStorage.getItem('token');
  }, []);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return <div>Error: Google Client ID is not configured</div>;
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Navigation />
            <main className='pt-16 bg-primary-darkest'>
              <Routes>
                <Route path="/" element={<ArtworkList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/create"
                  element={
                    <ProtectedRoute>
                      <CreateArtwork />
                    </ProtectedRoute>
                  }
                />
                <Route path="/artwork/:id" element={<ArtworkDetails />} />
                <Route path="/profile/:username" element={<UserProfile />} />
                <Route path="/edit-profile" element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                } />
                <Route path="/verify-email" element={
                  <ProtectedRoute>
                    <VerifyUser />
                  </ProtectedRoute>
                } />
                <Route path="/verify/:token" element={<EmailVerification />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                <Route path="/search" element={<SearchResults />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/about" element={<About />} />
              </Routes>

            </main>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user !== null) {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;

}

export default App;