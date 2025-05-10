import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Profile from '../pages/Profile';
import * as supabaseClient from '../integrations/supabase/client';

// Mock supabase client
jest.mock('../integrations/supabase/client', () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
      })),
    },
  };
});

describe('Profile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search results and navigates to user profile', async () => {
    const mockUsers = [
      { id: 'user1', username: 'harsha_143', full_name: 'Harsha' },
      { id: 'user2', username: 'harsha_144', full_name: 'Harsha Two' },
    ];

    // Mock supabase response for search
    supabaseClient.supabase.from().select().ilike.mockReturnValueOnce({
      data: mockUsers,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/profile?search=harsha']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
    });

    // Check that user links are rendered
    expect(screen.getByText(/Harsha/i)).toBeInTheDocument();
    expect(screen.getByText(/Harsha Two/i)).toBeInTheDocument();

    // Simulate clicking on a user link
    fireEvent.click(screen.getByText(/Harsha/i));

    // The URL should update to /profile/user1 and profile should load
    await waitFor(() => {
      expect(window.location.pathname).toBe('/profile/user1');
    });
  });

  test('shows user not found message for invalid username', async () => {
    // Mock supabase response for no users found
    supabaseClient.supabase.from().select().ilike.mockReturnValueOnce({
      data: [],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/profile?search=nonexistentuser']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for not found message
    await waitFor(() => {
      expect(screen.getByText(/User not found/i)).toBeInTheDocument();
    });
  });
});
