window.MealTrackerEmployeeUI = (() => {
  const { generateEmployeeId, validateEmployeeFields, isEmployeeIdTaken } = window.MealTrackerData;

  function getEmployeeProfile(state, name) {
    return window.MealTrackerData.employeeProfile(state, name);
  }

  const icons = {
    view: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    delete: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14H5V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
  };

  const modalMarkup = `
    <dialog class="employee-modal" id="employeeModal" aria-labelledby="employeeModalTitle">
      <form class="employee-modal-form" id="employeeForm" method="dialog" novalidate>
        <div class="employee-modal-header">
          <h2 id="employeeModalTitle">Add Employee</h2>
          <button class="modal-close" id="closeEmployeeModal" type="button" aria-label="Close employee form">×</button>
        </div>
        <ul class="employee-form-checklist" id="employeeFormChecklist" aria-live="polite"></ul>
        <p class="form-warning" id="employeeFormWarning" hidden></p>
        <label class="field">
          <span>Employee ID</span>
          <input id="employeeFormId" type="text" inputmode="numeric" placeholder="e.g. 200001" autocomplete="off" />
          <small class="field-hint" id="employeeFormIdHint">Auto-generated for new employees</small>
        </label>
        <label class="field">
          <span>Name</span>
          <input id="employeeFormName" type="text" placeholder="Full name" autocomplete="name" required />
        </label>
        <label class="field">
          <span>Job Role</span>
          <select id="employeeFormRole" required></select>
        </label>
        <label class="field">
          <span>Phone</span>
          <input id="employeeFormPhone" type="tel" inputmode="numeric" placeholder="11-digit phone" autocomplete="tel" required />
        </label>
        <label class="field">
          <span>Email</span>
          <input id="employeeFormEmail" type="email" placeholder="name@company.com" autocomplete="email" />
        </label>
        <div class="employee-modal-actions">
          <button class="modal-secondary" id="cancelEmployeeForm" type="button">Cancel</button>
          <button class="modal-primary" type="submit">Save Employee</button>
        </div>
      </form>
    </dialog>
    <dialog class="employee-modal" id="employeeProfileModal" aria-labelledby="employeeProfileTitle">
      <div class="employee-modal-form employee-profile-body">
        <div class="employee-modal-header">
          <h2 id="employeeProfileTitle">Employee Profile</h2>
          <button class="modal-close" id="closeEmployeeProfile" type="button" aria-label="Close profile">×</button>
        </div>
        <dl class="profile-grid">
          <div><dt>Employee ID</dt><dd id="profileEmployeeId">—</dd></div>
          <div><dt>Name</dt><dd id="profileEmployeeName">—</dd></div>
          <div><dt>Job Role</dt><dd id="profileEmployeeRole">—</dd></div>
          <div><dt>Phone</dt><dd id="profileEmployeePhone">—</dd></div>
          <div><dt>Email</dt><dd id="profileEmployeeEmail">—</dd></div>
        </dl>
        <div class="employee-modal-actions">
          <button class="modal-secondary" id="profileEditButton" type="button">Edit Profile</button>
          <button class="modal-primary" id="profileCloseButton" type="button">Close</button>
        </div>
      </div>
    </dialog>
    <dialog class="employee-modal employee-error-modal" id="employeeErrorModal" aria-labelledby="employeeErrorTitle">
      <div class="employee-modal-form employee-error-body">
        <h2 id="employeeErrorTitle">Please fix the form</h2>
        <p id="employeeErrorMessage"></p>
        <button class="modal-primary" id="closeEmployeeError" type="button">OK</button>
      </div>
    </dialog>
  `;

  let config = null;
  let editingEmployeeName = null;
  let isAddingEmployee = false;
  let profileEmployeeName = null;
  let employeeModal;
  let employeeForm;
  let employeeModalTitle;
  let employeeFormChecklist;
  let employeeFormWarning;
  let employeeFormId;
  let employeeFormIdHint;
  let employeeFormName;
  let employeeFormRole;
  let employeeFormPhone;
  let employeeFormEmail;
  let employeeProfileModal;
  let profileEmployeeId;
  let profileEmployeeNameEl;
  let profileEmployeeRole;
  let profileEmployeePhone;
  let profileEmployeeEmail;
  let employeeErrorModal;
  let employeeErrorMessage;
  let employeeErrorTitle;
  let modalListenersBound = false;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function cacheModalElements() {
    employeeModal = document.querySelector("#employeeModal");
    employeeForm = document.querySelector("#employeeForm");
    employeeModalTitle = document.querySelector("#employeeModalTitle");
    employeeFormChecklist = document.querySelector("#employeeFormChecklist");
    employeeFormWarning = document.querySelector("#employeeFormWarning");
    employeeFormId = document.querySelector("#employeeFormId");
    employeeFormIdHint = document.querySelector("#employeeFormIdHint");
    employeeFormName = document.querySelector("#employeeFormName");
    employeeFormRole = document.querySelector("#employeeFormRole");
    employeeFormPhone = document.querySelector("#employeeFormPhone");
    employeeFormEmail = document.querySelector("#employeeFormEmail");
    employeeProfileModal = document.querySelector("#employeeProfileModal");
    profileEmployeeId = document.querySelector("#profileEmployeeId");
    profileEmployeeNameEl = document.querySelector("#profileEmployeeName");
    profileEmployeeRole = document.querySelector("#profileEmployeeRole");
    profileEmployeePhone = document.querySelector("#profileEmployeePhone");
    profileEmployeeEmail = document.querySelector("#profileEmployeeEmail");
    employeeErrorModal = document.querySelector("#employeeErrorModal");
    employeeErrorMessage = document.querySelector("#employeeErrorMessage");
    employeeErrorTitle = document.querySelector("#employeeErrorTitle");
  }

  function bindModalListeners() {
    if (modalListenersBound) return;
    modalListenersBound = true;

    employeeFormRole.innerHTML = config.jobRoles
      .map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`)
      .join("");

    document.querySelector("#closeEmployeeModal").addEventListener("click", closeEmployeeFormModal);
    document.querySelector("#cancelEmployeeForm").addEventListener("click", closeEmployeeFormModal);
    employeeModal.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeEmployeeFormModal();
    });
    employeeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveEmployeeForm();
    });
    document.querySelector("#closeEmployeeError").addEventListener("click", () => employeeErrorModal.close());
    employeeErrorModal.addEventListener("cancel", (event) => {
      event.preventDefault();
      employeeErrorModal.close();
    });
    document.querySelector("#closeEmployeeProfile").addEventListener("click", closeEmployeeProfile);
    document.querySelector("#profileCloseButton").addEventListener("click", closeEmployeeProfile);
    employeeProfileModal.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeEmployeeProfile();
    });
    document.querySelector("#profileEditButton").addEventListener("click", () => {
      const name = profileEmployeeName;
      closeEmployeeProfile();
      if (name) openEmployeeForm(name);
    });

    employeeFormPhone.addEventListener("input", () => {
      const digits = employeeFormPhone.value.replace(/\D/g, "").slice(0, 11);
      if (employeeFormPhone.value !== digits) employeeFormPhone.value = digits;
      updateFormChecklist();
    });
    for (const input of [employeeFormId, employeeFormName, employeeFormEmail]) {
      input.addEventListener("input", updateFormChecklist);
    }
  }

  function ensureModals() {
    if (!document.getElementById("employeeModal")) {
      document.body.insertAdjacentHTML("beforeend", modalMarkup);
    }

    cacheModalElements();
    bindModalListeners();
  }

  function formValues() {
    return {
      id: employeeFormId.value.trim(),
      name: employeeFormName.value.trim(),
      phone: employeeFormPhone.value.replace(/\D/g, ""),
      email: employeeFormEmail.value.trim(),
      idEditable: !employeeFormId.disabled,
    };
  }

  function updateFormChecklist() {
    const values = formValues();
    const validation = validateEmployeeFields(values);

    employeeFormChecklist.innerHTML = Object.entries(validation.checks)
      .map(
        ([key, check]) => `
          <li class="${check.valid ? "valid" : "invalid"}" data-rule="${key}">
            <span class="check-icon" aria-hidden="true">${check.valid ? "✓" : "!" }</span>
            <span>${escapeHtml(check.label)}</span>
          </li>
        `,
      )
      .join("");

    const showWarning = !validation.valid && (values.name || values.phone || values.email || values.id);
    employeeFormWarning.hidden = !showWarning;
    employeeFormWarning.textContent = showWarning ? validation.message : "";
  }

  function iconButton(className, label, icon) {
    return `<button class="icon-btn ${className}" type="button" aria-label="${escapeHtml(label)}">${icons[icon]}</button>`;
  }

  function actionButtonsHtml(name, { includeDelete = true } = {}) {
    return `
      <div class="row-actions">
        ${iconButton("view-employee", `View profile for ${name}`, "view")}
        ${iconButton("edit-employee", `Edit ${name}`, "edit")}
        ${includeDelete ? iconButton("delete-employee", `Delete ${name}`, "delete") : ""}
      </div>
    `;
  }

  function bindRowActions(row, name, { onDelete } = {}) {
    row.querySelector(".view-employee")?.addEventListener("click", (event) => {
      event.stopPropagation();
      openEmployeeProfile(name);
    });
    row.querySelector(".edit-employee")?.addEventListener("click", (event) => {
      event.stopPropagation();
      openEmployeeForm(name);
    });
    row.querySelector(".delete-employee")?.addEventListener("click", (event) => {
      event.stopPropagation();
      onDelete?.(name);
    });
  }

  function bindTopbarActions(viewButton, editButton) {
    viewButton?.addEventListener("click", () => {
      const name = config.getActiveEmployeeName?.();
      if (name) openEmployeeProfile(name);
    });
    editButton?.addEventListener("click", () => {
      const name = config.getActiveEmployeeName?.();
      if (name) openEmployeeForm(name);
    });
  }

  function openEmployeeProfile(name) {
    const state = config.getState();
    const profile = getEmployeeProfile(state, name);
    const role = state.roles[name] ?? config.defaultRoles[name] ?? "Other";

    profileEmployeeName = name;
    profileEmployeeId.textContent = profile.id || "Not set";
    profileEmployeeNameEl.textContent = name;
    profileEmployeeRole.textContent = role;
    profileEmployeePhone.textContent = profile.phone || "Not set";
    profileEmployeeEmail.textContent = profile.email || "Not set";
    employeeProfileModal.showModal();
  }

  function closeEmployeeProfile() {
    employeeProfileModal.close();
    profileEmployeeName = null;
  }

  function openEmployeeForm(name = null) {
    const state = config.getState();
    editingEmployeeName = name;
    isAddingEmployee = !name;
    const profile = name ? getEmployeeProfile(state, name) : { id: "", phone: "", email: "", idLocked: false };
    const role = name ? state.roles[name] ?? config.defaultRoles[name] ?? "Other" : "Other";
    const idLocked = profile.idLocked === true;

    employeeModalTitle.textContent = name ? "Edit Employee" : "Add Employee";
    employeeFormName.value = name ?? "";
    employeeFormRole.value = role;
    employeeFormPhone.value = profile.phone ?? "";
    employeeFormEmail.value = profile.email ?? "";
    employeeFormWarning.hidden = true;

    if (isAddingEmployee) {
      const generatedId = generateEmployeeId(state);
      employeeFormId.value = generatedId;
      employeeFormId.disabled = true;
      employeeFormId.classList.add("field-locked");
      employeeFormIdHint.textContent = "Auto-generated — cannot be changed after saving";
    } else if (idLocked) {
      employeeFormId.value = profile.id ?? "";
      employeeFormId.disabled = true;
      employeeFormId.classList.add("field-locked");
      employeeFormIdHint.textContent = "This ID cannot be changed";
    } else {
      employeeFormId.value = profile.id ?? "";
      employeeFormId.disabled = false;
      employeeFormId.classList.remove("field-locked");
      employeeFormIdHint.textContent = "Numbers only (e.g. 200001)";
    }

    updateFormChecklist();
    employeeModal.showModal();
    employeeFormName.focus();
  }

  function closeEmployeeFormModal() {
    employeeModal.close();
    editingEmployeeName = null;
    isAddingEmployee = false;
    employeeForm.reset();
    employeeFormId.disabled = false;
    employeeFormId.classList.remove("field-locked");
    employeeFormWarning.hidden = true;
    employeeFormChecklist.innerHTML = "";
  }

  function showFormError(title, message) {
    employeeErrorTitle.textContent = title;
    employeeErrorMessage.textContent = message;
    employeeErrorModal.showModal();
  }

  function isEmployeeNameTaken(state, name, exceptName = null) {
    const normalized = name.trim().toLowerCase();
    return state.staff.some((employeeName) => {
      if (exceptName && employeeName === exceptName) return false;
      return employeeName.trim().toLowerCase() === normalized;
    });
  }

  function renameEmployee(state, oldName, newName) {
    const index = state.staff.indexOf(oldName);
    if (index === -1) return;

    state.staff[index] = newName;
    state.roles[newName] = state.roles[oldName];
    delete state.roles[oldName];
    state.employeeProfiles[newName] = state.employeeProfiles[oldName];
    delete state.employeeProfiles[oldName];

    for (const day of Object.values(state.days)) {
      if (!day[oldName]) continue;
      day[newName] = day[oldName];
      delete day[oldName];
    }
  }

  function saveEmployeeForm() {
    const state = config.getState();
    const values = formValues();
    const validation = validateEmployeeFields(values);
    updateFormChecklist();

    if (!validation.valid) {
      showFormError("Validation warning", `${validation.message}. Please correct the highlighted checklist items.`);
      return;
    }

    const name = values.name;
    const role = employeeFormRole.value;
    const phone = values.phone;
    const email = values.email;
    const originalName = editingEmployeeName;
    const existingProfile = originalName ? getEmployeeProfile(state, originalName) : { id: "", idLocked: false };
    const nextId = employeeFormId.disabled ? existingProfile.id || values.id : values.id;

    if (isEmployeeIdTaken(state, nextId, originalName)) {
      showFormError("Duplicate Employee ID", `Employee ID "${nextId}" is already assigned. Please choose a different ID.`);
      if (!employeeFormId.disabled) {
        employeeFormId.focus();
        employeeFormId.select();
      }
      return;
    }

    if (originalName) {
      if (isEmployeeNameTaken(state, name, originalName)) {
        showFormError("Duplicate name", "An employee with this name already exists.");
        employeeFormName.focus();
        employeeFormName.select();
        return;
      }

      if (originalName !== name) {
        renameEmployee(state, originalName, name);
        config.onRenamed?.(originalName, name);
      }

      state.roles[name] = role;
      state.employeeProfiles[name] = {
        id: nextId,
        phone,
        email,
        idLocked: existingProfile.idLocked === true,
      };
    } else {
      if (isEmployeeNameTaken(state, name)) {
        showFormError("Duplicate name", "An employee with this name already exists.");
        employeeFormName.focus();
        employeeFormName.select();
        return;
      }

      state.staff.push(name);
      state.roles[name] = role;
      state.employeeProfiles[name] = {
        id: nextId,
        phone,
        email,
        idLocked: true,
      };
    }

    closeEmployeeFormModal();
    config.saveState();
    config.onUpdated?.();
  }

  function init(options) {
    config = options;
    ensureModals();

    if (options.openAddButton) {
      options.openAddButton.addEventListener("click", () => openEmployeeForm());
    }

    bindTopbarActions(options.viewButton, options.editButton);
  }

  return {
    init,
    actionButtonsHtml,
    bindRowActions,
    openEmployeeProfile,
    openEmployeeForm,
  };
})();
