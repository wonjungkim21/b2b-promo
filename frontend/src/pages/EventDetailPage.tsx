import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import PointBalanceBadge from '../components/PointBalanceBadge';
import EventStatusBadge from '../components/EventStatusBadge';
import TopNav from '../components/TopNav';
import AppHeader from '../components/AppHeader';
import { useEventDetail } from '../features/events/useEventDetail';
import { useApplyEvent } from '../features/events/useApplyEvent';
import { useMe } from '../features/me/useMe';
import { getMaxApplyCount, getPlannedPoints, getRemainingPoints } from '../utils/pointCalc';

function parseCount(input: string): number | null {
  if (!/^\d+$/.test(input)) return null;
  const n = Number(input);
  if (n < 1) return null;
  return n;
}

function formatPeriod(startAt: string, endAt: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  return `${fmt(startAt)} ~ ${fmt(endAt)}`;
}

function EventDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { data: event, isLoading: eventLoading, isError: eventError } = useEventDetail(id);
  const { data: me } = useMe();
  const [countInput, setCountInput] = useState('1');
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const applyMutation = useApplyEvent(id);

  if (eventLoading) return <div>로딩중...</div>;
  if (eventError || !event) return <div>이벤트 정보를 불러오지 못했습니다.</div>;

  const pointBalance = me?.pointBalance ?? 0;
  const maxApplyCount = getMaxApplyCount(pointBalance);
  const isOngoing = event.status === '진행중';
  const isApplicable = isOngoing && maxApplyCount > 0;

  const parsedCount = parseCount(countInput);
  const isValidCount = parsedCount !== null;
  const exceedsMax = parsedCount !== null && parsedCount > maxApplyCount;
  const hasValidCount = isValidCount && !exceedsMax;

  const plannedPoints = isValidCount ? getPlannedPoints(parsedCount) : null;
  const remainingPoints = isValidCount ? getRemainingPoints(pointBalance, parsedCount) : null;

  function handleDecrement() {
    const current = parseCount(countInput) ?? 1;
    setCountInput(String(Math.max(1, current - 1)));
  }

  function handleIncrement() {
    const current = parseCount(countInput) ?? 0;
    setCountInput(String(current + 1));
  }

  // ponytail: count를 바꿔서 같은 키로 재시도하면 서버가 이전 성공 결과를 그대로 반환할 수 있는
  // 멱등키 설계 자체의 근본적 트레이드오프 — 필요시 count 변경 감지해 키 재생성 고려
  function handleApply() {
    if (parsedCount === null) return;
    if (!window.confirm('응모 후에는 취소할 수 없습니다. 응모하시겠습니까?')) return;
    applyMutation.mutate(
      { count: parsedCount, idempotencyKey: idempotencyKeyRef.current },
      {
        onSuccess: () => {
          idempotencyKeyRef.current = crypto.randomUUID();
        },
      },
    );
  }

  return (
    <div>
      <AppHeader />
      <div className="page-container">
        <TopNav backTo="/" />
        <PointBalanceBadge />

        <div className="event-detail">
          <section className="event-section">
            {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="event-section-image" />}
            <h1 className="event-section-title">
              {event.title} <EventStatusBadge status={event.status} />
            </h1>
            <div className="event-section-caption">기간 {formatPeriod(event.startAt, event.endAt)}</div>
          </section>

          {event.prizeDescription && (
            <section className="event-section">
              <h2 className="event-section-heading">경품/혜택</h2>
              <div>{event.prizeDescription}</div>
            </section>
          )}

          <section className="event-section">
            <h2 className="event-section-heading">응모 정보</h2>
            <div>최대 응모 가능 횟수: {maxApplyCount}회</div>

            {!isApplicable && (
              <div className="event-section-notice">
                {maxApplyCount === 0
                  ? '⚠ 포인트가 부족하여 응모할 수 없습니다.'
                  : '진행중인 이벤트만 응모할 수 있습니다.'}
              </div>
            )}

            <div className="event-count-stepper">
              <button type="button" onClick={handleDecrement} disabled={!isApplicable}>
                -
              </button>
              <input
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                disabled={!isApplicable}
              />
              <button type="button" onClick={handleIncrement} disabled={!isApplicable}>
                +
              </button>
            </div>

            {isApplicable && !isValidCount && (
              <div className="event-section-notice">응모 횟수는 1 이상의 정수여야 합니다.</div>
            )}
            {isApplicable && exceedsMax && (
              <div className="event-section-notice">최대 응모 가능 횟수를 초과했습니다.</div>
            )}

            <div>사용 예정 포인트: {plannedPoints !== null ? `${plannedPoints.toLocaleString()} P` : '-'}</div>
            <div>
              응모 후 잔여 포인트: {remainingPoints !== null ? `${remainingPoints.toLocaleString()} P` : '-'}
            </div>
          </section>

          <section className="event-section">
            <button
              type="button"
              className="event-apply-button"
              onClick={handleApply}
              disabled={!isApplicable || !hasValidCount || applyMutation.isPending}
            >
              응모 확정
            </button>
            {applyMutation.isError && <div className="event-section-notice">{applyMutation.error.message}</div>}
            {applyMutation.isSuccess && applyMutation.data && (
              <div>
                응모 완료! 누적 응모 횟수: {applyMutation.data.totalCount}회, 누적 사용 포인트:{' '}
                {applyMutation.data.totalPointsUsed.toLocaleString()} P
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
