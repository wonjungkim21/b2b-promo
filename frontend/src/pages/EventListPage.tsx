import { Link } from 'react-router-dom';
import PointBalanceBadge from '../components/PointBalanceBadge';
import EventCard from '../components/EventCard';
import TopNav from '../components/TopNav';
import AppHeader from '../components/AppHeader';
import { useEventList } from '../features/events/useEventList';

function EventListPage() {
  const { data: events, isLoading, isError } = useEventList();

  return (
    <div>
      <AppHeader />
      <div className="page-container">
        <TopNav />
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
              <Link key={event.id} to={`/events/${event.id}`}>
                <EventCard
                  title={event.title}
                  startAt={event.startAt}
                  endAt={event.endAt}
                  status={event.status}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventListPage;
