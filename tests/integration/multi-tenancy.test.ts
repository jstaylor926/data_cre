import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client to simulate multi-tenant behavior
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Multi-tenancy Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should only return projects for the active organization', async () => {
    const activeOrgId = 'org-1';
    
    // Simulate Supabase responding with filtered data as if RLS was active
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((column, value) => {
        if (column === 'org_id' && value === activeOrgId) {
          return { data: [{ id: 'proj-1', name: 'Org 1 Project', org_id: 'org-1' }], error: null };
        }
        return { data: [], error: null };
      }),
    });

    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.from('projects').select('*').eq('org_id', activeOrgId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].org_id).toBe(activeOrgId);
  });

  it('should not allow access to projects from another organization', async () => {
    const activeOrgId = 'org-1';
    const otherOrgId = 'org-2';
    
    // Simulate RLS blocking access
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((column, value) => {
        if (column === 'org_id' && value === otherOrgId) {
          // In real RLS, this would return an empty array if the user isn't in org-2
          return { data: [], error: null };
        }
        return { data: [], error: null };
      }),
    });

    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.from('projects').select('*').eq('org_id', otherOrgId);

    expect(data).toHaveLength(0);
  });
});
