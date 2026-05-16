const { storageKey: STORAGE_KEY, employees: defaultEmployees, workStatuses, normalizeState } = window.MealTrackerData;
const defaultStaff = defaultEmployees.map((employee) => employee.name);
const defaultRoles = Object.fromEntries(defaultEmployees.map((employee) => [employee.name, employee.role]));

const params = new URLSearchParams(window.location.search);
let employeeName = params.get("employee") ?? defaultStaff[0];
const employeeUI = window.MealTrackerEmployeeUI;
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
const homeButton = document.querySelector("#homeButton");
const detailsExportOption = document.querySelector("#detailsExportOption");
const viewEmployeeProfile = document.querySelector("#viewEmployeeProfile");
const editEmployeeProfile = document.querySelector("#editEmployeeProfile");

const state = loadState();

employeeUI.init({
  getState: () => state,
  saveState,
  onUpdated: render,
  getActiveEmployeeName: () => employeeName,
  onRenamed: (_oldName, newName) => {
    employeeName = newName;
    const url = new URL(window.location.href);
    url.searchParams.set("employee", newName);
    history.replaceState(null, "", url);
  },
  defaultRoles,
  jobRoles: window.MealTrackerData.jobRoles,
  viewButton: viewEmployeeProfile,
  editButton: editEmployeeProfile,
});
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

homeButton.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.assign(new URL("index.html", window.location.href).href);
});

detailsExportOption.addEventListener("change", () => {
  if (detailsExportOption.value === "csv") exportDetailsCsv();
  if (detailsExportOption.value === "pdf") exportDetailsPdf();
  detailsExportOption.value = "";
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

  return normalizeState(nextState);
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
      <td>${weekend || officeClosed ? status : statusSelectHtml(status, dateKey)}</td>
      <td><span class="meal-pill ${mealClass(lunch)}">${lunch}</span></td>
      <td><span class="meal-pill ${mealClass(dinner)}">${dinner}</span></td>
      <td>${escapeHtml(entry.notes ?? "")}</td>
    `;

    if (!weekend && !officeClosed) {
      row.querySelector(".details-status-select").addEventListener("change", (event) => {
        updateWorkStatus(dateKey, event.target.value);
      });
    }

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

function statusSelectHtml(status, dateKey) {
  return `
    <select class="details-status-select" aria-label="Work status for ${employeeName} on ${dateKey}">
      ${workStatuses.map((workStatus) => `<option${workStatus === status ? " selected" : ""}>${escapeHtml(workStatus)}</option>`).join("")}
    </select>
  `;
}

function updateWorkStatus(dateKey, status) {
  const day = dayFor(dateKey);
  day[employeeName] = {
    ...day[employeeName],
    status,
    statusOverride: status,
    manualStatus: true,
  };
  saveState();
  render();
}

function exportDetailsCsv() {
  const role = state.roles[employeeName] ?? defaultRoles[employeeName] ?? "Other";
  const rows = [["Employee", "Job Role", "Date", "Day", "Work Status", "Lunch", "Dinner", "Notes"]];

  for (const dateKey of currentPeriodDates()) {
    const weekend = isWeekend(dateKey);
    const officeClosed = isOfficeClosed(dateKey);
    const entry = dayFor(dateKey)[employeeName];
    const status = officeClosed ? "Office Closed" : weekend ? "Weekend" : entry.status;
    const lunch = weekend || officeClosed ? "No" : effectiveMeal(entry, role, "lunch");
    const dinner = weekend || officeClosed ? "No" : effectiveMeal(entry, role, "dinner");

    rows.push([
      employeeName,
      role,
      dateKey,
      dayLabel(dateKey),
      status,
      lunch,
      dinner,
      entry.notes ?? "",
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const title = periodTitle(currentPeriodDates()).replaceAll(" ", "-").replaceAll(",", "");
  downloadCsv(csv, `meal-details-${slugify(employeeName)}-${currentView}-${title}.csv`);
}

function exportDetailsPdf() {
  document.title = `Meal Details ${employeeName} ${periodTitle(currentPeriodDates())}`;
  window.print();
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
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
