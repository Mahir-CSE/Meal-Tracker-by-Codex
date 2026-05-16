# 🍽️ Tekarsh Meal Tracker

A lightweight, browser-based daily meal and attendance tracker for office teams. No backend, no framework — just HTML, CSS, and vanilla JavaScript, with all data persisted in `localStorage`.

---

## ✨ Features

- **Daily attendance tracking** — mark each employee as Work from Office, Work from Home, or on Leave
- **Meal order counts** — automatic lunch and dinner tallies based on work status and role rules
- **Smart defaults** — QA staff default to WFH on Fridays, Dev staff on Thursdays; QA dinner defaults to No
- **Date navigation** — jump between days with Prev/Next buttons or the date picker
- **Office closed toggle** — mark any date as closed; attendance and meals reset to zero
- **Weekend screen** — Saturday and Sunday automatically show a "no orders needed" state
- **Employee management** — add, edit, rename, or delete employees via a modal form with live validation
- **Employee profiles** — store ID, phone, and email per employee; IDs are locked after creation
- **Role & status filters** — filter the table by job role or work status; live search by name
- **Per-employee details page** — view meal history across a week, month, or year with period navigation
- **Export to CSV** — download a comma-separated file for the current day or selected period
- **Export to PDF** — print-optimized layout for the current view via `window.print()`

---

## 📁 Project Structure

```
├── index.html          # Main tracker page
├── details.html        # Per-employee meal history page
├── styles.css          # All styles (shared across both pages)
├── app-data.js         # Employee list, data schema, validation helpers
├── employee-ui.js      # Modal system for add/edit/view employee (IIFE module)
├── app.js              # Main page logic: state, render, filters, export
├── details.js          # Details page logic: period navigation, history, export
└── outputs/
    └── lunch-tracker/
        └── lunch_dinner_tracker.xlsx   # Reference spreadsheet
```

---

## 🚀 Getting Started

No build step or server required. Just open the file in a browser:

```bash
# Clone the repo
git clone https://github.com/your-username/i-want-to-create-a-lunch.git

# Open in browser
open index.html
```

Or drag `index.html` directly into any modern browser.

> **Note:** Because the app uses `localStorage`, all data is saved in your browser automatically and persists across page reloads. No account or login needed.

---

## 🧩 How It Works

### State

All application state is stored as a single JSON object in `localStorage` under the key `office-meal-tracker-v3`. The shape is:

```js
{
  staff: ["Name One", "Name Two", ...],
  roles: { "Name One": "QA", "Name Two": "Dev", ... },
  days: {
    "2025-05-16": {
      "Name One": {
        status: "Work from Office",
        statusOverride: null,
        lunch: "Yes",
        dinner: "No",
        notes: ""
      }
    }
  },
  closedDates: { "2025-05-01": true },
  employeeProfiles: {
    "Name One": { id: "200001", phone: "01700000000", email: "name@company.com", idLocked: true }
  }
}
```

### Meal Rules

| Work Status | Lunch | Dinner |
|---|---|---|
| Work from Office (most roles) | Yes | Yes |
| Work from Office (QA) | Yes | No (can be changed) |
| Work from Home | No | No |
| Leave | No | No |

### Default WFH Days

| Role | Default WFH day |
|---|---|
| QA | Friday |
| Dev | Thursday |
| All others | None (always Office by default) |

These defaults can be overridden per employee per day.

---

## 📄 Pages

### `index.html` — Main Tracker

- Summary metrics bar (lunch orders, dinner orders, WFH count, leave count, working days this month)
- Control panel: Add Employee button, search input, role filter dropdown, office open/closed toggle
- Status filter tabs: All / Office / WFH / Leave
- Attendance table with inline role, status, lunch, dinner, and notes controls per employee
- Click any row or employee name to navigate to their details page

### `details.html` — Employee Details

- Accessed via `details.html?employee=Name&date=YYYY-MM-DD`
- Period selector: Week / Month / Year view with Prev/Next navigation
- Summary bar: totals for office days, WFH days, leave, weekends, lunches, dinners
- Day-by-day table with editable work status per row
- Export to CSV or PDF for the selected period

---

## 🛠️ Technologies

| Technology | Usage |
|---|---|
| HTML5 | Semantic structure, `<dialog>` for modals, `<table>` for tracker |
| CSS3 | Custom properties, Flexbox, Grid, `@media print` for PDF |
| Vanilla JavaScript (ES2022) | DOM manipulation, `localStorage`, `Blob` for CSV download |
| No frameworks | Zero dependencies, no build step |

---

## 🧪 Validation Rules (Add / Edit Employee)

| Field | Rule |
|---|---|
| Employee ID | 6+ digit number (auto-generated for new employees, locked after save) |
| Name | Letters and spaces only |
| Phone | Exactly 11 digits |
| Email | Optional; must be a valid email format if provided |

Duplicate names and duplicate IDs are both checked at save time.

---

## 📤 Export Formats

**CSV (daily, from main page)**
Columns: `Date, Employee, Job Role, Work Status, Lunch, Dinner, Notes`

**CSV (per-employee, from details page)**
Columns: `Employee, Job Role, Date, Day, Work Status, Lunch, Dinner, Notes`
Filename includes employee name, view type, and period (e.g. `meal-details-john-doe-month-May-2025.csv`)

**PDF**
Uses `window.print()` with print-specific CSS to hide controls and format the visible table cleanly.

---

## 🙌 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📃 License

This project is for internal use at **Tekarsh Bangladesh Ltd**. Feel free to fork and adapt it for your own team.
