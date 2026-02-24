import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PatientDetailRoute({ children, patientId }) {
  const { user, isAdmin, isDoctor } = useAuth();
  
  if (user === null) return <div className="loading">Loading...</div>;
  
  // Admins and doctors can view any patient
  if (isAdmin || isDoctor) return children;
  
  // Patients can only view their own details
  // The patientId will be checked in the component itself
  if (user.role === 'patient') return children;
  
  return <Navigate to="/" replace />;
}
