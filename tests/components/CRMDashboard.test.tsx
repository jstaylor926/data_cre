import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { email: 'test@example.com' },
    session: {},
    authModalOpen: false,
    openAuthModal: vi.fn(),
    closeAuthModal: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { CRMDashboard } from '@/components/crm/CRMDashboard';

describe('CRMDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [],
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the projects list', async () => {
    render(<CRMDashboard />);
    expect(await screen.findByText(/Firm Projects/i)).toBeDefined();
  });
});
