import EventStatusBadge, { type EventStatus } from './EventStatusBadge';

interface EventCardProps {
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

function EventCard({ title, startAt, endAt, status }: EventCardProps) {
  return (
    <div className="event-card">
      <EventStatusBadge status={status} />
      <div>{title}</div>
      <div>
        {formatDate(startAt)} ~ {formatDate(endAt)}
      </div>
    </div>
  );
}

export default EventCard;
