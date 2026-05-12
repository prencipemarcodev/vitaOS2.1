# 📋 SPECIFICA TECNICA — Personal Dashboard App

> Versione 4.0 | Singolo utente | Vite + React + Supabase + Vercel

---

## 1. STACK TECNOLOGICO

| Layer             | Tecnologia                              |
| ----------------- | --------------------------------------- |
| Framework UI      | React 18 + Vite                         |
| Routing           | React Router v6                         |
| State Management  | Zustand                                 |
| Styling           | Tailwind CSS v3 + CSS Variables         |
| Animazioni        | Framer Motion                           |
| Grafici           | Recharts                                |
| Backend / DB      | Supabase (PostgreSQL + Auth + Realtime) |
| Deploy            | Vercel                                  |
| Date / Calendario | date-fns + date-fns/locale (it)         |
| Form              | React Hook Form + Zod                   |
| Icone             | Lucide React                            |
| Notifiche         | Sonner (toast)                          |

---

## 2. DESIGN SYSTEM

### 2.1 Palette Colori

```css
:root {
  /* Brand */
  --color-primary: rgb(180, 98, 67);
  --color-primary-light: rgb(210, 140, 110);
  --color-primary-dark: rgb(140, 65, 40);
  --color-primary-ghost: rgba(180, 98, 67, 0.12);

  /* Superfici — Light Mode */
  --bg-base: #fafaf8;
  --bg-surface: #ffffff;
  --bg-elevated: #f5f3f0;
  --bg-hover: #edebe8;

  /* Testo — Light Mode */
  --text-primary: #1a1714;
  --text-secondary: #5c5753;
  --text-muted: #9b9591;
  --text-inverse: #ffffff;

  /* Bordi */
  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.12);
  --border-strong: rgba(0, 0, 0, 0.2);

  /* Semantici */
  --color-success: #3d9970;
  --color-danger: #e05252;
  --color-warning: #d4a017;
  --color-info: #4a90d9;

  /* Calendario — colori categorie evento */
  --event-lavoro: rgb(180, 98, 67);
  --event-studio: #4a90d9;
  --event-esercizio: #3d9970;
  --event-salute: #e05252;
  --event-personale: #9b59b6;
  --event-ferie: #d4a017;
  --event-malattia: #7f8c8d;
  --event-altro: #95a5a6;

  /* Ombre */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06);

  /* Raggi */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Transizioni */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

[data-theme="dark"] {
  --bg-base: #141210;
  --bg-surface: #1e1c1a;
  --bg-elevated: #252220;
  --bg-hover: #2e2b28;

  --text-primary: #f0ede8;
  --text-secondary: #a8a29c;
  --text-muted: #6b6560;

  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.18);

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.5);
}
```

### 2.2 Tipografia

```css
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:wght@300;400;600&display=swap");

--font-display: "Fraunces", Georgia, serif;
--font-body: "DM Sans", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace;

--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

### 2.3 Principio fondamentale — "Everything Above The Fold"

**Regola d'oro:** su desktop (≥ 1280px) ogni pannello mostra tutte le informazioni in un'unica schermata senza scroll verticale di pagina. L'altezza disponibile per il content area è `100vh − 58px (header) − 32px (padding)`. Tutti i componenti interni si adattano usando `flex-grow`, altezze relative e `overflow: hidden`.

Conseguenze pratiche:

- Le griglie usano `grid-template-rows` con `fr` per occupare lo spazio disponibile
- Le liste potenzialmente lunghe hanno `overflow-y: auto` con `max-height` calcolato (non fisso in px)
- I grafici usano `ResponsiveContainer` di Recharts con `height="100%"` dentro un wrapper con altezza definita
- **Le grid non lasciano mai spazio vuoto:** usare `minmax(0, 1fr)` e `flex: 1` sistematicamente. Le card si espandono per riempire lo spazio disponibile

### 2.4 Layout Standard Pannello

**Header — due varianti:**

```
VARIANTE A — con selettore mese (dati mensili):
┌──────────────────────────────────────────────────────────────┐
│  [Titolo]               [◀ Mese Anno ▶]           [Azioni]  │  ← h-58px
└──────────────────────────────────────────────────────────────┘
Pannelli: Calendario · Firme · Finanze · Salute

VARIANTE B — senza selettore mese (dati overall / evergreen):
┌──────────────────────────────────────────────────────────────┐
│  [Titolo + eventuale notifica 🔴]                  [Azioni]  │  ← h-58px
└──────────────────────────────────────────────────────────────┘
Pannelli: Overview · Risparmi · Note · Impostazioni
```

**Struttura contenuto (comune):**

```
├──────────────────────────────────────────────────────────────┤
│  [KPI]  [KPI]  [KPI]  [KPI]                                 │  ← Row fissa h-auto
├──────────────────────┬───────────────────────────────────────┤
│                      │                                       │
│  Contenuto           │  Contenuto                            │  ← flex-grow
│  principale          │  secondario                           │    riempie tutto
│  (grafico / lista)   │  (sidebar / dettaglio)                │    lo spazio
│                      │                                       │
└──────────────────────┴───────────────────────────────────────┘
```

**Breakpoints:**

- Mobile < 640px → single column, nav bottom bar, scroll consentito
- Tablet 640–1280px → 2 colonne, scroll consentito
- Desktop ≥ 1280px → layout fisso, NO scroll di pagina

### 2.5 Navigazione

**Desktop:** Sidebar sinistra collassabile — 64px (solo icone) ↔ 240px (icona + label)
**Mobile:** Bottom navigation bar con 5 voci principali + drawer "Altro" per le restanti

Ordine: Overview · Calendario · Firme · Finanze · Risparmi · Salute · Note · Impostazioni

### 2.6 Sistema Notifiche In-App

Le notifiche non sono notifiche di sistema (push/OS) ma **avvisi in-app** che compaiono all'apertura dell'applicazione e sono visibili nel pannello Overview.

**Trigger automatici (calcolati al mount dell'app):**

- Evento imminente: "Riunione team tra 45 minuti"
- Sessione di lavoro: "Orario di lavoro inizia tra 30 minuti"
- Piano risparmio in scadenza: "MacBook Pro: scade tra 7 giorni, mancano € 120"
- Ferie esaurite: "Hai esaurito i giorni di ferie disponibili"
- Surplus negativo: "Questo mese le uscite previste superano le entrate"
- Obiettivo corsa: "Sei a 12 km dall'obiettivo mensile di 50 km"
- Allenamento saltato: "Non ti alleni da 4 giorni" (se streak si interrompe)

**Visualizzazione in Overview:**

- Icona campanella nell'header con puntino rosso animato se ci sono notifiche non lette
- Click sulla campanella → drawer laterale che scende da destra con lista notifiche
- Ogni notifica: icona categoria colorata + testo + timestamp relativo + tasto ✕ per chiudere
- Notifiche raggruppate per categoria (oggi / questa settimana)
- "Segna tutte come lette" in cima al drawer
- Le notifiche lette rimangono visibili ma con opacity ridotta fino alla chiusura del drawer

**Storage:** le notifiche vengono generate client-side al mount e persistono in `localStorage` per la sessione; lo stato "letta/non letta" è salvato in Supabase (tabella `notifications_read`).

**Componenti:**

- `NotificationBell.jsx` — icona con badge animato
- `NotificationDrawer.jsx` — pannello laterale (non modal, non blurra la pagina)
- `useNotifications.js` — hook che calcola i trigger all'avvio

**Mobile:** la campanella è sempre visibile nell'header; il drawer occupa tutta la larghezza

### 2.7 Modal — Comportamento Globale

Quando un modal è aperto, l'intera pagina (sidebar inclusa) riceve `backdrop-filter: blur(8px)` tramite un overlay `position: fixed; inset: 0`. Il modal stesso vive a z-index superiore all'overlay ed è escluso dal blur.

**Implementazione:**

```jsx
// ModalPortal.jsx — montato in <body> via ReactDOM.createPortal
// Garantisce che il blur sia sempre globale indipendentemente
// da dove viene triggerato il modal nel component tree

<div className="modal-overlay">
  {" "}
  {/* fixed, inset-0, blur, bg semitrasparente */}
  <motion.div className="modal-content">
    {" "}
    {/* pannello vero */}
    {children}
  </motion.div>
</div>
```

- **Apertura:** `scale(0.96) opacity(0) → scale(1) opacity(1)` in 220ms spring
- **Chiusura:** click fuori dal panel o tasto ESC
- **Overlay:** `background: rgba(0,0,0,0.35); backdrop-filter: blur(8px)`
- **Regola assoluta:** nessun modal usa blur parziale o scoped a una sezione

---

## 3. ARCHITETTURA PROGETTO

```
src/
├── main.jsx
├── App.jsx
├── router.jsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── BottomNav.jsx
│   │   ├── Header.jsx
│   │   ├── MonthSelector.jsx
│   │   └── PageWrapper.jsx          ← gestisce above-the-fold logic
│   ├── ui/
│   │   ├── Card.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── ModalPortal.jsx          ← createPortal + blur globale
│   │   ├── Badge.jsx
│   │   ├── Toggle.jsx
│   │   ├── Skeleton.jsx
│   │   ├── EmptyState.jsx
│   │   ├── AnimatedNumber.jsx
│   │   ├── Carousel.jsx             ← carousel riusabile (Overview grafici)
│   │   ├── TimeBlockSelector.jsx    ← selettore orario per Impostazioni (stile card/toggle)
│   │   ├── NotificationBell.jsx     ← campanella con badge rosso animato
│   │   └── NotificationDrawer.jsx   ← drawer notifiche in-app
│   └── charts/
│       ├── SparkLine.jsx
│       ├── AreaChart.jsx
│       ├── BarChart.jsx
│       ├── DonutChart.jsx
│       └── LineChart.jsx
│
├── pages/
│   ├── Onboarding/
│   │   ├── index.jsx                ← wizard primo avvio (fullscreen, bypassa layout)
│   │   ├── StepReddito.jsx
│   │   ├── StepOrariLavoro.jsx
│   │   ├── StepOrariStudioGym.jsx
│   │   ├── StepSaldoIniziale.jsx
│   │   ├── StepPrimoRisparmio.jsx
│   │   └── StepDone.jsx
│   ├── Overview/
│   │   ├── index.jsx
│   │   ├── KPICards.jsx
│   │   ├── ChartCarousel.jsx        ← saldo / spese / ore in carousel
│   │   ├── RecentActivity.jsx
│   │   └── QuickActions.jsx
│   ├── Calendario/
│   │   ├── index.jsx
│   │   ├── CalendarGrid.jsx         ← griglia grande mensile
│   │   ├── DayDrawer.jsx            ← panel laterale giorno selezionato
│   │   ├── EventModal.jsx
│   │   ├── LeaveModal.jsx           ← inserimento ferie/malattia
│   │   ├── HolidaySuggestion.jsx    ← banner ponti consigliati
│   │   └── italianHolidays.js
│   ├── Firme/
│   │   ├── index.jsx
│   │   ├── SessionForm.jsx          ← form inserimento (anche retroattivo)
│   │   ├── WorkLog.jsx              ← lista sessioni raggruppata per giorno
│   │   ├── WorkStats.jsx            ← KPI statistiche
│   │   └── WorkChart.jsx            ← BarChart ore/giorno
│   ├── Finanze/
│   │   ├── index.jsx
│   │   ├── TransactionList.jsx
│   │   ├── TransactionModal.jsx
│   │   ├── BalanceChart.jsx
│   │   ├── PlannedExpenses.jsx      ← strip uscite previste
│   │   ├── CashVsBank.jsx
│   │   └── CategoryDonut.jsx
│   ├── Risparmi/
│   │   ├── index.jsx
│   │   ├── PlanCard.jsx
│   │   ├── PlanModal.jsx
│   │   ├── SmartAdvicePanel.jsx
│   │   └── ProjectionChart.jsx
│   ├── Salute/
│   │   ├── index.jsx
│   │   ├── WorkoutCalendar.jsx
│   │   ├── WorkoutCard.jsx
│   │   ├── RunStats.jsx
│   │   ├── RunChart.jsx
│   │   └── GymScheda.jsx
│   ├── Note/
│   │   ├── index.jsx
│   │   ├── NoteEditor.jsx
│   │   └── NoteCard.jsx
│   └── Impostazioni/
│       ├── index.jsx
│       ├── AppearanceSection.jsx
│       ├── WorkSection.jsx
│       ├── IncomeSection.jsx        ← stipendio, 13a, 14a, % risparmio
│       ├── FinanceSection.jsx       ← categorie custom + periodici
│       ├── CalendarSection.jsx      ← ferie contrattuali, patrono
│       ├── HealthSection.jsx
│       └── ResetSection.jsx
│
├── store/
│   ├── useAppStore.js
│   ├── useCalendarStore.js
│   ├── useFinanceStore.js
│   ├── useFirmeStore.js
│   ├── useHealthStore.js
│   ├── useNoteStore.js
│   └── useSavingsStore.js
│
├── hooks/
│   ├── useSupabase.js
│   ├── useMonthSelector.js
│   ├── useLocalDate.js
│   ├── useAnimatedMount.js
│   └── useNotifications.js          ← calcola trigger notifiche al mount
│
├── lib/
│   ├── supabase.js
│   ├── formatters.js               ← currency, date, duration
│   ├── italianCalendar.js          ← festività + calcolo Pasqua
│   ├── leaveCalculator.js          ← calcolo giorni lavorativi in un range
│   ├── holidaySuggester.js         ← algoritmo ponti consigliati
│   ├── smartSavings.js             ← algoritmo distribuzione risparmio
│   ├── exportData.js               ← genera JSON backup e CSV per Finanze/Firme
│   └── keyboardShortcuts.js        ← mappa shortcut + handler globale
│
└── styles/
    ├── globals.css
    ├── variables.css
    └── animations.css
```

---

## 4. DATABASE SCHEMA (Supabase / PostgreSQL)

```sql
-- Configurazione utente (riga singola)
CREATE TABLE user_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Aspetto
  theme TEXT DEFAULT 'light',

  -- Orari lavorativi per giorno (JSONB — un oggetto per giorno della settimana)
  -- Struttura: { "1": { enabled: true, from: "08:30", to: "17:30" }, ... }
  -- La chiave è il numero del giorno (0=Dom, 1=Lun, ..., 6=Sab)
  work_schedule JSONB DEFAULT '{
    "1": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "2": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "3": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "4": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "5": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "6": {"enabled": false},
    "0": {"enabled": false}
  }',
  daily_hours NUMERIC(4,2) DEFAULT 8.0,   -- ore standard/giorno (calcolato o manuale)

  -- Orari studio per giorno (stessa struttura, con fasce mattina e sera separabili)
  -- Struttura: { "1": { enabled: true, morning: { enabled: true, from: "11:00", to: "13:00" },
  --                                    evening:  { enabled: true, from: "15:00", to: "19:00" } }, ... }
  study_schedule JSONB DEFAULT '{}',

  -- Orari palestra/allenamento per giorno
  -- Struttura: { "2": { enabled: true, from: "11:00", to: "13:00", buffer_min: 30, location: "Palestra X" }, ... }
  gym_schedule JSONB DEFAULT '{}',

  -- Ferie e malattie
  annual_leave_days INTEGER DEFAULT 26,
  sick_days_used NUMERIC(5,2) DEFAULT 0,
  leave_days_used NUMERIC(5,2) DEFAULT 0,

  -- Reddito
  monthly_net_income NUMERIC(10,2) DEFAULT 0,
  has_thirteenth BOOLEAN DEFAULT true,
  has_fourteenth BOOLEAN DEFAULT false,
  thirteenth_month INTEGER DEFAULT 12,
  fourteenth_month INTEGER DEFAULT 6,

  -- Risparmio
  savings_target_pct NUMERIC(5,2) DEFAULT 20,

  -- Calendario
  patron_saint_date DATE,

  -- Salute
  weight_kg NUMERIC(5,2),
  weight_updated_at DATE,
  run_monthly_goal_km NUMERIC(6,2) DEFAULT 50,
  workout_weekly_goal INTEGER DEFAULT 4,
  total_run_km_ever NUMERIC(10,3) DEFAULT 0,   -- km totali corsa da sempre (aggiornato ad ogni sessione)

  -- Misc
  currency TEXT DEFAULT 'EUR',
  locale TEXT DEFAULT 'it-IT',
  timezone TEXT DEFAULT 'Europe/Rome',
  onboarding_completed BOOLEAN DEFAULT false   -- wizard primo avvio
);

-- Notifiche lette (per persistere stato letto/non letto tra sessioni)
CREATE TABLE notifications_read (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_key TEXT NOT NULL UNIQUE,   -- chiave deterministica (es. "event_123_2026-05-12")
  read_at TIMESTAMPTZ DEFAULT now()
);

-- Ricorrenze annuali (compleanni, anniversari, ecc.)
-- Separate dagli eventi perché si ripetono ogni anno automaticamente
CREATE TABLE recurring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  month INTEGER NOT NULL,           -- 1–12
  day INTEGER NOT NULL,             -- 1–31
  category TEXT DEFAULT 'personale',
  icon TEXT,                        -- emoji o nome icona (es. "cake", "heart")
  notify_days_before INTEGER DEFAULT 3   -- quanti giorni prima generare notifica
);

-- Calendario — eventi generici
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,                               -- per eventi multi-giorno
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  category TEXT NOT NULL DEFAULT 'personale',  -- lavoro|studio|esercizio|salute|personale|ferie|malattia|altro
  is_recurring BOOLEAN DEFAULT false,
  recurring_type TEXT,                         -- daily|weekly|monthly
  recurring_end_date DATE
);

-- Assenze — ferie e malattie (tabella separata per conteggio preciso)
CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL,                          -- 'ferie' | 'malattia' | 'permesso'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count NUMERIC(5,2) NOT NULL,            -- calcolato escludendo weekend e festività
  notes TEXT
);

-- Firme — sessioni di lavoro
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  check_in TIME NOT NULL,
  check_out TIME,
  duration_minutes INTEGER,                    -- calcolato al salvataggio
  notes TEXT,
  is_manual BOOLEAN DEFAULT false,             -- true se inserito retroattivamente
  inserted_at TIMESTAMPTZ DEFAULT now()
);

-- Finanze — transazioni
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,                          -- 'income' | 'expense'
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT DEFAULT 'bank',          -- 'bank' | 'cash'
  is_planned BOOLEAN DEFAULT false,
  planned_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT,                       -- 'weekly'|'monthly'|'yearly'
  recurring_day INTEGER,
  parent_transaction_id UUID                   -- per ricorrenti generati automaticamente
);

-- Finanze — categorie (default + custom)
CREATE TABLE finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,                          -- 'income' | 'expense'
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  is_periodic BOOLEAN DEFAULT false,
  periodic_amount NUMERIC(10,2),
  periodic_day INTEGER,                        -- giorno del mese
  periodic_period TEXT DEFAULT 'monthly'       -- 'monthly' | 'yearly'
);

-- Risparmi — piani
CREATE TABLE saving_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(10,2) NOT NULL,
  current_amount NUMERIC(10,2) DEFAULT 0,
  target_date DATE,
  type TEXT DEFAULT 'goal',                    -- 'goal'|'piggybank'|'accumulo'
  icon TEXT,
  color TEXT,
  priority INTEGER DEFAULT 0,                  -- usato da smartSavings per prioritizzare
  monthly_contribution NUMERIC(10,2),          -- contributo desiderato dall'utente
  is_active BOOLEAN DEFAULT true
);

-- Risparmi — movimenti
CREATE TABLE saving_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  plan_id UUID REFERENCES saving_plans(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,                          -- 'deposit' | 'withdrawal'
  date DATE NOT NULL,
  notes TEXT
);

-- Salute — sessioni allenamento
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  type TEXT NOT NULL,                          -- 'gym' | 'run' | 'cardio'
  duration_minutes INTEGER,
  notes TEXT,
  scheda_id UUID,
  run_distance_km NUMERIC(6,3),
  run_avg_pace TEXT,
  run_calories INTEGER,
  run_route TEXT
);

-- Salute — storico peso corporeo
CREATE TABLE weight_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  notes TEXT
);

-- Salute — schede palestra
CREATE TABLE gym_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  days INTEGER[],
  is_active BOOLEAN DEFAULT true,
  exercises JSONB
);

-- Note
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT '#FFFFFF',
  is_pinned BOOLEAN DEFAULT false,
  tags TEXT[]
);
```

### Indici

```sql
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_work_sessions_date ON work_sessions(date DESC);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_absences_dates ON absences(start_date, end_date);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(date DESC);
CREATE INDEX idx_saving_movements_plan ON saving_movements(plan_id, date DESC);
CREATE INDEX idx_weight_log_date ON weight_log(date DESC);
CREATE INDEX idx_recurring_events_month_day ON recurring_events(month, day);
```

---

## 5. SPECIFICHE DETTAGLIATE PER PANNELLO

---

### 5.1 OVERVIEW

**Obiettivo:** dashboard di controllo immediato. Aperta l'app, l'utente vede tutto quello che conta e può compiere azioni rapide senza cambiare pannello.

**Layout desktop (above the fold, no scroll):**

```
┌──────────────────────────────────────────────────────────────┐
│ Panoramica          [◀ Maggio 2026 ▶]                  [+]  │
├──────────────────────────────────────────────────────────────┤
│  [KPI Saldo]  [KPI Ore lavoro]  [KPI Evento]  [KPI Risparmio]│
├──────────────────────────────┬───────────────────────────────┤
│                              │  Prossimi eventi (3)          │
│  CAROUSEL GRAFICI            │  ─────────────────────────    │
│  ◀  [grafico]  ▶             │  Ultime transazioni (4)       │
│     ● ○ ○ (dot indicator)    │  ─────────────────────────    │
│                              │  Settimana workout            │
│  Slide 1: andamento saldo    │  ─────────────────────────    │
│  Slide 2: analisi spese      │  Quick Actions                │
│  Slide 3: ore lavorate       │  [Entrata][Uscita][Timbra][Evento]│
└──────────────────────────────┴───────────────────────────────┘
```

**KPI Cards (4, con AnimatedNumber):**

- Saldo totale (conto + contante) + delta vs mese precedente
- Ore lavorate mese / monte ore previsto (es. "86h / 168h")
- Prossimo evento: titolo + tempo relativo ("domani", "tra 3 giorni")
- Piano risparmio più urgente: nome + % completamento + barra mini

**Carousel grafici:**

- Componente `Carousel.jsx` con Framer Motion
- Slide 1 — Andamento saldo: AreaChart ultimi 30 giorni, due linee (conto, contante)
- Slide 2 — Analisi spese: DonutChart categorie uscite del mese + legenda inline
- Slide 3 — Ore lavorate: BarChart ore per giorno lavorativo del mese
- Navigazione: frecce laterali + dot indicator cliccabili + swipe su mobile
- Transizione: `AnimatePresence` con slide e spring easing

**Colonna destra:**

- Prossimi 3 eventi (pill data colorata per categoria + titolo + orario)
- Ultime 4 transazioni (dot categoria + descrizione + importo + badge bank/cash)
- Mini week-strip allenamenti (7 pill L/M/M/G/V/S/D con dot colorato per tipo)
- Quick Actions: 4 button → aprono il rispettivo modal (TransactionModal, SessionForm, EventModal, NoteEditor) con blur globale

---

### 5.2 CALENDARIO

**Obiettivo:** agenda visiva mensile completa con gestione ferie/malattie, contatore residuo e suggerimento intelligente dei ponti.

**Layout desktop (above the fold):**

```
┌──────────────────────────────────────────────────────────────┐
│ Calendario  Ferie: 18/26  [◀ Maggio 2026 ▶]  [+Evento][Ferie]│
├──────────────────────────┬───────────────────────────────────┤
│                          │                                   │
│  GRIGLIA GRANDE          │  DAY DRAWER                       │
│  L  M  M  G  V  S  D    │  ─────────────────────────────    │
│  ┌──┬──┬──┬──┬──┬──┬──┐ │  [Lunedì 11 Maggio 2026]          │
│  │  │  │  │  │1 │2 │3 │ │                                   │
│  ├──┼──┼──┼──┼──┼──┼──┤ │  • Lavoro 08:30–10:30             │
│  │4 │5 │6 │7 │8 │9 │10│ │  • Studio 11:00–13:00             │
│  ├──┼──┼──┼──┼──┼──┼──┤ │  • Esercizio 15:00–19:00          │
│  │11│12│..│  │  │  │  │ │                                   │
│  │(oggi)              │ │  [+ Aggiungi evento]               │
│  └──┴──┴──┴──┴──┴──┴──┘ │  [+ Aggiungi ferie/malattia]      │
│                          │                                   │
├──────────────────────────┴───────────────────────────────────┤
│ ⚡ SUGGERIMENTO: prendendo venerdì 2 maggio ottieni 4 giorni  │
│   [Accetta e prenota] [Ignora]                               │
└──────────────────────────────────────────────────────────────┘
```

**Griglia calendario:**

- Ispirata all'immagine fornita: celle grandi, testo piccolo e denso, bordi sottili
- Altezza righe calcolata dinamicamente per riempire lo spazio disponibile
- Ogni cella mostra: numero giorno + badge festività + max 3 eventi (poi "+N altri")
- Gli eventi mostrano: colored pill con testo `Titolo HH:MM–HH:MM`
- Colori celle: oggi = sfondo arancio ghost, festività = sfondo giallo tenue, ferie = sfondo azzurro tenue, malattia = sfondo grigio tenue

**Festività italiane (`italianCalendar.js`):**
Hardcoded: Capodanno, Epifania, Liberazione (25/4), Lavoro (1/5), Repubblica (2/6), Ferragosto, Ognissanti, Immacolata, Natale, S. Stefano. Calcolati: Pasqua (algoritmo di Gauss/Meeus), Lunedì dell'Angelo (Pasqua+1). Da config: Santo Patrono.

**Gestione Ferie e Malattie:**

_Mini contatore nell'header:_ "Ferie: 18/26 rimaste · Malattia: 3 giorni usati"

_LeaveModal (blur globale):_

- Tipo: Ferie | Malattia | Permesso
- Range date con date picker (start → end)
- `leaveCalculator.js` calcola in tempo reale i giorni lavorativi effettivi (esclude weekend + festività)
- Anteprima: "Stai usando X giorni lavorativi. Ti rimarranno Y giorni di ferie."
- Conferma: inserisce in `absences`, aggiorna contatori in `user_config`, crea evento in `calendar_events` (categoria = ferie/malattia, tutto il giorno, durata = range)

**Algoritmo ponti consigliati (`holidaySuggester.js`):**

```
INPUT: festività del mese, giorni lavorativi, ferie_residue
LOGICA:
  per ogni festività del mese:
    analizza i giorni adiacenti (ieri e domani)
    se la festività crea un "quasi-ponte" (es. giovedì festivo → venerdì lavorativo)
      calcola: giorni_ferie_necessari, giorni_totali_pausa
      se efficienza (giorni_pausa / giorni_ferie) > soglia:
        aggiungi al risultato

OUTPUT: array ordinato per efficienza DESC
  [{ startDate, endDate, leaveDaysNeeded, totalDaysOff, label, efficiency }]
  es: "1 giorno di ferie → 4 giorni di pausa (venerdì 2 maggio)"

VISUALIZZAZIONE: banner collassabile in fondo al calendario
  L'utente clicca "Accetta" → apre LeaveModal precompilato con le date suggerite
  L'utente clicca "Ignora" → banner scompare fino al mese successivo
```

**Day Drawer (panel laterale):**

- Si apre al click su qualsiasi cella
- Mostra tutti gli eventi del giorno con orario, categoria colorata, descrizione
- Bottoni: + Aggiungi evento (→ EventModal precompilato con la data), + Aggiungi ferie/malattia (→ LeaveModal)
- Se giorno vuoto: empty state con CTA

**EventModal (blur globale):**

- Titolo, descrizione, data (o range), toggle tutto-il-giorno, ora inizio/fine
- Categoria (chip select colorato), ripetizione (mai/settimanale/mensile)

---

### 5.3 FIRME

**Obiettivo:** registro flessibile delle ore lavorative. Non è una timbratura in tempo reale — l'utente inserisce le sessioni quando vuole, anche retroattivamente, anche più sessioni per lo stesso giorno.

**Layout desktop (above the fold):**

```
┌─────────────────────────────────────────────────────────────┐
│ Firme                [◀ Maggio 2026 ▶]         [+ Sessione] │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  KPI STATS    │  GRAFICO ORE GIORNALIERE                    │
│  ──────────   │  BarChart: barra verde = ore normali        │
│  Ore totali   │           barra arancio = overtime          │
│  Monte ore    │  Linea tratteggiata = ore standard/giorno   │
│  previsto     │                                             │
│  Differenza   │                                             │
│  (±)          │                                             │
│  Giorni lav.  │                                             │
│  Media/giorno │                                             │
│  Overtime acc.│                                             │
│               │                                             │
├───────────────┴─────────────────────────────────────────────┤
│  LISTA SESSIONI  (scroll interno, max-height calcolato)     │
│  ┌ 11 Maggio ────────────────────────── tot: 7h 30m ──────┐ │
│  │ 08:30 → 16:00  (7h 30m)  [Manuale]              [🗑]   │ │
│  └──────────────────────────────────────────────────────-─┘ │
│  ┌ 10 Maggio ────────────────────────── tot: 9h 00m ──────┐ │
│  │ 08:30 → 17:30  (9h 00m)  +1h overtime            [🗑]  │ │
│  └─────────────────────────────────────────────────────-──┘ │
└─────────────────────────────────────────────────────────────┘
```

**SessionForm (modal con blur globale):**

- Data (default oggi, liberamente modificabile — permette inserimento retroattivo)
- Ora entrata (time picker, HH:MM)
- Ora uscita (time picker, opzionale)
- Note libere
- Il flag `is_manual` viene impostato automaticamente se `date ≠ oggi`
- Le sessioni manuali mostrano badge "ins. manuale" nella lista

**Lista sessioni:**

- Raggruppata per giorno, data DESC
- Ogni gruppo mostra: data formattata + totale ore giornaliero + eventuali badge overtime/deficit
- Se un giorno ha più sessioni, tutte visibili sotto lo stesso header di data
- Colori: ore normali = testo verde, ore overtime = testo arancio, deficit = testo rosso

**KPI calcolati:**

- Ore totali mese: `SUM(duration_minutes) / 60` del mese selezionato
- Monte ore previsto: `giorni_lavorativi_mese × daily_hours` (esclude festività e giorni di assenza)
- Differenza: `ore_totali − monte_ore_previsto` (positiva = overtime, negativa = deficit)
- Giorni con almeno una sessione registrata
- Media giornaliera: `ore_totali / giorni_con_sessione`
- Overtime accumulato: somma delle ore oltre `daily_hours` per ogni giornata

---

### 5.4 FINANZE

**Obiettivo:** controllo completo di entrate, uscite, saldo per metodo pagamento, previsioni mensili. Tutto visibile in un'unica schermata.

**Layout desktop (above the fold):**

```
┌─────────────────────────────────────────────────────────────┐
│ Finanze              [◀ Maggio 2026 ▶]      [+ Transazione] │
├───────────────┬─────────────────────────────────────────────┤
│  Saldo conto  │                                             │
│  Saldo cash   │  GRAFICO AREA — andamento saldo mese        │
│  ──────────   │  linea conto + linea contante               │
│  Entrate mese │  (animato, Recharts AreaChart)              │
│  Uscite mese  │                                             │
│  Saldo netto  │                                             │
├───────────────┼─────────────────────────────────────────────┤
│               │                                             │
│  DONUT        │  LISTA TRANSAZIONI  (scroll interno)        │
│  spese per    │  [Tutte|Entrate|Uscite] [Categoria▼] [Metodo▼]│
│  categoria    │  ──────────────────────────────────────     │
│               │  ● Stipendio      1 mag  +€2.400  [conto]  │
│               │  ● Spesa          4 mag  −€78     [cash]   │
│               │  ● Netflix        5 mag  −€13     [conto]  │
│               │  ● Palestra       5 mag  −€45     [conto]  │
│               │  ...                                        │
├───────────────┴─────────────────────────────────────────────┤
│  USCITE PREVISTE  (strip orizzontale scorrevole)            │
│  [Affitto €800 · 27mag] [Netflix €13 · 5giu] [Palest. ·..]│
└─────────────────────────────────────────────────────────────┘
```

**Categorie e periodicità:**

Categorie di default precaricate in `finance_categories` (is_default=true):

- Entrate: Stipendio, Freelance, Regalo, Rimborso, 13ª Mensilità, 14ª Mensilità, Altro
- Uscite: Casa/Affitto, Cibo, Trasporti, Salute, Sport, Abbigliamento, Intrattenimento, Utility, Abbonamenti, Risparmio, Altro

Da Impostazioni → Finanze, l'utente può:

- Aggiungere categorie custom (nome, tipo, icona, colore)
- Marcare qualsiasi categoria come **Periodica**: definisce importo, giorno del mese, frequenza (mensile/annuale)
- Le transazioni periodiche vengono generate automaticamente ogni mese nel giorno configurato, con badge "periodico" nella lista

Entrate standard (stipendio, 13a, 14a) sono configurate in Impostazioni → Reddito e vengono generate automaticamente nel mese corretto (13a a dicembre, 14a a giugno per default, entrambe configurabili).

**Uscite previste (PlannedExpenses):**

- Include: transazioni `is_planned=true` + transazioni periodiche del mese futuro
- Strip orizzontale scorrevole con swipe su mobile
- Ogni card: icona categoria, descrizione, importo, data prevista, badge "tra X giorni", badge "periodico" se tale
- In fondo alla strip: card "Saldo proiettato fine mese" = saldo attuale + entrate previste − uscite previste

---

### 5.5 RISPARMI

**Obiettivo:** gestione dei piani di accumulo personali con motore di ottimizzazione adattivo che suggerisce come distribuire il surplus mensile.

**Layout desktop (above the fold):**

```
┌─────────────────────────────────────────────────────────────┐
│ Risparmi                                         [+ Piano]  │
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│  SMART ADVICE               │  PIANI (scroll interno)       │
│  ─────────────────────────  │                               │
│  💡 "Questo mese puoi       │  ┌─ MacBook Pro ─────────────┐│
│  accantonare ~€260"         │  │  ████████░░  62%           ││
│                             │  │  €1.250 / €2.000          ││
│  Distribuzione consigliata: │  │  Contributo: €120/mese    ││
│  MacBook  €120 ████░  46%   │  │  Stima: ago 2026          ││
│  Vacanze   €80 ███░░  31%   │  │  [Deposita] [Preleva]     ││
│  Emerg.    €60 ██░░░  23%   │  └───────────────────────────┘│
│                             │                               │
│  [Applica distribuzione]    │  ┌─ Vacanze estate ──────────┐│
│                             │  │  ████░░░░░░  28%          ││
│  GRAFICO PROIEZIONE         │  │  €420 / €1.500            ││
│  LineChart: crescita piani  │  │  Contributo: €80/mese     ││
│  nel tempo fino al target   │  │  Stima: dic 2027          ││
│                             │  └───────────────────────────┘│
└─────────────────────────────┴───────────────────────────────┘
```

**Tipi di piano:**

1. **Obiettivo (Goal):** importo target + data scadenza → mostra giorni rimanenti, contributo minimo mensile necessario per rispettare la scadenza
2. **Salvadanaio (Piggybank):** accumulo libero senza scadenza né target obbligatorio, per tenere da parte risparmi generici
3. **Piano di Accumulo:** contributo mensile fisso definito dall'utente, il sistema proietta la data di raggiungimento

**Algoritmo Smart Advice (`smartSavings.js`):**

```
INPUT:
  - monthly_net_income + eventuali mensilità aggiuntive del mese (da config)
  - transazioni effettive del mese corrente (entrate/uscite già registrate)
  - planned_expenses del mese (periodici + is_planned)
  - saving_plans attivi (current_amount, target_amount, target_date, priority, monthly_contribution)
  - savings_target_pct (% desiderata da config)

CALCOLO SURPLUS:
  entrate_mese = transazioni income del mese + mensilità aggiuntive se mese corretto
  uscite_certe = transazioni expense già registrate
  uscite_previste = planned_expenses rimanenti del mese
  surplus = entrate_mese − uscite_certe − uscite_previste
  budget_risparmio = min(surplus × savings_target_pct/100, surplus × 0.50)
  // Non consigliare mai di mettere da parte più del 50% del surplus

PRIORITIZZAZIONE PIANI:
  per ogni piano attivo:
    se target_date esiste:
      giorni_rimanenti = target_date − oggi
      importo_mancante = target_amount − current_amount
      contributo_minimo = importo_mancante / (giorni_rimanenti / 30)
      urgenza = importo_mancante / max(giorni_rimanenti, 1)
    else:
      urgenza = priority * 0.1
  ordina piani per urgenza DESC
  distribuisce budget_risparmio:
    prima garantisce il contributo_minimo ai piani con scadenza
    poi distribuisce il surplus proporzionalmente ai rimanenti

OUTPUT:
  { suggestedAllocations: [{ plan_id, plan_name, amount, reasoning }],
    totalSuggested: number,
    surplusEstimated: number,
    warningMessages: string[] }

  warningMessages include:
    - "Surplus negativo: le uscite previste superano le entrate. Valuta di ridurre le contribuzioni."
    - "Il piano [X] scade tra 30 giorni e manca ancora €NNN."
    - "Hai raggiunto [X]! 🎉"

ADATTIVITÀ:
  - Ricalcola ogni volta che cambiano transazioni, piani o config
  - Se un piano viene completato, redistribuisce la sua quota agli altri
  - Se il surplus è 0 o negativo, mostra avviso senza suggerire allocazioni
```

**Grafico proiezione (ProjectionChart):**

- LineChart con una serie per ogni piano attivo
- X: mesi futuri (fino alla scadenza del piano più lontano, max 36 mesi)
- Y: importo accumulato stimato (proiezione lineare basata sul contributo mensile suggerito)
- Linea orizzontale tratteggiata = target di ciascun piano
- Punto di intersezione evidenziato = data stimata di raggiungimento
- Tooltip interattivo al hover mostra: mese, importo per piano, % completamento stimata

---

### 5.6 SALUTE

**Tab:** Panoramica | Palestra | Corsa

**Panoramica:**

- Streak allenamenti (con animazione fuoco se ≥ 3 consecutivi)
- Heatmap annuale tipo GitHub contributions (12 mesi × 53 settimane)
- Donut ripartizione tipi workout del mese
- Prossima sessione pianificata (derivata da `gym_schedule` in config)
- **Card Peso:** peso attuale (da `user_config.weight_kg`), delta vs registrazione precedente, mini LineChart storico peso (ultimi 90 giorni da `weight_log`). Bottone "Aggiorna peso" → modal compatto con input numerico.

**Palestra:**

- Schede create dall'utente (CRUD completo): nome, giorni della settimana, lista esercizi (nome, serie × reps, peso, note)
- Il calendario degli allenamenti è pre-popolato dai giorni configurati in `gym_schedule` (Impostazioni)
- Storico sessioni con scheda usata, durata, note
- Progressione pesi per esercizio (LineChart animato)

**Corsa — sezione con widget "Giro della Terra":**

La corsa ha una visualizzazione speciale per i km totali percorsi da sempre (`total_run_km_ever` in `user_config`, aggiornato ad ogni sessione registrata).

```
WIDGET "GIRO DELLA TERRA" (componente GlobeProgress.jsx):

  Rappresentazione: un globo terrestre stilizzato (SVG o CSS 3D),
  con un arco/traccia animato che avanza lungo la superficie
  proporzionale a:

    progressione = total_run_km_ever / EARTH_CIRCUMFERENCE_KM
    EARTH_CIRCUMFERENCE_KM = 40_075

  Visualizzazione:
  - Il globo ruota lentamente (animazione loop CSS, 20s)
  - L'arco di progresso avanza sulla superficie del globo
  - Al centro del globo: percentuale (es. "0.24%") + km totali
  - Sotto il globo: "della Terra" + eventuale milestone successiva
    (es. "Prossima milestone: 1% = 401 km — ti mancano 280 km")
  - Colore dell'arco: var(--color-primary) arancio
  - Milestone: 100 km, 250 km, 500 km, 1000 km, 5000 km,
                10.000 km (= 25% della Terra), 40.075 km (giro completo)
  - Al raggiungimento di una milestone: animazione celebrativa (confetti leggero)
```

**KPI corsa (affiancati al globo):**

- Km mese corrente / obiettivo mensile (barra progresso)
- Pace medio mese
- Sessioni mese
- Record distanza singola sessione
- Calorie totali mese

**Grafici corsa:**

- AreaChart distanza per sessione (animato all'ingresso)
- LineChart pace nel tempo (miglioramento visivo)

**Dati sessione corsa (RunSessionModal):**

- Data, distanza km, durata, pace calcolato automaticamente, calorie, note, percorso testuale
- Al salvataggio: aggiorna `total_run_km_ever` in `user_config`

**Mobile — widget Globo:**
Su mobile il globo si ridimensiona a 180px di diametro, i KPI si impilano sotto in una griglia 2×3.

---

### 5.7 NOTE

**Layout:** griglia masonry 3 col (desktop) / 2 col (tablet) / 1 col (mobile). Le card riempiono le colonne dall'alto senza spazi vuoti.

**Card nota:** colore sfondo (8 opzioni), titolo, contenuto testo (markdown leggero), tag, pin, azioni (modifica, elimina, duplica).

**Funzionalità:** ricerca full-text real-time, filtro per tag, ordinamento (pin prima → data modifica DESC).

---

### 5.8 IMPOSTAZIONI

**Layout desktop:** sidebar sinistra con 7 sezioni, contenuto a destra. Tutto above the fold, no scroll di pagina (le sezioni con molto contenuto usano scroll interno).

**Sezioni:**

**Aspetto:** toggle dark mode con anteprima immediata.

**Lavoro — configuratore orario settimanale (`TimeBlockSelector`):**

Il componente `TimeBlockSelector` è un selettore visivo a card, uno per giorno della settimana (L M M G V S D), ispirato all'immagine di riferimento fornita.

```
STRUTTURA UI — Orario Lavorativo:
┌───────────────────────────────────────────────────────────┐
│ ORARIO LAVORATIVO SETTIMANALE          43.3h/mese         │
│ Attiva i giorni e imposta entrata/uscita                  │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┐        │
│ Lun● │ Mar● │ Mer● │ Gio● │ Ven● │ Sab  │ Dom  │        │
│      │      │      │      │      │ (off)│ (off)│        │
│ DALLE│ DALLE│ DALLE│ DALLE│ DALLE│      │      │        │
│ 08:30│ 08:30│ 08:30│ 16:30│ 08:30│      │      │        │
│ ALLE │ ALLE │ ALLE │ ALLE │ ALLE │      │      │        │
│ 10:30│ 10:30│ 10:30│ 18:30│ 10:30│      │      │        │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘        │
│ Monte ore calcolato mostrato in tempo reale               │
└───────────────────────────────────────────────────────────┘

STRUTTURA UI — Orario Studio:
Stessa card-grid con la possibilità di attivare fasce mattina
e sera in modo indipendente per ogni giorno:
  [Mattina toggle] 11:00 → 13:00
  [Sera toggle]    15:00 → 19:00

STRUTTURA UI — Orario Palestra/Allenamento:
Card-grid dove ogni giorno attivo espone:
  INIZIO: 11:00
  FINE:   13:00
  BUFFER (min): [30▲▼]   ← tempo di viaggio incluso nel blocco calendario
  SEDE: [campo testo]
```

**Implementazione `TimeBlockSelector`:**

- Toggle per attivare/disattivare il giorno (pill animata)
- Se attivato: mostra input `HH:MM` per ora inizio e ora fine
- Il monte ore totale settimanale/mensile si aggiorna in tempo reale in alto a destra del blocco
- I giorni disattivati mostrano "off" in grigio
- Il giorno attivo ha sfondo colorato con il colore della categoria (lavoro = arancio tenue, studio = viola tenue, palestra = verde tenue)
- Su mobile: la grid passa da 7 colonne a scroll orizzontale con snap

**I dati salvati in `user_config.work_schedule`, `study_schedule`, `gym_schedule` (JSONB) alimentano:**

- Il calendario (blocchi pre-popolati per ogni giorno)
- Le firme (monte ore previsto)
- Le notifiche (reminder "tra 30 min inizia il lavoro")

**Reddito:** stipendio netto mensile, toggle 13a (con selettore mese), toggle 14a (con selettore mese), slider % risparmio (5–50%). Questi dati alimentano automaticamente la generazione di transazioni in Finanze e il calcolo surplus in Risparmi.

**Calendario / Assenze:** giorni ferie annuali contrattuali, data Santo Patrono, riepilogo in sola lettura ("Ferie usate: X/Y · Malattia: Z giorni").

**Finanze:** lista categorie (default + custom) con aggiunta/rimozione. Per ogni categoria custom: toggle periodica → campi importo, giorno del mese, frequenza. Saldo iniziale conto e contante (inserimento una tantum al setup).

**Salute:**

- Giorni allenamento obiettivo/settimana
- Obiettivo km corsa mensili
- Peso attuale (con storico — ogni modifica aggiunge un record in `weight_log`)

**Reset (zona pericolosa — sfondo con tenue tinta rossa):** reset per modulo (con conferma modale), reset completo (doppia conferma: "scrivi RESET per continuare").

---

### 5.9 ONBOARDING — Wizard primo avvio

**Obiettivo:** al primo accesso (`user_config.onboarding_completed = false`) l'app bypassa il layout normale e mostra un wizard fullscreen a step progressivi. Senza onboarding la dashboard sarebbe vuota e priva di significato.

**Routing:** `App.jsx` controlla `onboarding_completed` prima di renderizzare il router principale. Se `false` → monta `<Onboarding />` che occupa tutto lo schermo.

**Layout wizard:**

```
┌──────────────────────────────────────────────────────────────┐
│  Logo + "Configurazione iniziale"          [Salta per ora →] │
├──────────────────────────────────────────────────────────────┤
│  Stepper orizzontale: ●───●───●───●───●───●                  │
│  (step 1 di 6)                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              Contenuto dello step                            │
│              (form, selettori, preview)                      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [← Indietro]                          [Avanti →] / [Fine ✓]│
└──────────────────────────────────────────────────────────────┘
```

**Step e contenuto:**

| Step                  | Componente           | Dati raccolti                                            |
| --------------------- | -------------------- | -------------------------------------------------------- |
| 1 — Benvenuto         | `StepReddito`        | Stipendio netto mensile, toggle 13a/14a, mesi erogazione |
| 2 — Orari lavoro      | `StepOrariLavoro`    | `work_schedule` JSONB via TimeBlockSelector              |
| 3 — Studio e palestra | `StepOrariStudioGym` | `study_schedule` + `gym_schedule` JSONB                  |
| 4 — Saldo iniziale    | `StepSaldoIniziale`  | Saldo conto + saldo contante al momento                  |
| 5 — Primo risparmio   | `StepPrimoRisparmio` | Crea opzionalmente il primo piano di accumulo            |
| 6 — Pronti!           | `StepDone`           | Preview animata della dashboard popolata                 |

**Comportamento:**

- Ogni step salva i dati in Supabase immediatamente (non "tutto alla fine"), così se l'utente abbandona riparte dall'ultimo step completato
- Il campo `onboarding_completed` viene impostato a `true` solo al completamento dello step 6 o al click "Salta per ora"
- "Salta per ora" porta direttamente alla dashboard con uno stato vuoto; l'utente può riprendere il wizard da Impostazioni → "Riprendi configurazione iniziale"
- Animazione tra step: slide orizzontale con Framer Motion (lo step uscente scivola a sinistra, il nuovo entra da destra)
- Su mobile: fullscreen, stepper semplificato (solo pallini), no sidebar

---

### 5.10 ESPORTAZIONE DATI

**Posizione:** Impostazioni → sezione dedicata "Esporta / Backup"

**Formati disponibili:**

**1. Backup completo (JSON)**

- Tutti i dati dell'utente in un unico file `dashboard-backup-YYYY-MM-DD.json`
- Struttura: `{ user_config, transactions, work_sessions, calendar_events, absences, saving_plans, saving_movements, workout_sessions, weight_log, notes, recurring_events }`
- Utile per backup personale e futura funzionalità di import/restore

**2. Finanze (CSV)**

- Tutte le transazioni del periodo selezionato (mese corrente / anno corrente / tutto)
- Colonne: `Data, Descrizione, Categoria, Tipo, Importo, Metodo pagamento, Periodico`
- Compatibile con Excel, Google Sheets, Numbers
- Nome file: `finanze-YYYY-MM.csv`

**3. Firme (CSV)**

- Tutte le sessioni lavorative del periodo selezionato
- Colonne: `Data, Entrata, Uscita, Durata (min), Ore, Note, Inserimento manuale`
- Nome file: `firme-YYYY-MM.csv`

**Implementazione (`exportData.js`):**

```js
// Genera e scarica automaticamente il file nel browser
// senza server — tutto client-side con Blob + URL.createObjectURL

export function downloadJSON(data, filename) { ... }
export function downloadCSV(rows, headers, filename) { ... }
export function buildFullBackup(supabaseClient) { ... }  // fetch tutte le tabelle
export function buildFinanceCSV(transactions) { ... }
export function buildFirmeCSV(sessions) { ... }
```

**UI nella sezione Impostazioni:**

```
┌─ Esporta / Backup ────────────────────────────────────────────┐
│  📦 Backup completo              [Scarica JSON]               │
│  💰 Finanze   Periodo: [Mese ▼]  [Scarica CSV]               │
│  🕐 Firme     Periodo: [Mese ▼]  [Scarica CSV]               │
└───────────────────────────────────────────────────────────────┘
```

---

### 5.11 ANNIVERSARI E RICORRENZE AUTOMATICHE

**Obiettivo:** l'utente salva date significative che si ripetono ogni anno (compleanni, anniversari, eventi fissi) una sola volta. Il sistema le proietta automaticamente nel calendario di ogni anno.

**Gestione:**

- Tabella `recurring_events` (mese + giorno, senza anno)
- Al caricamento del calendario di un mese, il sistema genera eventi "virtuali" dalla tabella e li mostra nella griglia esattamente come gli eventi normali, con categoria `personale` e icona personalizzata
- Gli eventi virtuali NON vengono salvati in `calendar_events` (evita duplicati): sono calcolati in memoria ogni volta
- Distinzione visiva: bordo tratteggiato o badge "annuale" nella pill dell'evento

**Aggiunta ricorrenza:**

- Nel `EventModal` standard, un toggle "Ripeti ogni anno" trasforma l'evento in ricorrenza annuale anziché singolo
- Oppure da Impostazioni → sezione "Ricorrenze annuali" con lista CRUD completa

**Notifiche:** N giorni prima (configurabile per evento, default 3) compare una notifica in-app: "Dopodomani: compleanno di Marco 🎂"

**Icone suggerite:** 🎂 compleanno, 💍 anniversario, 🎉 festa, 📅 scadenza, ⭐ ricorrenza generica — selezionabili da un picker emoji compatto nel form.

**Mobile:** funziona esattamente come sul desktop; le ricorrenze virtuali appaiono nella griglia e nel DayDrawer/BottomSheet.

---

### 5.12 STATISTICHE COMPARATIVE MENSILI

**Obiettivo:** in Finanze e Firme, affiancare ai dati del mese corrente un confronto immediato con il mese precedente, senza cambiare vista.

**Implementazione — Finanze:**

Le KPI card già esistenti si arricchiscono di un delta:

```
┌─────────────────────────────┐
│  Uscite mese                │
│  € 1.240                    │
│  ▲ +€ 180 vs aprile  (+17%) │  ← rosso se spese aumentate
└─────────────────────────────┘
```

Nuova card "Confronto mensile" nella colonna sinistra:

```
┌─ vs Aprile 2026 ──────────────────┐
│  Entrate    +€ 0    (=)           │
│  Uscite     +€ 180  ▲ peggio      │
│  Risparmio  −€ 180  ▼ meno        │
│  Casa        =      (stabile)     │
│  Cibo       −€ 42   ▼ meglio      │
└───────────────────────────────────┘
```

**Implementazione — Firme:**

Nelle KPI card:

```
┌─────────────────────────┐
│  Ore totali             │
│  86h 20m                │
│  ▲ +3h 20m vs aprile    │  ← verde se più ore
└─────────────────────────┘
```

**Calcolo (`formatters.js`):**

```js
// Confronta due mesi di dati e restituisce delta e direzione
export function compareMonths(currentData, previousData, type) {
  // type: 'finance' | 'work'
  // returns: { delta, pct, direction: 'up'|'down'|'equal', isBetter: bool }
}
// isBetter è contestuale: per le uscite "down" è meglio, per le ore lavorate "up" è meglio
```

**Fetch dati mese precedente:** al caricamento del pannello, viene effettuata una query aggiuntiva leggera (solo aggregati, non i singoli record) per il mese precedente. I dati vengono messi in cache nello store per evitare refetch alla navigazione.

---

### 5.13 SHORTCUT DA TASTIERA (DESKTOP)

**Obiettivo:** permettere agli utenti power-user di navigare e agire rapidamente senza mouse.

**Mappa shortcut:**

| Tasto   | Azione                                                          |
| ------- | --------------------------------------------------------------- |
| `N`     | Apre modal Nuova nota (da qualsiasi pannello)                   |
| `T`     | Apre modal Nuova sessione Firme                                 |
| `E`     | Apre modal Nuovo evento calendario                              |
| `F`     | Apre modal Nuova transazione Finanze                            |
| `R`     | Apre modal Nuovo piano Risparmio                                |
| `Esc`   | Chiude il modal aperto / chiude il drawer notifiche             |
| `?`     | Mostra overlay con lista shortcut disponibili                   |
| `1`–`8` | Naviga al pannello corrispondente (1=Overview … 8=Impostazioni) |
| `←` `→` | Cambia mese nel selettore (nei pannelli con mese attivo)        |

**Implementazione (`keyboardShortcuts.js`):**

```js
// Hook globale montato in App.jsx — attivo solo su desktop (no touch)
// Le shortcut sono disabilitate quando il focus è su un input/textarea

export function useKeyboardShortcuts({ openModal, navigate, changeMonth }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      switch (e.key) {
        case "n":
        case "N":
          openModal("note");
          break;
        case "t":
        case "T":
          openModal("sessione");
          break;
        case "e":
        case "E":
          openModal("evento");
          break;
        case "f":
        case "F":
          openModal("transazione");
          break;
        case "r":
        case "R":
          openModal("risparmio");
          break;
        case "Escape":
          closeAll();
          break;
        case "?":
          openModal("shortcuts");
          break;
        case "ArrowLeft":
          changeMonth(-1);
          break;
        case "ArrowRight":
          changeMonth(+1);
          break;
        default:
          if ("12345678".includes(e.key)) navigate(+e.key - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
```

**Overlay shortcut (`?`):**

- Modal compatto centrato con blur globale
- Due colonne: Navigazione | Azioni
- Ogni riga: `[tasto]  descrizione`
- Chiudibile con `Esc` o click fuori

**Visibilità:** le shortcut sono attive solo su desktop (rilevato con `window.matchMedia('(pointer: fine')`). Su mobile il listener non viene montato.

**Hint visivo:** nell'header, un bottone `?` discreto (icona outline, 28px) apre l'overlay shortcut per chi non le conosce.

---

- **Mount pagina:** `fadeInUp` (y: 20→0, opacity 0→1, 300ms ease-out)
- **Stagger card:** delay 50ms per ogni card nella stessa riga
- **Grafici Recharts:** `animationDuration={800}`, easing ease-out
- **AnimatedNumber KPI:** conta da 0 al valore in 600ms
- **Progress bar:** si riempie da 0% al valore in 800ms ease-out
- **Modal:** `scale(0.96)+opacity(0) → scale(1)+opacity(1)` in 220ms spring; overlay blur in 180ms
- **Carousel:** AnimatePresence con slide + spring; dot indicator con scaleX animato
- **Hover card:** `translateY(-2px) + shadow upgrade` in 150ms
- **Bottom nav mobile:** icona attiva con spring bounce (scale 1→1.15→1)
- **Suggerimento ferie:** banner che scende dall'alto con spring

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 300ms ease-out forwards;
}
.animate-scale-in {
  animation: scaleIn 220ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

---

## 7. REGOLE UI GLOBALI

1. **Above the fold desktop:** nessun pannello richiede scroll di pagina su ≥1280px. Le liste interne usano `overflow-y: auto` con `max-height` calcolato dinamicamente.
2. **Grid senza spazi vuoti:** `grid-template-columns: repeat(N, minmax(0, 1fr))` e `flex: 1` sistematicamente. Le card crescono per riempire lo spazio.
3. **Modal blur globale:** ogni modal usa `ModalPortal` con `position: fixed; inset: 0; backdrop-filter: blur(8px)`. Mai blur parziale o scoped.
4. **Selettore mese:** presente solo nei pannelli con dati mensili (Calendario, Firme, Finanze, Salute). Assente in Overview, Risparmi, Note, Impostazioni.
5. **Carousel Overview:** frecce + dot + swipe mobile. Transizione Framer Motion AnimatePresence.
6. **Colori categorie calendario:** sempre `--event-*` dal design system.
7. **Firme retroattive:** il form non blocca mai la data. Badge "ins. manuale" sulle sessioni retroattive.
8. **Transazioni periodiche:** generate automaticamente lato client al caricamento del mese, salvate su Supabase se non già presenti.
9. **Notifiche:** generate client-side al mount; il drawer non usa blur (non è un modal).
10. **TimeBlockSelector:** su mobile passa a scroll orizzontale con snap a card intera.

---

## 7b. RESPONSIVE MOBILE — SPECIFICHE DETTAGLIATE

**Filosofia mobile:** su mobile lo scroll verticale è consentito. L'obiettivo non è "above the fold" ma "above the first scroll" per i contenuti più importanti (KPI, azione principale). La navigazione è sempre fissa in basso.

**Navigazione mobile (BottomNav):**

- 5 voci fisse: Overview · Calendario · Firme · Finanze · (●) Altro
- Tap su "Altro" → drawer che sale dal basso con le voci mancanti (Risparmi, Salute, Note, Impostazioni)
- Icona attiva: scale spring 1→1.15→1 + colore primario
- Altezza barra: 60px + safe area inset (per iPhone con notch)

**Layout per pannello su mobile (< 640px):**

| Pannello     | Layout mobile                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Overview     | KPI 2×2 grid → Carousel grafico → Quick Actions → Lista eventi → Lista transazioni → Week strip (tutto in colonna, scroll) |
| Calendario   | Griglia full-width compatta (celle più piccole) → Drawer in bottom sheet al tap sul giorno                                 |
| Firme        | KPI 2×2 → Grafico scroll orizzontale → Lista sessioni                                                                      |
| Finanze      | KPI 2×2 → Grafico → Lista tx con swipe-to-delete → Strip previste orizzontale                                              |
| Risparmi     | Smart advice card → Lista piani (card full-width) → Grafico proiezione                                                     |
| Salute       | KPI 2×2 → Globo centrato (180px) → Heatmap scroll orizzontale → Grafici                                                    |
| Note         | Griglia 1 colonna                                                                                                          |
| Impostazioni | Lista sezioni → tap apre la sezione in scroll verticale; TimeBlockSelector scroll orizzontale snap                         |

**TimeBlockSelector su mobile:**

```
Scroll orizzontale con snap:
[← Lun ●][Mar ●][Mer ●][Gio ●][Ven ●][Sab ][Dom →]
          ↑ card attiva evidenziata, altre visibili parzialmente
```

**Globo corsa su mobile:** 180px di diametro, centrato. I KPI si impilano in 2 colonne sotto.

**Swipe gestures:**

- Lista transazioni Finanze: swipe left → mostra bottone "Elimina" in rosso
- Carousel Overview: swipe left/right per cambiare slide
- Bottom drawer (Altro): swipe down per chiudere

**Touch targets:** tutti i bottoni e le aree cliccabili ≥ 44×44px (Apple HIG standard).

**Safe areas:** usare `env(safe-area-inset-bottom)` per il padding della BottomNav su dispositivi con notch/home indicator.

---

## 8. CONFIGURAZIONE VITE

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

---

## 9. VARIABILI D'AMBIENTE

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

---

## 10. ORDINE DI SVILUPPO CONSIGLIATO

1. Setup Vite + React + Tailwind + Router + Zustand
2. Design system: variabili CSS, Card, Button, ModalPortal (blur globale), Carousel, AnimatedNumber, TimeBlockSelector
3. Layout: Sidebar + BottomNav (con safe area) + Header (variante A/B) + PageWrapper
4. Supabase: schema completo (incluse `recurring_events`, `weight_log`, `notifications_read`) + seed categorie default
5. **Onboarding wizard** (step 5.9): primo punto di contatto, deve funzionare prima di tutto il resto
6. Impostazioni: TimeBlockSelector lavoro/studio/palestra + reddito + ferie + salute + sezione Esporta
7. Sistema notifiche: `useNotifications.js` + NotificationBell + NotificationDrawer
8. Overview: KPI + ChartCarousel + sidebar attività + QuickActions + NotificationBell
9. Firme: SessionForm (retroattivo) + WorkLog + WorkStats + WorkChart + **delta vs mese precedente**
10. Calendario: CalendarGrid + italianHolidays + DayDrawer + LeaveModal + HolidaySuggester + **ricorrenze annuali**
11. Finanze: transazioni + periodici + grafici + PlannedExpenses + swipe-to-delete + **delta vs mese precedente**
12. Risparmi: PlanCard + PlanModal + smartSavings.js + ProjectionChart
13. Salute: GlobeProgress + weight tracking + gym schede + corsa grafici + heatmap
14. Note: masonry grid + NoteEditor
15. **Esportazione dati** (`exportData.js`): JSON backup + CSV Finanze + CSV Firme
16. **Shortcut da tastiera** (`keyboardShortcuts.js` + overlay `?`)
17. Polish: animazioni complete, dark mode, responsive mobile, above-the-fold check, Lighthouse

---

## 11. CHECKLIST PRE-DEPLOY VERCEL

- [ ] Variabili env configurate su Vercel
- [ ] RLS attivato su Supabase per tutte le tabelle (incluse `recurring_events`, `weight_log`, `notifications_read`)
- [ ] Seed categorie default eseguito
- [ ] `vercel.json` con rewrite SPA
- [ ] Onboarding wizard funzionante: tutti e 6 gli step, salvataggio intermedio, skip
- [ ] Test desktop 1280px, 1440px, 1920px — above the fold verificato su tutti i pannelli
- [ ] Test mobile 375px (iPhone SE), 390px (iPhone 14), 414px (Pro Max)
- [ ] Selettore mese assente su Overview, Risparmi, Note, Impostazioni
- [ ] Dark mode: tutti i componenti verificati incluso GlobeProgress, TimeBlockSelector, overlay shortcut
- [ ] Nessun scroll di pagina su desktop (regola globale)
- [ ] Touch targets ≥ 44px su mobile
- [ ] Safe area insets gestiti su BottomNav
- [ ] Swipe gestures funzionanti (carousel, swipe-to-delete)
- [ ] Shortcut tastiera: tutte le 10 shortcut testate, disabilitate su mobile e su input focus
- [ ] Esportazione: JSON backup scaricabile, CSV Finanze e Firme con dati corretti
- [ ] Ricorrenze annuali: appaiono nel calendario ogni anno senza duplicati in DB
- [ ] Delta comparativo: Finanze e Firme mostrano correttamente il confronto con mese precedente
- [ ] Performance Lighthouse ≥ 85

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## 12. FUNZIONALITÀ SCARTATE O IN SOSPESO

Questa sezione traccia le idee valutate ma non incluse nello scope attuale, per consultazione futura.

| Idea                                                          | Motivo non inclusa                                                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Widget "Giorno tipo"** (timeline daily planner in Overview) | Utile ma non prioritaria; i dati ci sono già, può essere aggiunta post-launch senza schema changes                           |
| **Tema colore personalizzabile** (oltre al dark mode)         | Bassa priorità rispetto alle funzionalità core; il CSS è già pronto con variabili, basta un picker in Impostazioni → Aspetto |
