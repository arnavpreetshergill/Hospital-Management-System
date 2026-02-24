import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatients, deletePatient } from '../api/api';
import { useAuth } from '../context/AuthContext';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setLoading(true);
    setError('');
    try {
      const data = await getPatients();
      let allPatients = Array.isArray(data) ? data : [];
      
      // If user is a patient, only show their own record
      if (user?.role === 'patient') {
        allPatients = allPatients.filter(p => p.HospitalID === user.HospitalID);
      }
      
      setPatients(allPatients);
    } catch (err) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, e) {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this patient record?')) return;
    try {
      await deletePatient(id);
      setPatients((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <motion.div
        className="loading loading-animated"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="loading-dots">Loading patients</span>
      </motion.div>
    );
  }
  if (error) {
    return (
      <motion.div
        className="error-banner full-width"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page patients-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {user?.role === 'patient' ? 'My Details' : 'Patients'}
        </motion.h1>
      </div>
      <AnimatePresence mode="popLayout">
        {patients.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No patients found.
          </motion.div>
        ) : (
          <div className="patient-grid">
            {patients.map((p, i) => (
              <motion.div
                key={p._id}
                className="patient-card"
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
              <div className="patient-card-main">
                <span className="patient-id">{p.HospitalID || 'N/A'}</span>
                <span className="patient-blood">{p.bloodType || '-'}</span>
              </div>
              <div className="patient-card-meta">
                {p.medicalHistory?.length > 0 && (
                  <span>{p.medicalHistory.length} record(s)</span>
                )}
              </div>
              <div className="patient-card-actions">
                <Link to={`/patients/${p._id}`} className="btn btn-primary">
                  View
                </Link>
                {user?.role !== 'patient' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={(e) => handleDelete(p._id, e)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
