const { storageKey: STORAGE_KEY, employees: defaultEmployees, jobRoles, workStatuses } = window.MealTrackerData;
const defaultStaff = defaultEmployees.map((employee) => employee.name);
const defaultRoles = Object.fromEntries(defaultEmployees.map((employee) => [employee.name, employee.role]));

const state = loadState();

const selectedDate = document.querySelector("#selectedDate");
const trackerRows = document.querySelector("#trackerRows");
const lunchCount = document.querySelector("#lunchCount");
const dinnerCount = document.querySelector("#dinnerCount");
const wfhCount = document.querySelector("#wfhCount");
const leaveCount = document.querySelector("#leaveCount");
const workingDaysCount = document.querySelector("#workingDaysCount");
const staffTotal = document.querySelector("#staffTotal");
const dateDisplay = document.querySelector("#dateDisplay");
const addStaffForm = document.querySelector("#addStaffForm");
const newStaffName = document.querySelector("#newStaffName");
const searchStaff = document.querySelector("#searchStaff");
const weekendScreen = document.querySelector("#weekendScreen");
const closedScreen = document.querySelector("#closedScreen");
const attendanceView = document.querySelector("#attendanceView");
const statusFilterButtons = document.querySelectorAll("[data-status-filter]");
const viewOption = document.querySelector("#viewOption");
const officeOpenToggle = document.querySelector("#officeOpenToggle");
const officeToggleText = document.querySelector("#officeToggleText");
let currentStatusFilter = "All";
let currentRoleFilter = "All";

selectedDate.value = todayKey();

selectedDate.addEventListener("change", render);
officeOpenToggle.addEventListener("change", () => {
  const date = selectedDate.value || todayKey();
  state.closedDates ??= {};
  if (officeOpenToggle.checked) {
    delete state.closedDates[date];
  } else {
    state.closedDates[date] = true;
  }
  saveState();
  render();
});
searchStaff.addEventListener("input", render);
statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentStatusFilter = button.dataset.statusFilter;
    render();
  });
});
viewOption.addEventListener("change", () => {
  currentRoleFilter = viewOption.value;
  render();
});
document.querySelector("#exportCsv").addEventListener("click", exportCsv);

addStaffForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newStaffName.value.trim();
  if (!name) return;
  if (!state.staff.includes(name)) {
    state.staff.push(name);
    state.roles[name] = "Other";
  }
  newStaffName.value = "";
  saveState();
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

function currentDay() {
  return dayFor(selectedDate.value || todayKey());
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
  const day = new Date(`${dateKey}T00:00:00`).getDay();
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
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isOfficeClosed(dateKey) {
  return Boolean(state.closedDates?.[dateKey]);
}

function dateLongLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function workingDaysInMonth(dateKey) {
  const [year, month] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  let count = 0;

  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count += 1;
    date.setDate(date.getDate() + 1);
  }

  return count;
}

function render() {
  const date = selectedDate.value || todayKey();
  const weekend = isWeekend(date);
  const officeClosed = isOfficeClosed(date);
  const inactiveDay = weekend || officeClosed;
  const day = currentDay();
  const query = searchStaff.value.trim().toLowerCase();
  const roleFilteredStaff = state.staff.filter((name) => {
    const role = state.roles[name] ?? defaultRoles[name] ?? "Other";
    return currentRoleFilter === "All" || role === currentRoleFilter;
  });
  const visibleStaff = state.staff.filter((name) => {
    const role = state.roles[name] ?? defaultRoles[name] ?? "Other";
    const matchesSearch = name.toLowerCase().includes(query);
    const matchesStatus = currentStatusFilter === "All" || day[name].status === currentStatusFilter;
    const matchesRole = currentRoleFilter === "All" || role === currentRoleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  dateDisplay.textContent = dateLongLabel(date);
  officeOpenToggle.checked = !officeClosed && !weekend;
  officeOpenToggle.disabled = weekend;
  officeToggleText.textContent = officeClosed || weekend ? "Off" : "On";
  weekendScreen.hidden = !weekend || officeClosed;
  closedScreen.hidden = !officeClosed;
  attendanceView.hidden = inactiveDay;
  statusFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.statusFilter === currentStatusFilter);
  });
  renderViewOptions();
  trackerRows.innerHTML = "";

  if (visibleStaff.length === 0) {
    const row = document.createElement("tr");
    const activeFilters = [
      currentStatusFilter === "All" ? null : currentStatusFilter,
      currentRoleFilter === "All" ? null : currentRoleFilter,
    ].filter(Boolean);
    const filterLabel = activeFilters.length ? activeFilters.join(" and ") : "your search";
    row.innerHTML = `<td colspan="7"><div class="empty-state">No employees matched ${escapeHtml(filterLabel)}.</div></td>`;
    trackerRows.append(row);
  } else {
    for (const name of visibleStaff) {
      trackerRows.append(createRow(name, day[name]));
    }
  }

  const entries = roleFilteredStaff.map((name) => {
    const entry = day[name];
    const role = state.roles[name] ?? defaultRoles[name] ?? "Other";
    return {
      status: entry.status,
      lunch: effectiveMeal(entry, role, "lunch"),
      dinner: effectiveMeal(entry, role, "dinner"),
    };
  });
  const officeTotal = inactiveDay ? 0 : entries.filter((entry) => entry.status === "Work from Office").length;
  const wfhTotal = inactiveDay ? 0 : entries.filter((entry) => entry.status === "Work from Home").length;
  const leaveTotal = inactiveDay ? 0 : entries.filter((entry) => entry.status === "Leave").length;
  const lunchTotal = inactiveDay ? 0 : entries.filter((entry) => entry.lunch === "Yes").length;
  const dinnerTotal = inactiveDay ? 0 : entries.filter((entry) => entry.dinner === "Yes").length;

  lunchCount.textContent = lunchTotal;
  dinnerCount.textContent = dinnerTotal;
  wfhCount.textContent = wfhTotal;
  leaveCount.textContent = leaveTotal;
  workingDaysCount.textContent = workingDaysInMonth(date);
  staffTotal.textContent = inactiveDay ? `0 shown / ${roleFilteredStaff.length}` : `${visibleStaff.length} shown / ${roleFilteredStaff.length}`;
  updateStatusFilterCounts({
    All: inactiveDay ? 0 : roleFilteredStaff.length,
    "Work from Office": officeTotal,
    "Work from Home": wfhTotal,
    Leave: leaveTotal,
  });
  document.body.classList.toggle("weekend-day", weekend);
  document.body.classList.toggle("closed-day", officeClosed);
  saveState();
}

function updateStatusFilterCounts(counts) {
  statusFilterButtons.forEach((button) => {
    const count = counts[button.dataset.statusFilter] ?? 0;
    button.querySelector("span").textContent = count;
  });
}

function renderViewOptions() {
  const roles = [...new Set(state.staff.map((name) => state.roles[name] ?? defaultRoles[name] ?? "Other"))]
    .sort((a, b) => a.localeCompare(b));

  if (currentRoleFilter !== "All" && !roles.includes(currentRoleFilter)) {
    currentRoleFilter = "All";
  }

  viewOption.innerHTML = [
    `<option value="All">All Employees</option>`,
    ...roles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`),
  ].join("");
  viewOption.value = currentRoleFilter;
}

function createRow(name, entry) {
  const row = document.createElement("tr");
  const role = state.roles[name] ?? defaultRoles[name] ?? "Other";
  const officeDay = entry.status === "Work from Office";
  const lunch = effectiveMeal(entry, role, "lunch");
  const dinner = effectiveMeal(entry, role, "dinner");

  row.innerHTML = `
    <td><a class="employee-link" href="details.html?employee=${encodeURIComponent(name)}&date=${selectedDate.value || todayKey()}">${escapeHtml(name)}</a></td>
    <td>
      <select class="role-select" aria-label="Job role for ${escapeHtml(name)}">
        ${jobRoles.map((jobRole) => `<option>${escapeHtml(jobRole)}</option>`).join("")}
      </select>
    </td>
    <td>
      <select class="status-select" aria-label="Work status for ${escapeHtml(name)}">
        ${workStatuses.map((status) => `<option>${escapeHtml(status)}</option>`).join("")}
      </select>
    </td>
    <td>
      <select class="meal-select ${mealClass(lunch)}" aria-label="Lunch for ${escapeHtml(name)}" ${officeDay ? "" : "disabled"}>
        <option>Yes</option>
        <option>No</option>
      </select>
    </td>
    <td>
      <select class="meal-select ${mealClass(dinner)}" aria-label="Dinner for ${escapeHtml(name)}" ${officeDay ? "" : "disabled"}>
        <option>Yes</option>
        <option>No</option>
      </select>
    </td>
    <td><textarea aria-label="Notes for ${escapeHtml(name)}" placeholder="Optional"></textarea></td>
    <td><button class="delete-employee" type="button" aria-label="Delete ${escapeHtml(name)}">Delete</button></td>
  `;

  const roleSelect = row.querySelector(".role-select");
  const statusSelect = row.querySelector(".status-select");
  const lunchSelect = row.querySelector('[aria-label^="Lunch"]');
  const dinnerSelect = row.querySelector('[aria-label^="Dinner"]');
  const notes = row.querySelector("textarea");
  const deleteButton = row.querySelector(".delete-employee");

  roleSelect.value = role;
  statusSelect.value = entry.status;
  lunchSelect.value = lunch;
  dinnerSelect.value = dinner;
  notes.value = entry.notes ?? "";

  roleSelect.addEventListener("change", () => {
    state.roles[name] = roleSelect.value;
    render();
  });

  statusSelect.addEventListener("change", () => {
    const date = selectedDate.value || todayKey();
    const day = dayFor(date);
    const nextStatus = statusSelect.value;
    day[name] = {
      ...day[name],
      status: nextStatus,
      statusOverride: nextStatus,
      manualStatus: true,
    };
    saveState();
    render();
  });

  lunchSelect.addEventListener("change", () => {
    currentDay()[name].lunch = lunchSelect.value;
    render();
  });

  dinnerSelect.addEventListener("change", () => {
    currentDay()[name].dinner = dinnerSelect.value;
    render();
  });

  notes.addEventListener("input", () => {
    currentDay()[name].notes = notes.value;
    saveState();
  });

  deleteButton.addEventListener("click", () => {
    deleteEmployee(name);
  });

  return row;
}

function deleteEmployee(name) {
  state.staff = state.staff.filter((employee) => employee !== name);
  delete state.roles[name];

  for (const day of Object.values(state.days)) {
    delete day[name];
  }

  saveState();
  render();
}

function mealClass(meal) {
  return meal === "Yes" ? "meal-yes" : "meal-no";
}

function exportCsv() {
  const date = selectedDate.value || todayKey();
  const day = currentDay();
  const rows = [["Date", "Employee", "Job Role", "Work Status", "Lunch", "Dinner", "Notes"]];

  for (const name of state.staff) {
    const entry = day[name];
    const role = state.roles[name] ?? defaultRoles[name] ?? "Other";
    rows.push([
      date,
      name,
      role,
      entry.status,
      effectiveMeal(entry, role, "lunch"),
      effectiveMeal(entry, role, "dinner"),
      entry.notes ?? "",
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `meal-tracker-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
