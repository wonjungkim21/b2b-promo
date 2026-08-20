import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from './EventCard';

describe('EventCard', () => {
  it('제목, 상태 배지, 기간을 렌더링한다', () => {
    render(
      <EventCard
        title="여름 특가 이벤트"
        startAt="2026-07-01T00:00:00Z"
        endAt="2026-08-31T00:00:00Z"
        status="진행중"
      />,
    );

    expect(screen.getByText('여름 특가 이벤트')).toBeInTheDocument();
    expect(screen.getByText('진행중')).toBeInTheDocument();
    expect(screen.getByText(/07\.0[12]/)).toBeInTheDocument();
    expect(screen.getByText(/08\.3[01]/)).toBeInTheDocument();
  });
});
