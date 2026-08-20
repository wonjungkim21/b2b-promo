import { Link } from 'react-router-dom';
import { useMyApplications } from '../features/applications/useMyApplications';
import EventStatusBadge from '../components/EventStatusBadge';

function formatAppliedAt(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${min}`;
}

function MyApplicationsPage() {
  const { data: applications, isLoading, isError } = useMyApplications();

  return (
    <div className="page-container">
      <Link to="/">{'< 뒤로'}</Link>
      <h1>내 응모 내역</h1>

      {isLoading && <div>로딩중...</div>}
      {isError && <div>응모 내역을 불러오지 못했습니다.</div>}
      {!isLoading && !isError && applications && applications.length === 0 && (
        <div>응모 내역이 없습니다.</div>
      )}

      {!isLoading && !isError && applications && applications.length > 0 && (
        <div>
          {applications.map((item) => (
            <div key={item.eventId} className="event-card">
              <div>
                {item.eventTitle} <EventStatusBadge status={item.eventStatus} />
              </div>
              <div>누적 응모: {item.totalCount}회</div>
              <div>누적 사용 포인트: {item.totalPointsUsed.toLocaleString()} P</div>
              <div>최근 응모일: {formatAppliedAt(item.lastAppliedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyApplicationsPage;
