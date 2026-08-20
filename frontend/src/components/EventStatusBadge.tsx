export type EventStatus = '예정' | '진행중' | '종료';

const STATUS_STYLES: Record<EventStatus, React.CSSProperties> = {
  진행중: { backgroundColor: '#416922', color: '#fff' },
  예정: { backgroundColor: '#E7EEDD', color: '#2F4E19' },
  종료: { backgroundColor: '#E5E5E1', color: '#767676' },
};

function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      style={{
        ...STATUS_STYLES[status],
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

export default EventStatusBadge;
