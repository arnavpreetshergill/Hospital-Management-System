import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminOnlyRoute from './components/AdminOnlyRoute';
import AdminOrDoctorRoute from './components/AdminOrDoctorRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import Logs from './pages/Logs';
import Doctors from './pages/Doctors';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientList />} />
        <Route path="doctors" element={<AdminOnlyRoute><Doctors /></AdminOnlyRoute>} />
        <Route path="signup" element={<AdminOrDoctorRoute><Signup /></AdminOrDoctorRoute>} />
        <Route path="logs" element={<AdminOnlyRoute><Logs /></AdminOnlyRoute>} />
        <Route path="patients/:id" element={<PatientDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
