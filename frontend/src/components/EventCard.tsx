import { Link } from 'react-router-dom';
import EventStatusBadge, { type EventStatus } from './EventStatusBadge';

interface EventCardProps {
  id: number;
  title: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

function EventCard({ id, title, startAt, endAt, status }: EventCardProps) {
  return (
    <div className="event-card">
      <EventStatusBadge status={status} />
      <div className="event-card-title">{title}</div>
      <div className="event-card-period">
        {formatDate(startAt)} ~ {formatDate(endAt)}
      </div>
      <Link to={`/events/${id}`} className="event-card-detail-button">
        상세보기
      </Link>
    </div>
  );
}

export default EventCard;
