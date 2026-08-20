import { useMe } from '../features/me/useMe';

function PointBalanceBadge() {
  const { data, isLoading, isError } = useMe();

  if (isLoading) return <span>...</span>;
  if (isError || !data) return null;

  return <span>보유 포인트 {data.pointBalance.toLocaleString()} P</span>;
}

export default PointBalanceBadge;
