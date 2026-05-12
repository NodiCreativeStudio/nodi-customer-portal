
# Academy Nodi — Piano di Implementazione

Sezione formazione con corsi per verticale (Retail/Wellness/Repair/Condiviso), lezioni PDF (Supabase Storage) e Video (YouTube embed), tracking visualizzazioni/completamenti, certificati PDF generati al completamento, e back-office admin completo.

## 1. Database & Storage (migration)

**Enums**
- `academy_verticale`: retail, wellness, repair, shared
- `academy_status`: draft, published, archived
- `academy_lesson_status`: draft, scheduled, published, archived
- `academy_content_type`: pdf, video

**Tabelle**
- `academy_courses` — title, description, verticale, cover_image_path, order_index, status, prerequisites, total_duration_minutes, created_by
- `academy_lessons` — course_id, title, description, lesson_number, content_type, content_url (storage path o YouTube ID), duration_minutes, is_downloadable, published_at, status, tags[]
- `academy_lesson_access` — client_id, lesson_id, viewed_at, completed_at, download_count, video_progress_percent, last_accessed_at (UNIQUE client+lesson)
- `academy_course_completion` — client_id, course_id, completed_at, certificate_path, certificate_generated_at (UNIQUE client+course)

**View**: `academy_course_progress` (totale lezioni, completate, % progresso, completion flag).

**RLS**
- Admin: gestione totale (has_role admin)
- Corsi/Lezioni: lettura authenticated solo se `status='published'` AND verticale = verticale-cliente OR `shared`. La verticale del cliente si ricava dal record `onboarding_moduli.verticale` legato a `current_user_company()`. Helper `current_user_verticale()` security definer.
- `academy_lesson_access` / `academy_course_completion`: lettura/scrittura solo per il proprio `client_id`, admin tutto.

**Storage bucket**: `academy-lessons` (private)
- Path: `pdf/{course_id}/...pdf`, `covers/{course_id}/...`, `certificates/{client_id}/...`
- Policy admin: full
- Policy client lettura `pdf/...`: join con lessons → check verticale
- Policy client lettura `certificates/{client_id}/...`: solo proprio client_id

## 2. Frontend Cliente

- `/academy` — `Academy.tsx`: hero header glass, grid corsi della verticale + shared, card con cover, progress bar, badge stato, conteggio lezioni completate.
- `/academy/course/:id` — `CourseDetail.tsx`: lista lezioni numerate, icona PDF/Video, status visto, durata, button apri.
- `/academy/lesson/:id` — `LessonView.tsx`: 
  - PDF: signed URL (1h) embedded iframe + download button (incrementa `download_count`)
  - Video: iframe YouTube embed `https://www.youtube.com/embed/{id}`
  - Button "Contrassegna come visto/completato" → upsert `academy_lesson_access`
  - Al completare l'ultima lezione: insert in `academy_course_completion`, genera certificato PDF (jsPDF) caricato in storage `certificates/{client_id}/`, mostra CTA download.
- Hook `useAcademy.ts` per fetch corsi/progresso/lezioni.

## 3. Frontend Admin

- `/admin/academy/courses` — CRUD corsi, tabella + form modal (titolo, verticale, descrizione, cover upload, status, ordine).
- `/admin/academy/lessons` — CRUD lezioni, filtro per corso, form con switch PDF/Video:
  - PDF: upload drag&drop a `academy-lessons/pdf/{course_id}/`, durata lettura, downloadable
  - Video: input YouTube ID, preview thumbnail, durata manuale
  - Scheduling: `published_at` datetime, `status`
- `/admin/academy/scheduling` — Sezione A batch upload PDF (multi-file → crea N lezioni), Sezione B calendario visuale (grid mese con lezioni colorate per verticale), Sezione C auto-schedule (frequenza bisettimanale, calcolo date).
- `/admin/academy/analytics` — KPI cards (corsi/lezioni/% completamento/certificati), tabella per corso, per lezione, per cliente; export CSV.

## 4. Routing & Sidebar

- Aggiungere route in `src/App.tsx` (cliente + 4 admin)
- Aggiornare `AppSidebar.tsx`: nuova voce "Academy" (cliente) e gruppo Academy admin (Corsi, Lezioni, Scheduling, Analytics)

## 5. Certificati

- Generati client-side con `jspdf` (già installato): nome cliente, titolo corso, data, logo placeholder, "firma Marco" placeholder. Upload a Supabase Storage `certificates/{client_id}/{course_id}.pdf`. Path salvato in `academy_course_completion.certificate_path`. Signed URL 7 giorni per download.

## 6. i18n

Tutto in italiano, stringhe inline (coerente con il resto del progetto).

## Dettagli tecnici

- Glassmorphism già nel design system → uso `Card`, `Button`, badge esistenti.
- Tracking video YouTube: per semplicità tracking manuale (button "Contrassegna come visto"). YouTube IFrame API opzionale, non implementata in v1.
- Limite upload PDF lato client: 50MB.
- Signed URL generata via `supabase.storage.from('academy-lessons').createSignedUrl(path, 3600)`.
- Helper SQL `current_user_verticale()` legge `verticale` dall'ultimo `onboarding_moduli` dell'utente loggato.

## Out of scope (v1)

- Tracking automatico % visione video YouTube (richiede IFrame API + listener, deferibile)
- Drag&drop calendario (mostrato come vista calendario read-only + edit via modal)
- Design definitivo certificato (template placeholder, da rifinire con brand W2)
- Fetch automatico durata video da YouTube Data API (richiede API key) → input manuale

## File principali

```text
supabase/migrations/<ts>_academy.sql
src/pages/Academy.tsx
src/pages/academy/CourseDetail.tsx
src/pages/academy/LessonView.tsx
src/pages/admin/AdminAcademyCourses.tsx
src/pages/admin/AdminAcademyLessons.tsx
src/pages/admin/AdminAcademyScheduling.tsx
src/pages/admin/AdminAcademyAnalytics.tsx
src/hooks/useAcademy.ts
src/lib/academy/certificate.ts
src/App.tsx (routes)
src/components/AppSidebar.tsx (nav)
```

Confermi e procedo con la migration + implementazione?
