import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
