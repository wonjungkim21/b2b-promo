import { useParams } from 'react-router-dom';
import { useEventDetail } from '../../features/events/useEventDetail';
import { useEventApplicationSummary } from '../../features/adminEvents/useEventApplicationSummary';
import TopNav from '../../components/TopNav';
import AppHeader from '../../components/AppHeader';

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
        <header>
          <h1>{event ? `${event.title} - 응모 현황` : '응모 현황'}</h1>
        </header>

        {isLoading && <div>로딩중...</div>}
        {isError && <div>응모 현황을 불러오지 못했습니다.</div>}

        {!isLoading && !isError && summary && (
          <div>
            <div>전체 응모 횟수: {summary.totalApplyCount}회</div>
            <div>참여 사용자 수: {summary.participantCount}명</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminEventStatsPage;
