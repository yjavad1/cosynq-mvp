import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import { ContactsPage } from './pages/ContactsPage'
import { SpacesPage } from './pages/SpacesPage'
import { LocationsPage } from './pages/LocationsPage'
import OnboardingPage from './pages/OnboardingPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PasswordResetPage from './pages/PasswordResetPage'
import SpaceConfigurationPage from './pages/SpaceConfigurationPage'
import LocationSpacesPage from './pages/LocationSpacesPage'
import LocationDetailPage from './pages/LocationDetailPage'
import BookingsPage from './pages/BookingsPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<HomePage />} />
              
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LoginPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/register" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <RegisterPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/forgot-password" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ForgotPasswordPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/reset-password/:token" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <PasswordResetPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute skipOnboardingCheck={true}>
                    <OnboardingPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/contacts" 
                element={
                  <ProtectedRoute>
                    <ContactsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/spaces" 
                element={
                  <ProtectedRoute>
                    <SpacesPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/locations" 
                element={
                  <ProtectedRoute>
                    <LocationsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/configure-spaces" 
                element={
                  <ProtectedRoute>
                    <SpaceConfigurationPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/locations/:locationId" 
                element={
                  <ProtectedRoute>
                    <LocationDetailPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/locations/:locationId/spaces" 
                element={
                  <ProtectedRoute>
                    <LocationSpacesPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/locations/:locationId/bookings" 
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App