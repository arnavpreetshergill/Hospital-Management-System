import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { hospitalId, logout, isAdmin, isDoctor, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <motion.header
        className="header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/" className="logo-link">
          <span className="logo">HM</span>
          <span>Hospital Management</span>
        </Link>
        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Patients
          </NavLink>
          {isAdmin && (
            <NavLink to="/doctors" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Doctors
            </NavLink>
          )}
          {(isAdmin || isDoctor) && (
            <NavLink to="/signup" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              New User
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/logs" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Logs
            </NavLink>
          )}
        </nav>
        <div className="header-user">
          <span className="user-role">{user?.role || 'staff'}</span>
          <span className="user-id">{hospitalId}</span>
          <motion.button
            type="button"
            className="btn btn-text"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </motion.header>
      <motion.main
        className="main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.1 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
