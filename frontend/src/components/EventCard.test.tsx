import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventCard from './EventCard';

describe('EventCard', () => {
  it('제목, 상태 배지, 기간, 상세보기 버튼을 렌더링한다', () => {
    render(
      <MemoryRouter>
        <EventCard
          id={1}
          title="여름 특가 이벤트"
          startAt="2026-07-01T00:00:00Z"
          endAt="2026-08-31T00:00:00Z"
          status="진행중"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('여름 특가 이벤트')).toBeInTheDocument();
    expect(screen.getByText('진행중')).toBeInTheDocument();
    expect(screen.getByText(/07\.0[12]/)).toBeInTheDocument();
    expect(screen.getByText(/08\.3[01]/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '상세보기' })).toHaveAttribute('href', '/events/1');
  });
});
