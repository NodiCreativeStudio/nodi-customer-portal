# Admin Panel Implementation Plan

This is a large, multi-page feature. Below is the scope I'll implement, plus a few open questions before I start building.

## Scope

### New Pages
1. **`/admin`** — Dashboard with 4 metric cards (Clients, Active Projects, MRR, Onboarding Rate), 3 charts (Revenue trend 12mo, Industry distribution, Project status), Recent Activity feed, Quick Actions.
2. **`/admin/clients`** — Sortable/filterable/paginated table, Add/Edit/Delete modals, search, status filter.
3. **`/admin/clients/:id`** — Already exists (`AdminClientDetail.tsx`); I'll enhance it with stats, projects list, services, activity timeline.
4. **`/admin/revenue`** — MRR/ARR cards, revenue trend chart, revenue-by-service bar chart, upcoming renewals table with CSV export.
5. **`/admin/analytics`** — User metrics, growth chart, onboarding funnel, service adoption, date-range table with CSV export.
6. **`/admin/config`** — Tabs for Contact Info, FAQs, Email/Notifications, System Logs.

### Database changes (one migration)
- New `agency_config` table (single-row config: contact name/email/phone, WhatsApp, Calendly, hours, support email/phone, email toggles, sender email).
- New `agency_faqs` table (question, answer, sort_order).
- New `activity_log` table (user_id, client_id, action, entity_type, entity_id, metadata, created_at) + triggers on `clients`, `projects`, `uploads`, `profiles.onboarding_completed` to populate it.
- RLS: admin-only write; admin-only read for logs; `agency_config`/`agency_faqs` readable by all authenticated users (so client-facing Contacts page can use them later).

### Shared infrastructure
- `src/hooks/useAdminMetrics.ts`, `useAdminClients.ts`, `useAdminRevenue.ts`, `useAdminAnalytics.ts`, `useAdminActivityFeed.ts` — React Query hooks.
- `src/lib/csv-export.ts` — generic CSV download utility.
- Sidebar: add Admin sub-section (Dashboard, Clients, Revenue, Analytics, Settings) visible only to admins. Existing single "Admin" link is replaced.
- Charts: use existing `recharts` (already a dep via `@/components/ui/chart`).

### Out of scope (not requested or impractical)
- Real "active users last 30d" / per-page usage / activity heatmap — Supabase auth doesn't expose `last_sign_in_at` to anon clients and we don't track page views. I'll show **onboarded vs pending**, **signups over time** (from `profiles.created_at`), and **service adoption** (real). The heatmap and per-page usage will be **omitted** unless you want me to add a `page_views` tracking table (extra scope).
- Invoice History (you marked optional) — skipped.
- Drag-drop FAQ reorder — I'll use up/down arrow buttons (simpler, same outcome).
- Email sending toggles will be persisted but not wired to an actual email sender (no edge function for emails exists).

## Technical notes
- All admin pages wrapped in existing `AdminGuard`.
- Use design tokens from `index.css` — no hard-coded hex. The colors you listed (#1a73e8 etc.) will map to existing semantic tokens (`primary`, `success`-style accents). If you want those exact hex values, I'll add them as new tokens.
- i18n: I'll add English/Italian keys for new strings under `admin.*`.
- All money formatted as EUR.

## Open questions

1. **Activity tracking**: OK to add an `activity_log` table + triggers to power the Recent Activity feed? Without it, the feed would have to be faked by unioning `created_at` from multiple tables (works but limited — no "file uploaded by X" detail across users).
2. **Page-view analytics & heatmap**: skip these (recommended), or add a `page_views` table that the app writes to on every route change?
3. **Color tokens**: keep your existing theme palette, or add the exact hex values you listed (#1a73e8 blue, #27ae60 green, #f39c12 orange, #e74c3c red) as new semantic tokens?

Reply with answers (or "go with your defaults") and I'll execute.
