import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signup } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    HospitalID: '',
    password: '',
    name: '',
    email: '',
    phoneNumber: '',
    role: 'patient', // Default role
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Calculate available roles based on the LOGGED IN user's role
  const availableRoles = [];
  if (user?.role === 'admin') {
    availableRoles.push('patient', 'doctor', 'admin');
  } else if (user?.role === 'doctor') {
    availableRoles.push('patient');
  } else {
    availableRoles.push('patient');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup({
        ...form,
        // Convert phoneNumber to Number if it exists
        phoneNumber: form.phoneNumber ? Number(form.phoneNumber) : undefined,
      });
      // Redirect to home or dashboard after successful creation
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="auth-card auth-card-wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1>Create New User</h1>
        <p className="auth-subtitle">
          {user?.role === 'admin' 
            ? "Admin Mode: Register staff or patients" 
            : "Doctor Mode: Register new patients"}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className="error-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-row">
            <label>
              Hospital ID
              <input
                type="text"
                name="HospitalID"
                value={form.HospitalID}
                onChange={handleChange}
                required
                placeholder="e.g. H001"
              />
            </label>

            <label>
              Role
              <select 
                name="role" 
                value={form.role} 
                onChange={handleChange}
              >
                {/* 2. Map through the filtered array to generate options */}
                {availableRoles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Full name"
            />
          </label>

          <div className="form-row">
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
              />
            </label>

            <label>
              Phone (optional)
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </label>
          </div>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Set password"
            />
          </label>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}