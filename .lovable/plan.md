# Piano: Sistema Tech Stack a doppia vista (Cliente / Admin)

## Obiettivo
Sostituire l'attuale gestione tech_stack con un sistema strutturato che separa nettamente:
- **Cliente**: vede solo card informative dei tool che Marco gli ha assegnato (zero costi)
- **Admin (Marco)**: gestisce catalogo globale, abbonamenti, assegnazioni e dashboard costi

## 1. Database (migrazione)

Tre nuove tabelle + due viste, mantenendo `tech_stack` esistente per ora (non viene più usata dalle nuove UI, la rimuoveremo in seguito su conferma).

**`tech_stack_catalog`** — catalogo globale strumenti
- `name`, `website_url`, `description_what`, `description_do`, `description_why`, `icon_url`, `created_by`

**`tech_stack_subscriptions`** — piani per ogni tool (1-N)
- `tech_stack_id`, `subscription_type` (enum: free/basic/pro/enterprise), `cost_monthly`, `cost_yearly`, `currency` (default EUR)

**`client_tech_stack`** — assegnazioni cliente↔tool↔piano
- `client_id`, `tech_stack_id`, `subscription_id`, `status` (active/inactive), `activated_at`, `deactivated_at`, `notes`
- Vincolo unique: `(client_id, tech_stack_id)`

**Viste aggregate**
- `tech_stack_costs_summary` — per cliente: tools_count, total monthly/yearly
- `tech_stack_tool_breakdown` — per tool: clienti che lo usano, costo totale

**RLS**
- Catalogo + abbonamenti: lettura per tutti gli autenticati, scrittura solo admin
- `client_tech_stack`: cliente vede solo i propri (active), admin gestisce tutto

## 2. Vista Cliente — `/stack` (riusa rotta esistente)

Riscrittura di `src/pages/TechStack.tsx`:
- Header "🛠️ Stack Tecnologico" + sottotitolo
- Grid responsivo 1/2/3 colonne con card glass
- Per ogni tool assegnato: icona, nome, descrizione (what + do + why concatenati o sezionati), bottone "Scopri di più →" verso `website_url`
- **Nessun costo** mostrato
- Stato vuoto con messaggio dedicato
- Skeleton loader durante fetch

## 3. Vista Admin (3 nuove pagine)

### `/admin/tech-stack/catalog` — `AdminTechStackCatalog.tsx`
- Tabella catalogo (nome, URL, # piani, azioni)
- Dialog "Aggiungi/Modifica Tool" con tutti i campi descrittivi
- Per ogni tool: riga espandibile con i suoi `subscription_types` (CRUD inline)
- Dialog "Aggiungi piano abbonamento"

### `/admin/tech-stack/assignments` — `AdminTechStackAssignments.tsx`
- Select cliente in alto (mostra verticale, ragione sociale, email)
- Tabella tool assegnati al cliente con costo mensile, status, azioni (disattiva/rimuovi)
- Form "Aggiungi tool a questo cliente": select tool (filtra già assegnati) + select piano + preview costo + bottone Attiva
- Box riepilogo costi (mensile/annuale) per il cliente selezionato

### `/admin/tech-stack/costs` — `AdminTechStackCosts.tsx`
- 3 metric card: Costo mensile totale, annuale totale, # tool attivi
- Tabella "Costi per cliente" (ragione sociale, verticale, # tool, costo mese/anno, % sul totale)
- Tabella "Breakdown per tool" (tool, # clienti, costo unitario, costo totale)
- Bottone "Esporta CSV" (riusa `lib/csv-export.ts`); PDF rimandato se non urgente
- Grafici (pie + bar) opzionali con `recharts` già presente

### Routing & Sidebar
- Aggiungere le 3 rotte in `src/App.tsx` dentro `AdminGuard`
- Aggiungere voci nella sezione admin di `AppSidebar.tsx`

## 4. Tipi e helper
- I tipi Supabase si rigenerano automaticamente dopo la migration
- Piccolo hook `useClientTechStack(clientId)` per la vista cliente

## 5. Cosa NON viene toccato
- L'attuale tabella `tech_stack` resta in DB (deprecata, non più referenziata dalle nuove UI). Rimozione in un secondo step su conferma per non perdere eventuali dati.
- Onboarding, contatti, dashboard cliente: invariati.

## Dettagli tecnici

```text
DB:
  tech_stack_catalog (1) ──< tech_stack_subscriptions (N)
         │                              │
         └──────< client_tech_stack >───┘
                        │
                  clients (1)

Frontend nuovo:
  src/pages/TechStack.tsx                   (riscritto, vista cliente)
  src/pages/admin/AdminTechStackCatalog.tsx
  src/pages/admin/AdminTechStackAssignments.tsx
  src/pages/admin/AdminTechStackCosts.tsx
  src/hooks/useClientTechStack.ts
```

Enum Postgres: `subscription_type` (free, basic, pro, enterprise), `client_tech_status` (active, inactive).

Tutto in italiano, design glassmorphism coerente con il resto del portale.

## Ordine di esecuzione
1. Migration DB (tabelle, enum, RLS, viste) — richiede approvazione utente
2. Pagina cliente `/stack`
3. Pagine admin (catalogo → assegnazioni → costi)
4. Routing + sidebar
