import { Link } from 'react-router-dom';
import EventStatusBadge, { type EventStatus } from '../../components/EventStatusBadge';
import TopNav from '../../components/TopNav';
import AppHeader from '../../components/AppHeader';
import { useAdminEvents } from '../../features/adminEvents/useAdminEvents';
import { useUpdateEventStatus } from '../../features/adminEvents/useUpdateEventStatus';

const NEXT_STATUS: Record<EventStatus, EventStatus | null> = {
  예정: '진행중',
  진행중: '종료',
  종료: null,
};

function formatPeriod(startAt: string, endAt: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  return `${fmt(startAt)} ~ ${fmt(endAt)}`;
}

function AdminEventListPage() {
  const { data: events, isLoading, isError } = useAdminEvents();
  const statusMutation = useUpdateEventStatus();

  return (
    <div>
      <AppHeader />
      <div className="page-container">
        <TopNav />
        <header>
          <h1>이벤트 관리</h1>
          <Link to="/admin/events/new">+ 이벤트 등록</Link>
        </header>

      {isLoading && <div>로딩중...</div>}
      {isError && <div>이벤트 목록을 불러오지 못했습니다.</div>}
      {statusMutation.isError && <div>{statusMutation.error.message}</div>}

      {!isLoading && !isError && events && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>이벤트명</th>
              <th>기간</th>
              <th>상태</th>
              <th>응모현황</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const nextStatus = NEXT_STATUS[event.status];
              return (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{formatPeriod(event.startAt, event.endAt)}</td>
                  <td>
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td>
                    <Link to={`/admin/events/${event.id}/stats`}>보기 &gt;</Link>
                  </td>
                  <td>
                    <Link to={`/admin/events/${event.id}/edit`}>수정</Link>
                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ id: event.id, status: nextStatus })}
                        disabled={statusMutation.isPending}
                      >
                        {nextStatus}로 변경
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
}

export default AdminEventListPage;
