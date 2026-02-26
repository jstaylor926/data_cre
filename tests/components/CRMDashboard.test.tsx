import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CRMDashboard } from '@/components/crm/CRMDashboard';

describe('CRMDashboard', () => {
  it('should render the projects list', () => {
    render(<CRMDashboard />);
    expect(screen.getByText(/Firm Projects/i)).toBeDefined();
  });
});
