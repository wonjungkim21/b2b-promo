import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function AppHeader() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="app-header">
      <Link to={role === 'admin' ? '/admin' : '/'} className="app-header-brand">
        <img src="/logo.png" alt="FreshMeal" />
        <span>FreshMeal</span>
      </Link>
      <div className="app-header-actions">
        {role === 'user' && (
          <Link to="/my-applications" className="app-header-icon" aria-label="내 응모 내역">
            🧾
          </Link>
        )}
        {role && (
          <button type="button" className="app-header-logout" onClick={handleLogout}>
            로그아웃
          </button>
        )}
      </div>
    </div>
  );
}

export default AppHeader;
