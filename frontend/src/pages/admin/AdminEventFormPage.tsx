import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventDetail } from '../../features/events/useEventDetail';
import { useCreateEvent } from '../../features/adminEvents/useCreateEvent';
import { useUpdateEvent } from '../../features/adminEvents/useUpdateEvent';
import type { EventStatus } from '../../components/EventStatusBadge';
import TopNav from '../../components/TopNav';
import AppHeader from '../../components/AppHeader';

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminEventFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const isEdit = params.id !== undefined;
  const eventId = isEdit ? Number(params.id) : NaN;

  const { data: existingEvent } = useEventDetail(eventId);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent(eventId);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [status, setStatus] = useState<EventStatus>('예정');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && existingEvent) {
      setTitle(existingEvent.title);
      setImageUrl(existingEvent.imageUrl ?? '');
      setStartAt(toDatetimeLocalValue(existingEvent.startAt));
      setEndAt(toDatetimeLocalValue(existingEvent.endAt));
      setPrizeDescription(existingEvent.prizeDescription ?? '');
    }
  }, [isEdit, existingEvent]);

  const mutation = isEdit ? updateMutation : createMutation;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !startAt || !endAt) {
      setValidationError('이벤트명/기간은 필수입니다.');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setValidationError('종료일시는 시작일시보다 이후여야 합니다.');
      return;
    }
    setValidationError(null);

    const payload = {
      title: title.trim(),
      imageUrl: imageUrl.trim() || null,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      prizeDescription: prizeDescription.trim() || null,
    };

    if (isEdit) {
      updateMutation.mutate(payload, { onSuccess: () => navigate('/admin') });
    } else {
      createMutation.mutate({ ...payload, status }, { onSuccess: () => navigate('/admin') });
    }
  }

  return (
    <div>
      <AppHeader />
      <div className="page-container">
      <TopNav backTo="/admin" />
      <h1>{isEdit ? '이벤트 수정' : '이벤트 등록'}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          이벤트명 *
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          이미지 URL(선택)
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </label>
        <label>
          시작일시 *
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </label>
        <label>
          종료일시 *
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </label>
        {!isEdit && (
          <fieldset>
            <legend>상태 *</legend>
            {(['예정', '진행중', '종료'] as const).map((s) => (
              <label key={s}>
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                />
                {s}
              </label>
            ))}
          </fieldset>
        )}
        <label>
          경품/혜택(선택)
          <input value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} />
        </label>

        {validationError && <div>{validationError}</div>}
        {mutation.isError && <div>{mutation.error.message}</div>}

        <button type="button" onClick={() => navigate('/admin')}>
          취소
        </button>
        <button type="submit" disabled={mutation.isPending}>
          저장
        </button>
      </form>
      </div>
    </div>
  );
}

export default AdminEventFormPage;
