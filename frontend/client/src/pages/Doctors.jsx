import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDoctors, deleteDoctor } from '../api/api';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    setError('');
    try {
      const data = await getDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <motion.div className="loading loading-animated" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="loading-dots">Loading doctors</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page doctors-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header doctors-header">
        <h1>Doctors</h1>
      </div>
      {error && <div className="error-banner full-width">{error}</div>}
      <div className="doctors-layout">
        <div className="doctor-list">
          {doctors.length === 0 ? (
            <div className="empty-state">No doctors found.</div>
          ) : (
            doctors.map((d, i) => (
              <motion.div
                key={d._id}
                className={`doctor-card ${selected?._id === d._id ? 'selected' : ''}`}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                onClick={() => setSelected(d)}
              >
                <div className="doctor-card-main">
                  <span className="doctor-id">{d.HospitalID}</span>
                  <span className="doctor-name">{d.name}</span>
                </div>
                <div className="doctor-card-meta">{d.email}</div>
              </motion.div>
            ))
          )}
        </div>
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected._id}
              className="doctor-detail-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2>Doctor Details</h2>
              <div className="detail-row">
                <span className="label">Hospital ID</span>
                <span className="value">{selected.HospitalID}</span>
              </div>
              <div className="detail-row">
                <span className="label">Name</span>
                <span className="value">{selected.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email</span>
                <span className="value">{selected.email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Phone</span>
                <span className="value">{selected.phoneNumber || '-'}</span>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => handleDelete(selected._id, e)}
              >
                Delete Doctor
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="doctor-detail-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Select a doctor to view details
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
