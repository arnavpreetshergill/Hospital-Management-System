import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLogs } from '../api/api';

const ACTION_LABELS = {
  login: 'Login',
  signup: 'User Signup',
  patient_create: 'Patient Created',
  patient_update: 'Patient Updated',
  patient_delete: 'Patient Deleted',
  doctor_delete: 'Doctor Deleted',
  ai_summary_generated: 'AI Summary Generated',
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const params = filter ? { action: filter, limit: 200 } : { limit: 200 };
      const data = await getLogs(params);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <motion.div
        className="loading loading-animated"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="loading-dots">Loading logs</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page logs-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header logs-header">
        <h1>Activity Logs</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="logs-filter"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      {error && <div className="error-banner full-width">{error}</div>}
      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>User</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <motion.tr
                key={log._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="log-time">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td>
                  <span className={`log-action log-action-${log.action}`}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </td>
                <td>{log.userHospitalID || log.userRole || '-'}</td>
                <td className="log-details">
                  {log.details && typeof log.details === 'object'
                    ? JSON.stringify(log.details)
                    : log.details || '-'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length === 0 && !error && (
        <div className="empty-state">No logs found.</div>
      )}
    </motion.div>
  );
}
