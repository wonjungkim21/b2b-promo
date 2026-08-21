import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TopNav from './TopNav';

describe('TopNav', () => {
  it('backTo가 주어지면 클릭 시 해당 경로로 이동한다', () => {
    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/1" element={<TopNav backTo="/" />} />
          <Route path="/" element={<div>홈 화면</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '← 뒤로' }));

    expect(screen.getByText('홈 화면')).toBeInTheDocument();
  });

  it('backTo가 없으면 뒤로가기 버튼이 보이지 않는다', () => {
    render(
      <MemoryRouter initialEntries={['/current']}>
        <Routes>
          <Route path="/current" element={<TopNav />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: '← 뒤로' })).not.toBeInTheDocument();
  });

  it('backTo가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/current']}>
        <Routes>
          <Route path="/current" element={<TopNav />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
