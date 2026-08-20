import { describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import EventStatusBadge, { type EventStatus } from './EventStatusBadge';

describe('EventStatusBadge', () => {
  it.each<EventStatus>(['진행중', '예정', '종료'])('status=%s 텍스트가 보인다', (status) => {
    render(<EventStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it('세 상태의 배경색은 서로 다르다', () => {
    const colors = new Set<string>();
    (['진행중', '예정', '종료'] as EventStatus[]).forEach((status) => {
      cleanup();
      render(<EventStatusBadge status={status} />);
      const el = screen.getByText(status);
      colors.add(el.style.backgroundColor);
    });
    expect(colors.size).toBe(3);
  });
});
