# Track Specification: Firm Intelligence Platform Core Architecture

## Description
Implement the core architecture for Phase 4: Firm Intelligence Platform, including CRM integrations, multi-tenancy support, and proprietary site scoring based on firm-specific outcomes.

## Goals
- **Multi-Tenancy:** Establish a robust organizational structure in Supabase to support white-label multi-tenancy.
- **CRM Integration:** Build the foundation for tracking deal lifecycles, tasks, and historical firm data associated with parcels.
- **Proprietary Scoring:** Develop the first iteration of an ML scoring engine trained on firm-specific outcomes using RAG-based context.

## Tech Stack
- **Next.js 16:** App Router and Server Components.
- **Supabase:** PostgreSQL for multi-tenant data and PostGIS for spatial context.
- **Anthropic Claude:** For generating proprietary deal narratives and scoring insights.
