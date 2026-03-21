# Waltrack PRD Memory

## Problem Statement
Create a simple Android expense tracker app called **Waltrack** for college students with four main screens:
- Dashboard
- Add Expense
- Transactions
- Insights

Design direction:
- Minimal, student-friendly, fast
- White background with green as primary color

User-selected preferences:
- Monthly budget editable from dashboard
- Currency flexibility for future settings (INR/USD support in MVP)
- Device-only data storage for MVP
- Transactions must support view, edit, delete
- Insights must include weekly trend + warnings/suggestions

## Architecture
- **Frontend:** Expo Router (React Native, TypeScript)
- **Data Storage:** AsyncStorage (local-only, persistent)
- **Analytics/Charts:** react-native-gifted-charts
- **UI System:** Centralized theme constants + reusable card/button wrappers
- **Notifications:** expo-notifications (daily local reminder scheduling)
- **Export:** expo-print + expo-sharing + expo-file-system (PDF/CSV)
- **Backend:** Existing FastAPI starter unchanged (not used by MVP per user choice)

## User Personas
1. **Budget-conscious college student**
   - Wants quick daily logging with minimal friction
2. **Data-aware student planner**
   - Wants weekly trends and category analysis
3. **Casual tracker**
   - Needs clean overview and simple edit/delete controls

## Core Requirements (Static)
- 4-screen tab navigation
- Budget overview + remaining balance + today spending + daily progress
- Category pie chart on dashboard
- Add expense (amount, category, note)
- Transactions list with date/category/amount + edit/delete
- Insights with weekly chart, trend line, highest-spend day, budget warning/suggestion
- Minimal white/green UI and touch-friendly interactions

## Implementation Log

### 2026-03-16
- Added full Expo Router tab architecture with screens:
  - `/dashboard`
  - `/add-expense`
  - `/transactions`
  - `/insights`
- Implemented local data persistence via `useExpenseStore` + AsyncStorage.
- Added reusable design system (`theme.ts`) and shared UI components.
- Implemented dashboard metrics:
  - Monthly budget
  - Remaining balance
  - Today spending
  - Daily progress bar
  - Category pie chart + legend
- Added editable budget flow directly in dashboard.
- Added currency toggle (INR/USD) and shared formatter.
- Implemented add-expense form with category grid and note field.
- Implemented transaction list with edit modal and delete action.
- Implemented insights:
  - Weekly bar chart
  - Trend line chart
  - Category analysis
  - Highest-spend day card
  - Budget warning/suggestion card
- Improved interaction quality:
  - Reanimated scale button feedback
  - Touch target fixes (>=44)
  - Scrollable edit modal for small/mobile viewports
- Added stable tab test IDs for automation.
- Updated app metadata to Waltrack branding and light splash/background.

### 2026-03-21
- Added **first-launch onboarding** screen with required validations:
  - Name
  - Email format
  - Numeric phone
  - Numeric age
- Implemented onboarding gate:
  - First launch → `/onboarding`
  - Existing profile → skip onboarding and open dashboard
- Extended persistent store with:
  - `userProfile`
  - `reminderSettings` (enabled/hour/minute/AM-PM/notificationId)
  - Queue-safe state persistence to reduce stale write risk
- Added **Settings** as 5th bottom tab with:
  - View-only profile section
  - Daily reminder toggle
  - Reminder time editor modal (12-hour AM/PM)
  - Web fallback message for reminder capability
- Integrated local notification handling:
  - Daily scheduling for mobile
  - Notification deep-link route to Add Expense screen
- Enhanced **Insights** with monthly-report UX:
  - Month selector (auto-generated from stored data months)
  - Total monthly spending
  - Remaining budget
  - Highest spending category
  - Average daily spending
  - Category pie chart
  - Weekly spending bar chart
  - Budget progress indicator
- Added export features in Insights:
  - Export as PDF (detailed report with profile + insights + all transactions)
  - Export as CSV (Date, Category, Amount, Note)
  - Web-friendly fallbacks for export interactions
- Preserved existing flows: dashboard daily-limit editing, add expense, transactions edit/delete.

## Testing Notes
- Self-testing with screenshot automation completed for core create/edit/delete flow and routing.
- Testing agent run completed (`/app/test_reports/iteration_1.json`) and all reported blockers were fixed.
- Current non-blocking console warnings on web preview:
  - `shadow*` deprecation warning
  - `pointerEvents` deprecation warning

## Prioritized Backlog

### P0 (Critical remaining)
- None for requested scope.

### P1 (Important next)
- Add profile edit flow (currently view-only by user choice).
- Add deterministic web PDF export toast after browser print lifecycle closes.
- Add reminder permission status card (granted/denied) for clarity.

### P2 (Future enhancements)
- Optional backend sync + account login.
- Export CSV/PDF spending report.
- Smart category auto-suggestion from note text.

## Next Tasks
1. Add transaction search/filter in history screen.
2. Add profile edit and account reset options in Settings.
3. Add monthly comparison cards (selected month vs previous month).
