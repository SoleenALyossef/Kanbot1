# Kanbot — Frontend

Kanbot is a personal Agile todo app: **Backlog → Sprint → Board**, with an AI teammate for drafting todos, planning a sprint, summarising a sprint, and project chat.

This folder contains the frontend only. The existing Express backend remains the source of truth and must not be modified for this assignment.

## 1. Requirements baseline

- React 19 + Vite + TypeScript in strict mode.
- English is the default and evaluation language, as required by v1.
- Optional Arabic + RTL is retained as an extra feature from the earlier project brief. It is **opt-in**; the app no longer switches to Arabic automatically based on the browser language.
- The API types in `src/types/api.ts` mirror the backend contract. Keep that file aligned with `server/src/types/api.ts` and do not add frontend-only fields to the API models.
- No teams, sharing, assignees, comments, custom workflow columns, subtasks, epics, attachments, email notifications, password reset, social login, AI auto-save, AI streaming, or backend changes were added.

## 2. Run locally

### Backend (terminal 1)

From the Kanbot repository root:

```bash
cd server
npm install
```

Create `server/.env` from the server's `.env.example`, then run:

```bash
npm run seed
npm run dev
```

The backend should be available at `http://localhost:4000/api`. **Warning:** `npm run seed` resets the local demo database.

To use real Gemini AI, configure the key on the **server only**:

```env
AI_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.5-flash
```

Restart the backend and check `http://localhost:4000/api/ai/status`. It should return `mode: "ai"`. Without a key, the backend's mock AI mode remains usable and the UI shows a Mock AI badge.

### Frontend (terminal 2)

```bash
cd client
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

Then run:

```bash
npm run dev
```

Open `http://localhost:5173`. Keep this port: the Vite config uses `strictPort` and the backend CORS setup expects the frontend on port 5173.

Demo account after the backend seed:

```text
Email: demo@kanbot.dev
Password: password123
```

Never put `AI_API_KEY` in this frontend folder or in any `VITE_` variable. Vite variables are public in the browser bundle. The frontend `.env` contains only `VITE_API_URL`.

## 3. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Create the production bundle |
| `npm run typecheck` | Run strict TypeScript checking |
| `npm run lint` | Run ESLint; explicit `any` is an error |
| `npm test` | Run Vitest unit/component tests |
| `npm run preview` | Preview the production bundle |

Before submission, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` in that order. The test suite includes API client, auth routing, i18n parity, calendar model, activity, burndown, sprint health, export, todo movement, and a UI component.

## 4. Design decisions

### Typography

- **Inter** is used for English interface text and display headings. It has clear letterforms, strong numeral readability, and a calm product-interface feel.
- **IBM Plex Sans Arabic** is used for Arabic. It remains legible in dense tables, labels, and compact controls.
- Body text uses a slightly larger base size and more generous line height; form labels and secondary text were increased so the interface does not rely on tiny, low-contrast typography.

The fonts load from Google Fonts, with system sans-serif fallbacks if the font service is unavailable.

### Visual system

- CSS design tokens centralise colour, type, spacing, border radii, focus, and shadow values.
- The base theme is a restrained indigo/ink palette with a single warm accent reserved for AI actions. The five accent choices and light/dark themes are optional personalisation features.
- Status and priority always retain text or icons; colour is never the only signal.
- Lucide icons are used consistently. CSS is kept in the project rather than introducing a large component framework, which keeps the app light and makes the design system easy to inspect.
- Framer Motion is not required by the app; motion is implemented with small CSS transitions/animations and respects `prefers-reduced-motion`.

## 5. Base requirement coverage

The source implementation covers the acceptance criteria groups in the v1 requirements:

| Group | Coverage in the frontend |
|---|---|
| AUTH-1…6 | Registration, login, `/auth/me` restore, logout, guest/private guards, redirect preservation, global 401 expiry handling |
| PRJ-1…5 | Project list, create/edit/delete with validation and confirmation, switcher, project id in the route |
| BL-1…7 | Ordered backlog, counts/points, quick create, full todo details, delete confirmation, optimistic drag reorder + rollback, search/filters, move to planned/active sprint or backlog |
| SPR-1…3 | Create planned sprints, edit/delete planned sprints, start date/end date validation, active-sprint guard |
| SPR-4…5 | Active sprint board, four required columns, counts/progress, sortable cards, keyboard and menu alternatives |
| SPR-6 | Complete-sprint confirmation, done/not-done counts, story-point completion, Backlog/planned-sprint destination, optional AI summary |
| SPR-7 | Sprint list, detail statistics, carried-over count, todo groups, saved summary and regenerate action |
| AI-1…5 | Project AI drawer/chat, quick actions, draft todo generation, sprint planning, summary generation, Mock AI badge, loading/error/retry states and review-before-save behaviour |

The full criterion-by-criterion notes and the verification status are in [`REQUIREMENTS-AUDIT.ar.md`](./REQUIREMENTS-AUDIT.ar.md).

## 6. Additional features retained

These are enhancements beyond the required v1 scope. They do not replace or alter the required Backlog/Sprint/Board flow.

### Navigation and productivity

- Project Overview with progress, priority distribution, due-soon items, and a getting-started checklist.
- Command palette: `Ctrl/Cmd + K` to search todos, switch projects, navigate, and launch actions.
- Keyboard shortcuts: `?` opens shortcut help, `c` creates a todo, `/` focuses backlog search, and `g` then `p/l/b/s` navigates.
- Today / Focus view: overdue, due today, and upcoming todos.
- Focus Mode: one selected todo with adjustable Pomodoro focus/break lengths and session count.
- Redesigned monthly Calendar: month navigation, all/open/done filters, summary counters, priority legend, selectable day agenda, and direct access to todo details.
- Local todo templates, bulk backlog actions, and undo after moving a todo.

### Agile reporting

- Sprint Health indicator based on actual remaining points against the ideal burndown.
- Capacity panel: done/remaining/carried-over points, editable local capacity, and over-capacity warning.
- Burndown and completed-sprint Velocity visualisations.
- Sprint report with print / Save as PDF and CSV export. Sprint and backlog Markdown/CSV exports are also available.

### AI enhancements

- Page-aware suggested prompts, stand-up helper, Improve with AI and Estimate with AI actions, and a typewriter reveal for completed AI responses.
- AI output remains a draft until the user explicitly confirms saving it. The frontend does not stream tokens and does not let AI mutate project data by itself.

### Convenience and presentation

- Optional Arabic + RTL language switch (English remains the initial/default language).
- Light/dark theme, five accent colours, and responsive layouts.
- Optional browser reminders, enabled only after the user grants notification permission.
- Local activity log for successful mutations, offline indicator, friendly error boundary, reduced-motion support, and dialog focus trapping.

### Local-only enhancement data

The API does not expose endpoints for every enhancement. The following are therefore stored locally in the browser and are not synchronised across devices: theme/accent/language preferences, custom templates, focus settings/session count, reminder preference, capacity override, and the activity log. The activity log is limited to recent local events. Browser reminders work while the Kanbot tab is open; there is no service worker or background push notification.

## 7. Demo walkthrough

Use this sequence for the live demo or recording:

1. Register a user or sign in with the seeded demo account.
2. Create a project and show its overview.
3. Add a few backlog todos, edit a todo, and demonstrate search/filter and reorder.
4. Open **Ask AI → Create todos**, generate draft todos, edit a draft, and explicitly add selected drafts.
5. Open **Ask AI → Plan sprint**, set capacity/focus, review the goal and suggested todos, then create the planned sprint.
6. Start the sprint and open the Board. Move a card through To Do → In Progress → In Review → Done.
7. Open **Complete sprint**. Show the done/not-done counts, `donePoints of totalPoints`, Backlog/planned-sprint radio destinations, and the optional AI summary checkbox.
8. Finish the sprint and show the saved summary/history page.
9. For extra credit, demonstrate Today, Focus, Calendar, Capacity, Burndown/Velocity, report export, templates, and the local activity log.

## 8. Known limitations and verification status

- The backend was not changed. The frontend requires the supplied backend to be running locally.
- Calendar and Today derive their views from the todo due dates; todos without a due date are called out separately.
- Focus sessions, templates, capacity override, reminder preference, and activity log are browser-local only.
- Browser reminders require notification permission and only run while the app tab is open.
- Arabic is an optional enhancement beyond the English-only v1 brief. Keep English selected during formal acceptance testing.
- AI language output depends on the backend/provider. The frontend adds a language hint for chat when Arabic is explicitly selected; server-generated sprint summaries may still be in English.
- The execution environment used to prepare this handoff could not complete `npm install` because the package registry request timed out. Therefore `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` have **not** been certified in this environment. Run them locally before submission and record the actual results. Do not treat a source/syntax inspection as a successful production build.
