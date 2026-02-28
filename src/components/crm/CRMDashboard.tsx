"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, Plus, Search, Filter, LayoutGrid, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Project } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';

function parseErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return fallback;
}

function createOrgSlug(): string {
  return `atlas-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`;
}

export const CRMDashboard = () => {
  const { status: authStatus, openAuthModal } = useAuth();
  const isAuthenticated = authStatus === "authenticated";
  const authRequired = authStatus === "unauthenticated";
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setProjects([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/projects', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(parseErrorMessage(payload, 'Failed to load projects.'));
      }

      const rows = Array.isArray(payload) ? payload : [];
      setProjects(rows as Project[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authStatus === "loading") {
      setLoading(true);
      return;
    }
    void loadProjects();
  }, [authStatus, loadProjects]);

  const ensureOrganizationId = useCallback(async (): Promise<string> => {
    const existingRes = await fetch('/api/crm/organizations', { cache: 'no-store' });
    const existingPayload = await existingRes.json().catch(() => null);
    if (!existingRes.ok) {
      throw new Error(parseErrorMessage(existingPayload, 'Failed to load organizations.'));
    }

    const orgs = Array.isArray(existingPayload) ? existingPayload : [];
    if (orgs.length > 0 && typeof orgs[0]?.id === "string") {
      return orgs[0].id;
    }

    const bootstrapName = 'Default Organization';
    const createRes = await fetch('/api/crm/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: bootstrapName,
        slug: createOrgSlug(),
      }),
    });
    const createPayload = await createRes.json().catch(() => null);
    if (!createRes.ok || !createPayload?.id) {
      throw new Error(parseErrorMessage(createPayload, 'Failed to create organization.'));
    }

    return createPayload.id as string;
  }, []);

  const handleCreateProject = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setCreating(true);
    setError(null);

    try {
      const orgId = await ensureOrganizationId();
      const projectName = `Project ${projects.length + 1}`;

      const res = await fetch('/api/crm/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          name: projectName,
          description: null,
          status: 'active',
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseErrorMessage(payload, 'Failed to create project.'));
      }

      setProjects((prev) => [payload as Project, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  }, [ensureOrganizationId, isAuthenticated, openAuthModal, projects.length]);

  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(term) ||
      (project.description ?? "").toLowerCase().includes(term)
    );
  }, [projects, query]);

  const renderEmptyState = (
    <Card className="bg-ink2 border-line2 border-dashed flex flex-col items-center justify-center p-12 text-center h-[240px]">
      <div className="h-12 w-12 rounded-full bg-ink3 border border-line2 flex items-center justify-center text-pd-muted mb-4">
        <Briefcase size={24} />
      </div>
      <h3 className="text-white font-medium mb-1">No Projects Found</h3>
      <p className="text-xs text-pd-muted max-w-[220px]">
        Create your first project to start tracking deals, tasks, and parcel notes.
      </p>
      <Button
        onClick={handleCreateProject}
        disabled={creating}
        className="mt-4 bg-pd-teal hover:bg-pd-teal/90 text-ink font-semibold"
      >
        {creating ? 'Creating...' : 'Create First Project'}
      </Button>
    </Card>
  );

  if (authRequired) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line2 text-pd-muted">
          <Briefcase size={18} />
        </div>
        <p className="text-[13px] text-text">Sign in to access CRM projects</p>
        <p className="max-w-xs font-mono text-[10px] text-pd-muted">
          Projects, tasks, and notes are organization-scoped and require authentication.
        </p>
        <button
          onClick={openAuthModal}
          className="rounded border border-teal bg-teal-dim px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-teal transition-colors hover:bg-teal/20"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-ink p-6 overflow-y-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-head text-white tracking-wider flex items-center gap-3">
            <Briefcase className="text-pd-teal" />
            Firm Projects
          </h1>
          <p className="text-[13px] text-pd-muted font-barlow mt-1">
            Manage your organization&apos;s property deals and tasks.
          </p>
        </div>
        
        <Button
          onClick={handleCreateProject}
          disabled={creating}
          className="bg-pd-teal hover:bg-pd-teal/90 text-ink font-semibold flex items-center gap-2"
        >
          {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {creating ? 'Creating...' : 'New Project'}
        </Button>
      </header>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pd-muted" size={16} />
          <Input 
            className="pl-10 bg-ink2 border-line2 text-text text-sm focus:ring-pd-teal"
            placeholder="Search projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="flex border border-line2 rounded-md overflow-hidden">
          <button 
            onClick={() => setView('grid')}
            className={`p-2 transition-colors ${view === 'grid' ? 'bg-ink3 text-pd-teal' : 'bg-ink2 text-pd-muted'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setView('list')}
            className={`p-2 transition-colors ${view === 'list' ? 'bg-ink3 text-pd-teal' : 'bg-ink2 text-pd-muted'}`}
          >
            <List size={18} />
          </button>
        </div>
        
        <Button variant="outline" className="border-line2 bg-ink2 text-text flex items-center gap-2">
          <Filter size={16} />
          Filter (Soon)
        </Button>
      </div>

      {error && (
        <div className="mb-5 rounded border border-red/30 bg-red-dim/20 p-3 text-xs text-red">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-[260px] items-center justify-center text-pd-muted">
          <Loader2 className="mr-2 animate-spin" size={16} />
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        renderEmptyState
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="bg-ink2 border-line2 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-bright">{project.name}</h3>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-pd-muted">
                    {project.status}
                  </p>
                </div>
                <span className="rounded border border-line2 bg-ink3 px-2 py-1 text-[10px] text-mid">
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-mid">
                {project.description || 'No description added yet.'}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded border border-line2 bg-ink2 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-bright">{project.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-pd-muted">
                  {project.status}
                </p>
              </div>
              <div className="text-xs text-mid">
                {new Date(project.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="mt-5 rounded border border-line2 bg-ink2 px-3 py-2 text-[11px] text-pd-muted">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      )}
    </div>
  );
};
