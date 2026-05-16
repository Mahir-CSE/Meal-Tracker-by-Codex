window.MealTrackerData = {
  storageKey: "office-meal-tracker-v3",
  employees: [
    { name: "Nusha Farin Islam", role: "QA" },
    { name: "Nafi Afia Zahin", role: "QA" },
    { name: "Meskat Mujahidi", role: "QA" },
    { name: "Hedaetul Islam", role: "QA" },
    { name: "Fariba Tabassum", role: "QA" },
    { name: "Fokrul Islam Bhuiyan", role: "QA" },
    { name: "Mohammed Aarafat Uddin", role: "QA" },
    { name: "Syed Irfan Kayum", role: "QA" },
    { name: "Sadia Afrin", role: "QA" },
    { name: "S. M. Rakib- Ul- Islam", role: "Dev" },
    { name: "Sk. Wasiqul Hoque", role: "QA" },
    { name: "Riasat Haque", role: "QA" },
    { name: "Md. Rabbi Islam Sajid", role: "QA" },
    { name: "Sakif Al Faruque", role: "QA" },
    { name: "Maisha Shams", role: "QA" },
    { name: "Naoshin Anzum Hridi", role: "QA" },
    { name: "Mahir Ahmed Niloy", role: "QA" },
    { name: "Dhruba Nandi", role: "QA" },
    { name: "Tanmay Bhowmik", role: "QA" },
    { name: "Zahra Zannat", role: "QA" },
    { name: "Md. Al-Amin Hossain", role: "Dev" },
    { name: "MD. ROKIBUL HASAN", role: "Dev" },
    { name: "Ahammed Hossain Shanto", role: "Dev" },
    { name: "MD Mostasim Billah", role: "Dev" },
    { name: "Shahriar Saleque", role: "Dev" },
    { name: "Md. Shahibur Rahman", role: "Dev" },
    { name: "Md. Muzahidul Islam", role: "Dev" },
    { name: "Moshiur Rahman", role: "Dev" },
    { name: "Dipu Ram Roy", role: "Dev" },
    { name: "Md. Mubinur Rahman", role: "Dev" },
    { name: "Md. Gul Jamal Zim", role: "Dev" },
    { name: "Tasfik Rahman", role: "Dev" },
    { name: "Subrata Roy", role: "Dev" },
    { name: "Md. Ashraful Islam", role: "Dev" },
    { name: "Partha Sarker", role: "Dev" },
    { name: "Md Ashaduzzaman", role: "Dev" },
    { name: "Abdun Naser Tahiyat", role: "Dev" },
    { name: "Md Jobaer Hassan", role: "Dev" },
    { name: "Md. Yusuf", role: "Dev" },
    { name: "Md. Habibur Rahman", role: "Dev" },
    { name: "Nazmus Saif", role: "Dev" },
    { name: "Imran Khan", role: "Dev" },
    { name: "NOWROSE IRAB POLL", role: "Dev" },
    { name: "T. H. Riyadh", role: "Dev" },
    { name: "RAKIBUL ISLAM RAFI", role: "Dev" },
    { name: "Rimi Reza", role: "Dev" },
    { name: "MUHAMMAD SADRUL MUTTAQUIN HOQUE NAJAT", role: "Dev" },
    { name: "FARHAN FEROZ AUSHI", role: "Dev" },
    { name: "Ragib Hassan", role: "Dev" },
    { name: "Ananta Akash Podder", role: "Dev" },
    { name: "Md Arafat Rahman", role: "Dev" },
    { name: "Nayeem Hasan Anik", role: "Dev" },
    { name: "Md. Rezaul Islam", role: "Dev" },
    { name: "Mahmudul Hasan", role: "Dev" },
    { name: "Hasan Al Mamun", role: "Dev" },
    { name: "Nafis Sazid", role: "Dev" },
    { name: "Md. Redwanul Karim", role: "Dev" },
    { name: "Saadman Sakib", role: "Dev" },
    { name: "Saiful Islam", role: "Bookkeeper" },
    { name: "Zakir Ahmad", role: "PM" },
    { name: "Nahid Hasan", role: "PM" },
    { name: "Samiul Alam", role: "BPM" },
    { name: "Sohana Akter", role: "CSR" },
    { name: "Md. Mahmud Hasan", role: "IT" },
    { name: "Joynal Abedin", role: "IT" },
    { name: "Ayesha Sirajee Leena", role: "HR" },
    { name: "Miskat", role: "HR" },
    { name: "Md Mahfuz Ibne Ali Ayon", role: "Intern" },
    { name: "Md. Jariful Rahman Ovi", role: "Intern" },
    { name: "Md. Nahidur Rahman Nahid", role: "Intern" },
    { name: "Ashraful Islam Opu", role: "QA" },
    { name: "Muntasir Mahmud Amit", role: "QA" },
    { name: "Mehrab Hasan", role: "QA" },
  ],
  jobRoles: ["QA", "Dev", "Bookkeeper", "PM", "BPM", "CSR", "IT", "HR", "Intern", "Other"],
  workStatuses: ["Work from Office", "Work from Home", "Leave"],
  normalizeState(nextState) {
    const { employees } = window.MealTrackerData;
    const defaultStaff = employees.map((employee) => employee.name);
    const defaultRoles = Object.fromEntries(employees.map((employee) => [employee.name, employee.role]));
    const defaultProfiles = Object.fromEntries(
      employees.map((employee) => [
        employee.name,
        { id: employee.id?.trim() ?? "", contact: employee.contact?.trim() ?? "" },
      ]),
    );

    nextState.staff ??= [...defaultStaff];
    nextState.roles ??= {};
    nextState.days ??= {};
    nextState.closedDates ??= {};
    nextState.employeeProfiles ??= {};

    for (const name of nextState.staff) {
      nextState.roles[name] ??= defaultRoles[name] ?? "Other";
      nextState.employeeProfiles[name] ??= defaultProfiles[name] ?? { id: "", phone: "", email: "" };
      nextState.employeeProfiles[name] = window.MealTrackerData.normalizeProfile(nextState.employeeProfiles[name]);
    }

    for (const name of Object.keys(nextState.employeeProfiles)) {
      if (!nextState.staff.includes(name)) {
        delete nextState.employeeProfiles[name];
      }
    }

    return nextState;
  },
  employeeProfile(state, name) {
    const profile = state.employeeProfiles?.[name] ?? { id: "", phone: "", email: "", idLocked: false };
    return window.MealTrackerData.normalizeProfile(profile);
  },
  normalizeProfile(profile = {}) {
    const next = {
      id: profile.id?.trim() ?? "",
      phone: profile.phone?.trim() ?? "",
      email: profile.email?.trim() ?? "",
      idLocked: Boolean(profile.idLocked),
    };

    if (!next.phone && !next.email && profile.contact?.trim()) {
      const contact = profile.contact.trim();
      if (contact.includes("@")) {
        next.email = contact;
      } else {
        next.phone = contact.replace(/\D/g, "");
      }
    }

    return next;
  },
  generateEmployeeId(state) {
    let max = 200000;

    for (const profile of Object.values(state.employeeProfiles ?? {})) {
      const numericId = Number.parseInt((profile.id ?? "").trim(), 10);
      if (!Number.isNaN(numericId) && numericId > max) {
        max = numericId;
      }
    }

    return String(max + 1);
  },
  isEmployeeIdTaken(state, id, exceptName = null) {
    const normalized = id.trim();
    if (!normalized) return false;

    for (const [name, profile] of Object.entries(state.employeeProfiles ?? {})) {
      if (name === exceptName) continue;
      if ((profile.id ?? "").trim() === normalized) return true;
    }

    return false;
  },
  validateEmployeeFields({ id, name, phone, email, idEditable = true }) {
    const checks = {
      id: {
        label: "Employee ID is numbers only (e.g. 200001)",
        valid: !idEditable || /^\d{6,}$/.test(id.trim()),
      },
      name: {
        label: "Name uses letters and spaces only",
        valid: /^[A-Za-z\s]+$/.test(name.trim()) && name.trim().length > 0,
      },
      phone: {
        label: "Phone number is exactly 11 digits",
        valid: /^\d{11}$/.test(phone.trim()),
      },
      email: {
        label: "Email address format is valid",
        valid: email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
      },
    };

    const failures = Object.values(checks).filter((check) => !check.valid);
    return {
      valid: failures.length === 0,
      checks,
      message: failures.map((check) => check.label).join(". "),
    };
  },
};
