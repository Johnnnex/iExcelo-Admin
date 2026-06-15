# Admin Panel — Tasks & Strict Rules

This file governs all upcoming Admin panel work. Every engineer (or AI) working on this must read and follow every rule in this document before touching any code. Rules are non-negotiable unless the user explicitly overrides one in the current session.

---

## ABSOLUTE RULES (never break these)

### 1 — API calls only in stores

NEVER make API calls inside components. ALL API calls go in `src/store/*.store.ts` via the `api` client (imported from `src/lib/api`). Components call store actions only.

### 2 — useEffect dependency arrays

Only primitives or state values in deps. NEVER put store methods in deps. Always add `// eslint-disable-next-line react-hooks/exhaustive-deps` when deps must be left empty or partial.

### 3 — DataTable search = built into the table via `searchProps`

The DataTable component (`src/components/molecules/DataTable.tsx`) must be extended to accept a `searchProps` prop that renders the search input INSIDE the table header area — not outside the table as a separate InputField. When the user said "the search should come from the table sir", this is what they meant. Do not put a separate search input above or beside tables; pass `searchProps` to DataTable and let it render the search input in its own header.

### 4 — CURSOR-BASED PAGINATION everywhere (NOT offset pagination)

**This is critical.** Do NOT use `page: number` offset-based pagination for any admin list table (Management, Students, Sponsors, Affiliates, Subscriptions, Testimonials, Bulk Emails). These tables must use **cursor-based pagination**:

- Backend accepts `cursor?: string` (ISO timestamp or ID of the last item) and `limit: number` (always 50)
- Backend returns `{ items: T[], nextCursor: string | null, hasMore: boolean }`
- Frontend stores cursor history as an array: `[null, cursor1, cursor2, ...]` — index 0 = page 1
- "Previous" navigates back through cursor history; "Next" uses `nextCursor`
- The DataTable pagination bar will show prev/next arrows — no page numbers
- **Exam Revision tables (Exam Types, Subjects, Topics, Passages, Questions) may keep offset-based pagination** since they were already built that way. Only the NEW/REBUILT pages use cursor-based.

### 5 — Tab independence (STRICT)

When a page has multiple tabs:

- Each tab has its OWN pagination state and search state, completely isolated
- Switching tabs NEVER resets another tab's page or search
- Each tab fetches its own data independently
- Implement this with per-tab state objects in the store, not shared pagination state

### 6 — Search/Pagination/Filter interaction rules (STRICT)

- Search RESETS page to 1 (cursors reset to `[null]`): when user submits a new search, always go to first page
- Paginating while search is active: does NOT clear the search — next/prev pages carry the active search term
- Filters do NOT clear search: applying a filter leaves the search text intact, BUT resets to page 1
- Search does NOT clear filters: typing a new search leaves active filters in place, resets to page 1
- **Rule: only page-resets happen on search/filter change. Nothing else clears anything else.**

### 7 — "Exam Type / Subject" format everywhere

Anywhere that previously showed "Exam Type → Subject" or "Exam Type -- Subject" must now show "Exam Type / Subject". This applies to:

- Table column headers
- Data display cells (e.g., "JAMB / Mathematics")
- Select option labels in dropdowns
- Page headers and sub-labels

### 8 — explanationShort + explanationLong → single `explanation` field

The Question entity currently has two separate fields: `explanationShort` (text) and `explanationLong` (text). These must be merged into ONE field: `explanation` (text, nullable). This change requires:

1. A TypeORM migration (`add-explanation-drop-old-columns`) that: renames `explanationShort` → `explanation`, then drops `explanationLong`
2. Update `Backend/src/exams/entities/question.entity.ts`
3. Update all backend DTOs and services that reference `explanationShort` or `explanationLong`
4. Update `Admin/app/(dashboard)/exam-revision/questions/QuestionForm.tsx` to use single `explanation` rich-text field
5. Update `Admin/src/schemas/exam-revision.schema.ts` to replace the two fields with one
6. Update `Admin/src/types/index.ts` IQuestion type
7. Update the Frontend exam pages: `Revision.tsx`, `Timed.tsx`, `Mock.tsx` — these show explanation after answering
8. DB must be cleared and reseeded after migration (development only — confirm with user)

### 9 — Animated bouncy tab pill

Pages with multiple tabs (Management, Subscriptions) must use a CSS-animated sliding pill indicator, NOT a static highlight that jumps. The pill slides smoothly between tab positions using CSS `transform: translateX()` + `transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)` (the cubic-bezier gives the bounce). Reference implementation: `Admin/app/(dashboard)/management/Management.tsx`.

### 10 — Page layout template

All admin pages must follow the same layout:

```
<section className="xl:px-[2rem] px-[.875rem] py-[1.25rem] flex flex-col gap-6">
  {/* Page header: title, description, action buttons */}
  {/* Main card: bg-white rounded-2xl with CARD_SHADOW */}
  {/* DataTable inside the card */}
</section>
```

`CARD_SHADOW` is imported from `src/utils`. Do not deviate from this structure.

### 11 — Difficulty values must always be capitalized

In the Questions table, difficulty values from the backend (`easy`, `medium`, `hard`) must be displayed as `Easy`, `Medium`, `Hard`. Capitalize on display, not in storage.

### 12 — Icons

All icons use `@iconify/react` with `hugeicons:*` prefix. Always verify that an icon name actually exists in hugeicons before committing. The following sidebar icons are BROKEN (they don't exist) and must be replaced:

- Sponsors: `hugeicons:hand-holding-dollar` → replace with `hugeicons:money-bag-01` or `hugeicons:gift-01`
- Messages: `hugeicons:message-blocked-01` → replace with `hugeicons:message-02`

### 13 — Frontend Chart must be copied word-for-word

The Admin's `src/components/molecules/Chart.tsx` must be a direct copy of `Frontend/src/components/molecules/Chart.tsx`. Do not simplify or rewrite it. Copy it exactly, adjusting only the import paths. Then check `Frontend/app/globals.css` for any chart-related CSS variables or classes and copy those to `Admin/app/globals.css`.

### 14 — stripMarkdownPreview in Admin utils

The utility function `stripMarkdownPreview(content, maxLen, ellipsis)` from `Frontend/src/utils/string.ts` must be copied to `Admin/src/utils/index.ts`. Use it to generate question text preview cells in the Questions table (truncate rich-text/markdown to 120 chars for display). Do NOT copy it to a separate file; add it to the existing `utils/index.ts`.

### 15 — No comments unless non-obvious

Default is ZERO comments. Only write a comment when the WHY is non-obvious. Never describe what the code does — only why it does something surprising.

---

## IMMEDIATE BUG FIXES (crash-level, do these first)

### BUG-1: `topics.map is not a function` in QuestionForm.tsx

**File:** `Admin/app/(dashboard)/exam-revision/questions/QuestionForm.tsx`
**Root cause:** Local API calls to `/admin/exam-revision/topics` and `/admin/exam-revision/passages` treat the response as `T[]` but the API now returns paginated `{ items: T[], total, page }`.

**Fix (lines 136–148):**

- Change `api.get<{ data: ITopic[] }>` to `api.get<{ data: { items: ITopic[] } }>`
  and `setTopics(res.data.data)` → `setTopics(res.data.data.items)`
- Change `api.get<{ data: IPassage[] }>` to `api.get<{ data: { items: IPassage[] } }>`
  and `setPassages(res.data.data)` → `setPassages(res.data.data.items)`

Also: align the Save/Cancel buttons to the RIGHT (currently flex-start). The Actions section at the bottom (`flex gap-3 pb-8`) needs `justify-end`.

### BUG-2: `examTypes.map is not a function` in subscriptions.store.ts

**File:** `Admin/src/store/subscriptions.store.ts`
**Root cause:** `fetchExamTypes` at line 69 calls `/admin/exam-revision/exam-types` with no pagination params. The endpoint now returns `{ items: T[], total, page }`. The store does `set({ examTypes: res.data.data })` setting examTypes to a paginated object, not an array.

**Fix:**

- Add `?limit=200` to the exam types URL so it fetches all exam types in one shot (exam types are few)
- Change `set({ examTypes: res.data.data })` to `set({ examTypes: res.data.data.items ?? [] })`
- Also update the TypeScript type annotation: `api.get<{ data: { items: IExamType[] } }>`

Same fix applies anywhere else a store fetches exam types for use as a filter/dropdown and uses `res.data.data` directly (verify `subscriptions.store.ts` only — other stores like `exam-revision.store.ts` already handle it correctly).

---

## COMPONENT UPGRADES

### COMP-1: DataTable — add searchProps

**File:** `Admin/src/components/molecules/DataTable.tsx`

Add a new optional prop:

```typescript
searchProps?: {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;  // called on Enter key or Search button
  placeholder?: string;
}
```

When `searchProps` is provided, render a search bar inside the table header area — specifically, add a new `<div>` row ABOVE the `<thead>` (inside the container, outside the table element) that shows:

- A search icon (`hugeicons:search-01`) on the left
- The text input bound to `searchProps.value`/`searchProps.onChange`
- On Enter key: calls `searchProps.onSearch()`
- Styled as: white bg, border-b `#F0F2F5`, px-4 py-3, input with border `#D0D5DD`, rounded-lg, focus:border `#007FFF`

This replaces ALL existing manual search bars built above/beside tables in ExamRevision.tsx and other pages.

### COMP-2: Admin ProfileDropdown — rebuild

**File:** `Admin/src/components/organisms/AdminProfileDropdown.tsx`

Copy the Frontend's `ProfileDropdown` component pattern from `Frontend/src/components/organisms/ProfileDropdown.tsx` and adapt it for Admin:

- No exam type switcher (admin has no exam type context)
- Show "Super Admin" badge under the name (or the admin's actual role)
- Menu items: "View Profile" (link to `/profile`) and "Logout"
- Keep the same popover/dropdown animation and styling as the Frontend version
- Import admin auth store (`useAdminAuthStore`) instead of student store

### COMP-3: Admin Dashboard — rebuild card layout

**File:** `Admin/app/(dashboard)/dashboard/Dashboard.tsx`

Replace the existing dashboard cards with the Frontend analytics page card style:

- Each card: `bg-white rounded-2xl p-5` with `CARD_SHADOW`
- Inside: icon box on the left (colored square bg, icon inside), title + description label on the right, big number below, and a delta badge (green for positive, red for negative, neutral for zero)
- Reference: `Frontend/src/app/(dashboard)/student/analytics/Analytics.tsx` — copy the card layout pixel-by-pixel
- Also replace the `Chart` component import with the fixed word-for-word copy (COMP-4)
- Keep the granularity selector (Daily/Weekly/Monthly) for the line chart

### COMP-4: Admin Chart.tsx — replace with Frontend copy

**File:** `Admin/src/components/molecules/Chart.tsx`

Delete current content. Copy `Frontend/src/components/molecules/Chart.tsx` exactly, adjusting import paths only. Then copy any chart-related CSS from `Frontend/app/globals.css` to `Admin/app/globals.css` (look for recharts or chart class overrides).

---

## EXAM REVISION IMPROVEMENTS

### ER-1: QuestionForm — explanation merge (after ARCH-1 migration is run)

After the DB migration (ARCH-1) merges `explanationShort`/`explanationLong` into `explanation`:

- Remove the two separate explanation fields from QuestionForm
- Replace with a single `explanation` rich-text field (`type="rich-text"`)
- Label: "Explanation (shown after answering)"
- Update `questionSchema` in `src/schemas/exam-revision.schema.ts`
- Update `IQuestion` type in `src/types/index.ts`

### ER-2: Questions table — filter button approach

**File:** `Admin/app/(dashboard)/exam-revision/ExamRevision.tsx` (Questions tab section)

Filters (exam type/subject, question type, difficulty) must use a "Filter" button approach:

- A "Filter" button with icon opens a filter panel (dropdown or inline, not modal)
- User sets filter values, then clicks "Apply" — ONLY then does the API call happen
- Each active filter shows a badge/chip with an individual X to clear just that filter
- Apply button calls `fetchQuestions(1)` after updating `questionFilters` in store
- NEVER auto-fetch on every dropdown change (no debounce approach)
- The exam type / subject select shows options in "ExamType / Subject" format

### ER-3: Questions table — search from DataTable

Remove any manual search input above the Questions table. Pass `searchProps` to `<DataTable>`:

```tsx
searchProps={{
  value: questionFilters.search,
  onChange: (v) => setQuestionFilters({ search: v }),
  onSearch: () => fetchQuestions(1),
  placeholder: "Search question text..."
}}
```

### ER-4: Questions table — text preview with stripMarkdownPreview

In the Questions table column for `questionText`, use `stripMarkdownPreview(q.questionText, 120, true)` to show a truncated preview of the question text. Import `stripMarkdownPreview` from `@/src/utils` (after COMP-5 adds it there).

### ER-5: Topics tab — use DataTable searchProps

Remove the manual search input above the Topics table in ExamRevision.tsx. Pass `searchProps` to the DataTable connected to `topicsSearch`/`setTopicsSearch`/`fetchTopics(1)`.
The subject filter dropdown must remain as-is (separate from table). Add a "Clear filter" text button (hugeicons:filter-remove icon) next to the filter when a subject is selected.

### ER-6: Passages tab — use DataTable searchProps + format fix

- Remove manual search input; use DataTable `searchProps` with `passagesSearch`/`setPassagesSearch`/`fetchPassages(1)`
- Change all "Exam Type → Subject" and "Exam Type -- Subject" occurrences to "Exam Type / Subject" in column headers, data cells, and select options
- Add clear filter button when ETS filter is active

### ER-7: Subjects tab — redesign with two sub-tabs

The Subjects section needs a redesign with two tabs using animated bouncy pill (same as Management):

- Tab 1: "Subjects" — the existing subjects table with DataTable searchProps
- Tab 2: "Exam Type Links" — table of `examTypeSubjects` (ExamType / Subject pairs, isCompulsory flag, date linked, unlink action), with DataTable searchProps
- "Link" button opens a modal: select Exam Type, select Subject, toggle isCompulsory, then save
- Subjects are global (not tied to exam type) — creation/edit does NOT include exam type
- Each tab has independent pagination and search state (see Rule 5)

### ER-8: Exam Types tab — use DataTable searchProps

Remove the manual search input above the Exam Types table. Pass `searchProps` connected to `examTypesSearch`/`setExamTypesSearch`/`fetchExamTypes(1)`.

### ER-9: Topics create/edit page — TipTap fixes

**File:** `Admin/app/(dashboard)/exam-revision/topics/[topicId]/page.tsx` (and new topic page)

- Make the TipTap editor container taller: `min-height: 400px`
- Fix white background on TipTap: the editor should have `background: transparent` or match the card background, not a hard white that clashes with the card's white bg. Use a subtle border instead.

### ER-10: Passages create/edit page — same TipTap fixes

Same fixes as ER-9 for the passages add/edit page.

---

## PAGE REBUILDS

### PAGE-1: Admin Management — animated tabs + cursor pagination + search

**File:** `Admin/app/(dashboard)/management/Management.tsx`

1. Add animated bouncy pill tab indicator (CSS sliding, not jump — see Rule 9)
2. Tab: "Admins" — cursor-based pagination (limit=50), DataTable searchProps (search by name + email)
3. Tab: "Role Templates" — cursor-based pagination (limit=50), DataTable searchProps (search by role name + description)
4. Each tab's pagination and search is fully independent (Rule 5)
5. Backend endpoints for Management must be updated to support cursor-based pagination (see BACKEND-1)

### PAGE-2: Students — complete redesign

**File:** `Admin/app/(dashboard)/students/Students.tsx` (or wherever it lives)

1. Follow the page layout template (Rule 10): header with title + description, card with DataTable
2. DataTable searchProps: search by student name and/or email
3. Cursor-based pagination, limit=50
4. Column: name, email, exam subscriptions count, joined date, status, actions
5. Actions column: "Reset Password" button — opens a small modal to set a new password for the student (admin side, calls backend endpoint `PATCH /admin/students/:id/reset-password` with `{ newPassword: string }`)
6. Backend must have the `reset-password` endpoint added

### PAGE-3: Sponsors — complete redesign

**File:** `Admin/app/(dashboard)/sponsors/Sponsors.tsx`

1. Same page layout template
2. DataTable searchProps: search by name and/or email
3. Cursor-based pagination, limit=50
4. Actions column: "Send Password Reset Link" — sends an email to the sponsor with a reset link (calls `POST /admin/sponsors/:id/send-reset-link`, dispatches via BullMQ emails queue)

### PAGE-4: Affiliates — complete redesign

**File:** `Admin/app/(dashboard)/affiliates/Affiliates.tsx`

1. Same page layout template
2. DataTable searchProps: search by name, referral code, and/or email
3. Cursor-based pagination, limit=50

### PAGE-5: Subscriptions — complete redesign with 3 tabs

**File:** `Admin/app/(dashboard)/subscriptions/Subscriptions.tsx`

1. Fix BUG-2 first (examTypes.map crash)
2. Redesign with 3 tabs using animated bouncy pill (Rule 9):
   - Tab 1: "Student Subscriptions" — subscriptions NOT under a sponsor, search by student name/email, cursor pagination, status + exam type filters, same override/cancel actions
   - Tab 2: "Sponsor Subscriptions" — group by sponsor, show sponsor name/email, click row to open a drawer/modal listing all students under that sponsor's subscription
   - Tab 3: "Subscription Plans" — view/add/edit subscription plans (name, price, currency, duration days, Paystack plan code, Stripe plan code, isActive toggle)
3. Each tab has independent state (Rule 5)
4. Animated tab pill (Rule 9)
5. Backend endpoints: add plans CRUD endpoints (`/admin/subscription-plans`), and a sponsor-grouped subscriptions endpoint

### PAGE-6: Testimonials — complete redesign

**File:** `Admin/app/(dashboard)/testimonials/Testimonials.tsx`

1. Same page layout template
2. DataTable searchProps: search by student name or testimonial text
3. Cursor-based pagination, limit=50
4. Action column: "Publish" toggle button (shows "Publish" if unpublished, "Unpublish" if published)
5. Backend: add `isPublished` toggle endpoint if not already present (`PATCH /admin/testimonials/:id/publish`)

### PAGE-7: Bulk Emails — complete redesign

**File:** `Admin/app/(dashboard)/bulk-emails/BulkEmails.tsx`

1. Main page: list of past campaigns (name, status, recipient count, sent date, created date)
2. DataTable searchProps: search by campaign name
3. Cursor-based pagination
4. "New Campaign" button → navigates to a full separate page (like topics/passages form pages): `/bulk-emails/new`
5. The "New Campaign" page has:
   - Campaign name (`InputField type="text"`)
   - Subject line (`InputField type="text"`)
   - Recipient group (`InputField type="select"` — options: All Students, All Sponsors, All Affiliates, Students subscribed to updates, Students subscribed to promotions)
   - Email body (`InputField type="rich-text"`) — full TipTap editor
   - Schedule date/time (optional, `InputField type="datetime-local"`)
   - "Send Campaign" button — creates the campaign, dispatches to BullMQ emails queue
6. Backend: campaign creation endpoint reads recipients from DB based on `recipientGroup`, filters by `subscribedToUpdates` or `subscribedToPromotionalEmails` fields (see ARCH-2), then enqueues individual email jobs in batches of 50

---

## ARCHITECTURE / SCHEMA CHANGES

### ARCH-1: Merge explanationShort + explanationLong → explanation

1. Create TypeORM migration: `Admin/Backend/src/migrations/<timestamp>-merge-explanation-fields.ts`
   - Add column `explanation` (text, nullable) — copy value from `explanationShort` as initial value
   - Drop column `explanationShort`
   - Drop column `explanationLong`
2. Update entity: `Backend/src/exams/entities/question.entity.ts`
3. Update all backend create/update DTOs for questions
4. Update all backend services that read `explanationShort` or `explanationLong`
5. Update Admin frontend: QuestionForm.tsx (see ER-1)
6. Update Frontend exam pages for explanation display
7. Clear and reseed DB after migration (development)

### ARCH-2: Add email subscription preference fields to User entity

The User entity needs two new boolean fields:

- `subscribedToUpdates: boolean` (default: true) — user wants product update emails
- `subscribedToPromotionalEmails: boolean` (default: false) — user has opted in to promotional emails

This requires:

1. TypeORM migration: add both columns to the `users` table with the specified defaults
2. Update `Backend/src/users/entities/user.entity.ts` (or wherever User is defined)
3. The Bulk Emails campaign dispatch must filter recipients by these fields

### BACKEND-1: Cursor-based pagination for admin list endpoints

Update these backend endpoints to support cursor-based pagination:

- `GET /admin/management/admins` — accept `cursor?: string`, `limit: number`, return `{ items, nextCursor, hasMore }`
- `GET /admin/management/roles` — same
- `GET /admin/students` — same
- `GET /admin/sponsors` — same
- `GET /admin/affiliates` — same
- `GET /admin/subscriptions` (individual) — same
- `GET /admin/subscriptions/sponsors` (new — sponsor-grouped) — offset is fine here since groups are few
- `GET /admin/testimonials` — same
- `GET /admin/bulk-emails/campaigns` — same

Cursor implementation pattern:

```typescript
// cursor is the `createdAt` ISO string of the last item on the previous page
const qb = repo
  .createQueryBuilder("e")
  .orderBy("e.createdAt", "DESC")
  .take(limit + 1);
if (cursor) qb.where("e.createdAt < :cursor", { cursor: new Date(cursor) });
const items = await qb.getMany();
const hasMore = items.length > limit;
if (hasMore) items.pop();
const nextCursor = hasMore
  ? items[items.length - 1].createdAt.toISOString()
  : null;
return { items, nextCursor, hasMore };
```

### BACKEND-2: Add reset-password endpoint for students

`PATCH /admin/students/:id/reset-password`

- Body: `{ newPassword: string }`
- Hashes the new password with bcrypt
- Updates the user's password column
- Returns 200 on success
- Only accessible by admins with WRITE permission on STUDENTS module

### BACKEND-3: Add send-reset-link endpoint for sponsors

`POST /admin/sponsors/:id/send-reset-link`

- Finds the sponsor's user email
- Generates a password reset token
- Enqueues a "password_reset" email job in the BullMQ emails queue
- Returns 200 on success

---

## SIDEBAR FIXES

### SIDEBAR-1: Fix broken icons

In `Admin/src/components/organisms/AdminSidebar.tsx`:

- `Sponsors` icon: change `hugeicons:hand-holding-dollar` to a valid icon (e.g., `hugeicons:gift-01`)
- `Messages` icon: change `hugeicons:message-blocked-01` to `hugeicons:message-02`

---

## ADMIN UTILS

### UTIL-1: Add stripMarkdownPreview to Admin utils

**File:** `Admin/src/utils/index.ts`

Add the following function (copy exactly from `Frontend/src/utils/string.ts`):

```typescript
export function stripMarkdownPreview(
  content: string,
  maxLen = 120,
  ellipsis = false,
): string {
  const stripped = content
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, " ")
    .replace(/<(br|hr)\s*\/?>/gi, " ")
    .replace(/<img[^>]*>/gi, "(Image)")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "(Image)")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\$\$?[^$]*\$\$?/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const truncated = stripped.slice(0, maxLen);
  return ellipsis && stripped.length > maxLen ? truncated + "…" : truncated;
}
```

---

## EXECUTION ORDER

Tackle tasks in this order to minimize blocked work:

1. **BUG-1** + **BUG-2** — crash fixes first (can be done in parallel)
2. **UTIL-1** — needed by ER-4
3. **COMP-1** (DataTable searchProps) — needed by all ER and PAGE tasks that use DataTable search
4. **SIDEBAR-1** — quick fix
5. **ER-8**, **ER-5**, **ER-6**, **ER-3** — Exam Revision search cleanups (use COMP-1)
6. **ER-2** + **ER-7** — Exam Revision filter button and Subjects redesign
7. **COMP-4** + **COMP-3** — Chart copy, Dashboard rebuild
8. **COMP-2** — ProfileDropdown rebuild
9. **PAGE-1** — Management (animated pill + cursor pagination)
10. **PAGE-2** — Students
11. **PAGE-3** — Sponsors
12. **PAGE-4** — Affiliates
13. **PAGE-5** — Subscriptions
14. **PAGE-6** — Testimonials
15. **PAGE-7** — Bulk Emails
16. **ARCH-1** — explanation merge (schema change — do after all form work is stable)
17. **ARCH-2** — email subscription fields
18. **BACKEND-1** through **BACKEND-3** — cursor-based backend endpoints (coordinate with frontend PAGE tasks)
