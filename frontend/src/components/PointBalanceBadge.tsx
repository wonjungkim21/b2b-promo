import { useMe } from '../features/me/useMe';

function PointBalanceBadge() {
  const { data, isLoading, isError } = useMe();

  if (isLoading) return <span>...</span>;
  if (isError || !data) return null;

  return (
    <div className="point-balance">
      보유 포인트 <span className="point-balance-value">{data.pointBalance.toLocaleString()} P</span>
    </div>
  );
}

export default PointBalanceBadge;
