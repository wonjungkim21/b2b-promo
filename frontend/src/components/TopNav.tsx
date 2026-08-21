import { useNavigate } from 'react-router-dom';

interface TopNavProps {
  backTo?: string;
}

function TopNav({ backTo }: TopNavProps) {
  const navigate = useNavigate();

  if (!backTo) return null;

  return (
    <div className="top-nav">
      <button type="button" className="top-nav-back" onClick={() => navigate(backTo)}>
        {'← 뒤로'}
      </button>
    </div>
  );
}

export default TopNav;
