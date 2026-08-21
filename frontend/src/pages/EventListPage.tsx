import PointBalanceBadge from '../components/PointBalanceBadge';
import EventCard from '../components/EventCard';
import AppHeader from '../components/AppHeader';
import { useEventList } from '../features/events/useEventList';

function EventListPage() {
  const { data: events, isLoading, isError } = useEventList();

  return (
    <div>
      <AppHeader />
      <div className="page-container">
        <header>
          <PointBalanceBadge />
        </header>

        {isLoading && <div>로딩중...</div>}
        {isError && <div>이벤트 목록을 불러오지 못했습니다.</div>}
        {!isLoading && !isError && events && events.length === 0 && (
          <div>표시할 이벤트가 없습니다.</div>
        )}

        {!isLoading && !isError && events && events.length > 0 && (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                startAt={event.startAt}
                endAt={event.endAt}
                status={event.status}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventListPage;
