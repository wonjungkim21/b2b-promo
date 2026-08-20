import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function AppHeader() {
  const role = useAuthStore((state) => state.role);

  return (
    <div className="app-header">
      <Link to={role === 'admin' ? '/admin' : '/'} className="app-header-brand">
        <img src="/logo.png" alt="FreshMeal" />
        <span>FreshMeal</span>
      </Link>
      {role === 'user' && (
        <Link to="/my-applications" className="app-header-icon" aria-label="내 응모 내역">
          🧾
        </Link>
      )}
    </div>
  );
}

export default AppHeader;
