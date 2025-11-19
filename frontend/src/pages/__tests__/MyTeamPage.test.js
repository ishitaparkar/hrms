import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyTeamPage from '../MyTeamPage';
import axios from 'axios';

jest.mock('axios');

describe('MyTeamPage', () => {
  const mockTeamData = {
    manager: {
      id: 1,
      first_name: 'John',
      last_name: 'Manager',
      designation: 'Senior Manager',
      email: 'john@example.com'
    },
    department: 'Engineering',
    team_members: [
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Developer',
        designation: 'Developer',
        email: 'jane@example.com'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays team members when loaded', async () => {
    axios.get.mockResolvedValue({ data: mockTeamData });

    render(
      <BrowserRouter>
        <MyTeamPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Engineering/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no team members', async () => {
    axios.get.mockResolvedValue({ 
      data: { ...mockTeamData, team_members: [] } 
    });

    render(
      <BrowserRouter>
        <MyTeamPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No team members found/i)).toBeInTheDocument();
    });
  });
});
