"use client";

import React, { useState } from 'react';
import { Briefcase, Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const CRMDashboard = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="flex flex-col h-full bg-ink p-6 overflow-y-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bebas text-white tracking-wider flex items-center gap-3">
            <Briefcase className="text-pd-teal" />
            Firm Projects
          </h1>
          <p className="text-[13px] text-pd-muted font-barlow mt-1">
            Manage your organization's property deals and tasks.
          </p>
        </div>
        
        <Button className="bg-pd-teal hover:bg-pd-teal/90 text-ink font-semibold flex items-center gap-2">
          <Plus size={18} />
          New Project
        </Button>
      </header>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pd-muted" size={16} />
          <Input 
            className="pl-10 bg-ink2 border-line2 text-text text-sm focus:ring-pd-teal"
            placeholder="Search projects..."
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
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty state or Placeholder cards */}
        <Card className="bg-ink2 border-line2 border-dashed flex flex-col items-center justify-center p-12 text-center h-[240px]">
          <div className="h-12 w-12 rounded-full bg-ink3 border border-line2 flex items-center justify-center text-pd-muted mb-4">
            <Briefcase size={24} />
          </div>
          <h3 className="text-white font-medium mb-1">No Projects Found</h3>
          <p className="text-xs text-pd-muted max-w-[200px]">
            Get started by creating your first organizational project.
          </p>
        </Card>
      </div>
    </div>
  );
};
