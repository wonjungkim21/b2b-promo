import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface TopNavProps {
  backTo?: string;
}

function TopNav({ backTo }: TopNavProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="top-nav">
      {backTo ? (
        <button type="button" className="top-nav-back" onClick={() => navigate(backTo)}>
          {'← 뒤로'}
        </button>
      ) : (
        <span />
      )}
      <button type="button" className="top-nav-logout" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}

export default TopNav;
