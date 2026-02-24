import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatient, updatePatient, regenerateAiSummary } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canViewAiSummary, user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bloodType: '', medicalHistory: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [id]);

  async function loadPatient() {
    setLoading(true);
    setError('');
    try {
      const data = await getPatient(id);
      setPatient(data);
      
      // Patients can only view their own record
      if (user?.role === 'patient' && data?.HospitalID !== user.HospitalID) {
        setError('You do not have permission to view this patient record');
        setPatient(null);
        return;
      }
      
      if (data) {
        setForm({
          bloodType: data?.bloodType || '',
          medicalHistory: data?.medicalHistory || [],
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addHistoryEntry() {
    setForm((prev) => ({
      ...prev,
      medicalHistory: [...(prev.medicalHistory || []), ''],
    }));
  }

  function updateHistoryEntry(i, value) {
    setForm((prev) => {
      const arr = [...(prev.medicalHistory || [])];
      arr[i] = value;
      return { ...prev, medicalHistory: arr };
    });
  }

  function removeHistoryEntry(i) {
    setForm((prev) => ({
      ...prev,
      medicalHistory: (prev.medicalHistory || []).filter((_, idx) => idx !== i),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updatePatient(id, {
        bloodType: form.bloodType || undefined,
        medicalHistory: form.medicalHistory || [],
      });
      setPatient((prev) => ({ ...prev, ...form }));
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateSummary() {
    setError('');
    setGeneratingSummary(true);
    try {
      const { aiSummary } = await regenerateAiSummary(id);
      setPatient((prev) => (prev ? { ...prev, aiSummary } : null));
    } catch (err) {
      setError(err.message || 'Failed to generate AI summary');
    } finally {
      setGeneratingSummary(false);
    }
  }

  if (loading) {
    return (
      <motion.div
        className="loading loading-animated"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="loading-dots">Loading patient</span>
      </motion.div>
    );
  }

  const p = patient;
  if (!p) {
    return (
      <motion.div
        className="error-banner full-width"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {error || 'Patient not found'}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page patient-detail-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <motion.button
          type="button"
          className="btn btn-text"
          onClick={() => navigate(-1)}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {'< Back'}
        </motion.button>
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          Patient: {p.HospitalID || p._id}
        </motion.h1>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            className="error-banner full-width"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
      {editing ? (
        <motion.form
          key="edit"
          onSubmit={handleSubmit}
          className="patient-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <label>
            Blood Type
            <input
              type="text"
              name="bloodType"
              value={form.bloodType}
              onChange={handleChange}
              placeholder="e.g. O+, A-"
            />
          </label>
          <div className="form-group">
            <div className="form-group-header">
              <span>Medical History</span>
              <button type="button" className="btn btn-sm" onClick={addHistoryEntry}>
                + Add
              </button>
            </div>
            {(form.medicalHistory || []).map((entry, i) => (
              <div key={i} className="history-row">
                <input
                  type="text"
                  value={entry}
                  onChange={(e) => updateHistoryEntry(i, e.target.value)}
                  placeholder="Record entry"
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeHistoryEntry(i)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <motion.button
              type="button"
              className="btn"
              onClick={() => setEditing(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </motion.button>
          </div>
        </motion.form>
      ) : (
        <motion.div
          key="view"
          className="patient-detail-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="detail-row">
            <span className="label">Hospital ID</span>
            <span className="value">{p.HospitalID || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Blood Type</span>
            <span className="value">{p.bloodType || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Medical History</span>
            <span className="value">
              {p.medicalHistory?.length
                ? p.medicalHistory.map((e, i) => <div key={i}>{e}</div>)
                : 'None recorded'}
            </span>
          </div>
          {canViewAiSummary && (
            <div className="detail-row ai-summary-section">
              <span className="label">AI Summary</span>
              <div className="value">
                {p.aiSummary ? (
                  <p className="ai-summary-text">{p.aiSummary}</p>
                ) : (
                  <span className="text-muted">No AI summary yet.</span>
                )}
                <motion.button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleRegenerateSummary}
                  disabled={generatingSummary}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {generatingSummary ? 'Generating...' : p.aiSummary ? 'Regenerate' : 'Generate AI Summary'}
                </motion.button>
              </div>
            </div>
          )}
          {user?.role !== 'patient' && (
            <motion.button
              type="button"
              className="btn btn-primary"
              onClick={() => setEditing(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Edit
            </motion.button>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
