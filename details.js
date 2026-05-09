const { storageKey: STORAGE_KEY, employees: defaultEmployees, workStatuses } = window.MealTrackerData;
const defaultStaff = defaultEmployees.map((employee) => employee.name);
const defaultRoles = Object.fromEntries(defaultEmployees.map((employee) => [employee.name, employee.role]));

const params = new URLSearchParams(window.location.search);
const employeeName = params.get("employee") ?? defaultStaff[0];
const employeeNameHeading = document.querySelector("#employeeName");
const employeeRole = document.querySelector("#employeeRole");
const monthContext = document.querySelector("#monthContext");
const employeeMonthSummary = document.querySelector("#employeeMonthSummary");
const employeeMonthRows = document.querySelector("#employeeMonthRows");
const detailsDateDisplay = document.querySelector("#detailsDateDisplay");
const periodLabel = document.querySelector("#periodLabel");
const viewButtons = document.querySelectorAll("[data-view]");
const prevPeriod = document.querySelector("#prevPeriod");
const nextPeriod = document.querySelector("#nextPeriod");

const state = loadState();
let currentView = "week";
let cursorDate = parseInitialDate();

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    render();
  });
});

prevPeriod.addEventListener("click", () => {
  movePeriod(-1);
  render();
});

nextPeriod.addEventListener("click", () => {
  movePeriod(1);
  render();
});

render();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  let nextState = null;

  if (saved) {
    try {
      nextState = JSON.parse(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  nextState ??= {
    staff: [...defaultStaff],
    roles: {},
    days: {},
  };

  nextState.staff ??= [...defaultStaff];
  nextState.roles ??= {};
  nextState.days ??= {};
  nextState.closedDates ??= {};

  for (const name of nextState.staff) {
    nextState.roles[name] ??= defaultRoles[name] ?? "Other";
  }

  return nextState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function parseInitialDate() {
  const dateParam = params.get("date");
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return dateFromKey(dateParam);
  }

  const monthParam = params.get("month");
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    return dateFromKey(`${monthParam}-01`);
  }

  return dateFromKey(todayKey());
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function dayFor(date) {
  state.days[date] ??= {};

  for (const name of state.staff) {
    state.days[date][name] = normalizeEntry(state.days[date][name], name, date);
  }

  return state.days[date];
}

function normalizeEntry(entry = {}, name, dateKey) {
  const defaultStatus = defaultWorkStatus(name, dateKey);
  const existingStatus = workStatuses.includes(entry.status) ? entry.status : null;
  const overrideStatus = workStatuses.includes(entry.statusOverride) ? entry.statusOverride : null;
  const preserveExistingStatus = existingStatus && existingStatus !== defaultStatus && existingStatus !== "Work from Office";
  const legacyManualStatus = entry.manualStatus && existingStatus ? existingStatus : null;
  const status = overrideStatus ?? legacyManualStatus ?? (preserveExistingStatus ? existingStatus : defaultStatus);
  const statusOverride = overrideStatus ?? legacyManualStatus ?? (preserveExistingStatus ? existingStatus : null);

  return {
    status,
    statusOverride,
    lunch: entry.lunch ?? null,
    dinner: entry.dinner ?? null,
    notes: entry.notes ?? "",
    manualStatus: Boolean(statusOverride),
  };
}

function defaultWorkStatus(name, dateKey) {
  const role = state.roles[name] ?? defaultRoles[name] ?? "Other";
  const day = dateFromKey(dateKey).getDay();
  if (role === "QA" && day === 5) return "Work from Home";
  if (role === "Dev" && day === 4) return "Work from Home";
  return "Work from Office";
}

function defaultMeal(role, mealType) {
  if (mealType === "dinner" && role === "QA") return "No";
  return "Yes";
}

function effectiveMeal(entry, role, mealType) {
  if (entry.status !== "Work from Office") return "No";
  return entry[mealType] ?? defaultMeal(role, mealType);
}

function isWeekend(dateKey) {
  const date = dateFromKey(dateKey);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isOfficeClosed(dateKey) {
  return Boolean(state.closedDates?.[dateKey]);
}

function currentPeriodDates() {
  if (currentView === "week") return weekDates(cursorDate);
  if (currentView === "month") return monthDates(cursorDate);
  return yearDates(cursorDate);
}

function weekDates(date) {
  const start = new Date(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return rangeDates(start, 7);
}

function monthDates(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const dates = [];
  while (start.getMonth() === date.getMonth()) {
    dates.push(dateKeyFromDate(start));
    start.setDate(start.getDate() + 1);
  }
  return dates;
}

function yearDates(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const dates = [];
  while (start.getFullYear() === date.getFullYear()) {
    dates.push(dateKeyFromDate(start));
    start.setDate(start.getDate() + 1);
  }
  return dates;
}

function rangeDates(startDate, count) {
  const date = new Date(startDate);
  return Array.from({ length: count }, () => {
    const key = dateKeyFromDate(date);
    date.setDate(date.getDate() + 1);
    return key;
  });
}

function movePeriod(direction) {
  const next = new Date(cursorDate);
  if (currentView === "week") next.setDate(next.getDate() + direction * 7);
  if (currentView === "month") next.setMonth(next.getMonth() + direction);
  if (currentView === "year") next.setFullYear(next.getFullYear() + direction);
  cursorDate = next;
}

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function dateKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(dateKey) {
  return dateFromKey(dateKey).toLocaleDateString("en-US", { weekday: "short" });
}

function periodTitle(dates) {
  const first = dateFromKey(dates[0]);
  const last = dateFromKey(dates[dates.length - 1]);

  if (currentView === "week") {
    return `${formatShortDate(first)} - ${formatShortDate(last)}`;
  }

  if (currentView === "month") {
    return first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  return String(first.getFullYear());
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function render() {
  const role = state.roles[employeeName] ?? defaultRoles[employeeName] ?? "Other";
  const dates = currentPeriodDates();
  const title = periodTitle(dates);
  let lunchTotal = 0;
  let dinnerTotal = 0;
  let officeTotal = 0;
  let wfhTotal = 0;
  let leaveTotal = 0;
  let weekendTotal = 0;

  employeeNameHeading.textContent = employeeName;
  employeeRole.textContent = `${role} • ${title}`;
  periodLabel.textContent = title;
  detailsDateDisplay.textContent = title;
  monthContext.textContent = `Meal and attendance statuses for this ${currentView}.`;
  employeeMonthRows.innerHTML = "";

  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === currentView);
  });

  for (const dateKey of dates) {
    const weekend = isWeekend(dateKey);
    const officeClosed = isOfficeClosed(dateKey);
    const entry = dayFor(dateKey)[employeeName];
    const status = officeClosed ? "Office Closed" : weekend ? "Weekend" : entry.status;
    const lunch = weekend || officeClosed ? "No" : effectiveMeal(entry, role, "lunch");
    const dinner = weekend || officeClosed ? "No" : effectiveMeal(entry, role, "dinner");

    if (weekend) weekendTotal += 1;
    if (!weekend && !officeClosed) {
      if (status === "Work from Office") officeTotal += 1;
      if (status === "Work from Home") wfhTotal += 1;
      if (status === "Leave") leaveTotal += 1;
      if (lunch === "Yes") lunchTotal += 1;
      if (dinner === "Yes") dinnerTotal += 1;
    }

    const row = document.createElement("tr");
    row.className = officeClosed ? "closed-row" : weekend ? "weekend-row" : "";
    row.innerHTML = `
      <td>${dateKey}</td>
      <td>${dayLabel(dateKey)}</td>
      <td>${status}</td>
      <td><span class="meal-pill ${mealClass(lunch)}">${lunch}</span></td>
      <td><span class="meal-pill ${mealClass(dinner)}">${dinner}</span></td>
      <td>${escapeHtml(entry.notes ?? "")}</td>
    `;
    employeeMonthRows.append(row);
  }

  employeeMonthSummary.innerHTML = `
    <span>Office <strong>${officeTotal}</strong></span>
    <span>WFH <strong>${wfhTotal}</strong></span>
    <span>Leave <strong>${leaveTotal}</strong></span>
    <span>Weekend <strong>${weekendTotal}</strong></span>
    <span>Lunch <strong>${lunchTotal}</strong></span>
    <span>Dinner <strong>${dinnerTotal}</strong></span>
  `;

  saveState();
}

function mealClass(meal) {
  return meal === "Yes" ? "meal-yes" : "meal-no";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
