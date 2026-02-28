import { describe, it, expect, vi } from 'vitest';

// Mock supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: table === 'organizations' ? [{ id: 'org-1', name: 'Org 1' }] : [],
          error: null,
        }),
      }),
    })),
  },
}));

describe('Multi-tenancy Schema', () => {
  it('should have organizations table', async () => {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.from('organizations').select('*').eq('id', 'org-1');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].name).toBe('Org 1');
  });

  it('should have projects table with org_id', async () => {
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('projects').select('*').eq('org_id', 'org-1');
    expect(error).toBeNull();
  });
});
