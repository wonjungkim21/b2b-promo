import { useParams } from 'react-router-dom';
import { useEventDetail } from '../../features/events/useEventDetail';
import { useEventApplicationSummary } from '../../features/adminEvents/useEventApplicationSummary';
import EventStatusBadge from '../../components/EventStatusBadge';
import TopNav from '../../components/TopNav';
import AppHeader from '../../components/AppHeader';

function formatPeriod(startAt: string, endAt: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  return `${fmt(startAt)} ~ ${fmt(endAt)}`;
}

function AdminEventStatsPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: event } = useEventDetail(id);
  const { data: summary, isLoading, isError } = useEventApplicationSummary(id);

  return (
    <div>
      <AppHeader />
      <div className="page-container">
        <TopNav backTo="/admin" />

        <div className="event-detail">
          {event && (
            <section className="event-section">
              <h1 className="event-section-title">
                {event.title} <EventStatusBadge status={event.status} />
              </h1>
              <div className="event-section-caption">기간 {formatPeriod(event.startAt, event.endAt)}</div>
            </section>
          )}

          <section className="event-section">
            <h2 className="event-section-heading">응모 현황</h2>

            {isLoading && <div>로딩중...</div>}
            {isError && <div>응모 현황을 불러오지 못했습니다.</div>}

            {!isLoading && !isError && summary && (
              <div className="admin-stat-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-label">전체 응모 횟수</div>
                  <div className="admin-stat-value">{summary.totalApplyCount}회</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">참여 사용자 수</div>
                  <div className="admin-stat-value">{summary.participantCount}명</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminEventStatsPage;
