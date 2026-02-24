import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminOrDoctorRoute({ children }) {
  const { isAdmin, isDoctor, user } = useAuth();
  if (user === null) return <div className="loading">Loading...</div>;
  if (!isAdmin && !isDoctor) return <Navigate to="/" replace />;
  return children;
}
