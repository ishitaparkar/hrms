import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyLeavePage from '../MyLeavePage';
import axios from 'axios';

jest.mock('axios');

describe('MyLeavePage', () => {
  const mockLeaveData = {
    balances: [
      { leave_type: 'Casual', total: 12, used: 3, remaining: 9 }
    ],
    requests: [
      {
        id: 1,
        leave_type: 'Casual',
        start_date: '2025-12-01',
        end_date: '2025-12-03',
        days: 3,
        status: 'Approved'
      }
    ],
    holidays: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays leave balances', async () => {
    axios.get.mockResolvedValue({ data: mockLeaveData });

    render(
      <BrowserRouter>
        <MyLeavePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Casual/i)).toBeInTheDocument();
    });
  });
});
