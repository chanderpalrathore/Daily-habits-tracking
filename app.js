(() => {
  "use strict";

  const STORAGE_KEY = "daily-habits-tracker-v1";
  const THEME_KEY = "daily-habits-tracker-theme";

  const DEFAULT_HABITS = [
    { id: "water", name: "Drink 4 Litres of Water", icon: "💧", category: "Health & Fitness", type: "build" },
    { id: "walk", name: "Morning Walk", icon: "🚶", category: "Health & Fitness", type: "build" },
    { id: "meditate", name: "Meditate 10 Minutes", icon: "🧘", category: "Health & Fitness", type: "build" },
    { id: "sleep", name: "Sleep 7+ Hours", icon: "😴", category: "Health & Fitness", type: "build" },
    { id: "study", name: "Study 15 Pages", icon: "📖", category: "Learning & Growth", type: "build" },
    { id: "skill", name: "Work on a New Skill", icon: "🛠️", category: "Learning & Growth", type: "build" },
    { id: "ai", name: "Learn AI", icon: "🤖", category: "Learning & Growth", type: "build" },
    { id: "cyber", name: "Learn Cybersecurity", icon: "🔐", category: "Learning & Growth", type: "build" },
    { id: "interview", name: "Interview Preparation", icon: "💼", category: "Learning & Growth", type: "build" },
    { id: "no_pmo", name: "Self-Control (No PMO)", icon: "🚫", category: "Break Free", type: "quit" },
    { id: "no_smoke", name: "No Smoking", icon: "🚭", category: "Break Free", type: "quit" },
    { id: "no_alcohol", name: "No Alcohol", icon: "🍷", category: "Break Free", type: "quit" },
  ];

  const CATEGORY_ORDER = ["Health & Fitness", "Learning & Growth", "Break Free", "Productivity", "Custom"];

  // ---------- State ----------
  let state = loadState();
  let viewMonth = new Date(); // month currently shown on calendar
  viewMonth.setDate(1);
  let selectedDate = todayStr();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.habits) && parsed.logs) return parsed;
      }
    } catch (e) {
      console.warn("Could not read saved data, starting fresh.", e);
    }
    return { habits: DEFAULT_HABITS.map(h => ({ ...h, archived: false })), logs: {}, notes: {} };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ---------- Date helpers ----------
  function todayStr() { return fmtDate(new Date()); }
  function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function parseDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function isFuture(dateStr) {
    return dateStr > todayStr();
  }
  function addDays(d, n) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + n);
    return nd;
  }

  // ---------- Derived data ----------
  function activeHabits() {
    return state.habits.filter(h => !h.archived);
  }

  function dayCompletion(dateStr) {
    const habitsForDay = activeHabits().filter(h => !h.createdAt || h.createdAt <= dateStr);
    if (habitsForDay.length === 0) return null;
    const log = state.logs[dateStr] || {};
    const checked = habitsForDay.filter(h => log[h.id]).length;
    return { checked, total: habitsForDay.length, pct: checked / habitsForDay.length };
  }

  function dayStatusClass(dateStr) {
    if (isFuture(dateStr)) return "status-gray";
    const c = dayCompletion(dateStr);
    if (!c || c.total === 0) return "status-gray";
    if (c.pct === 1) return "status-green";
    if (c.pct === 0) return "status-red";
    return "status-amber";
  }

  // ---------- Rendering: Calendar ----------
  const monthLabelEl = document.getElementById("monthLabel");
  const calendarGridEl = document.getElementById("calendarGrid");

  function renderCalendar() {
    monthLabelEl.textContent = viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
    calendarGridEl.innerHTML = "";

    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement("div");
      empty.className = "day-cell empty";
      calendarGridEl.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = fmtDate(d);
      const cell = document.createElement("div");
      const statusClass = dayStatusClass(dateStr);
      cell.className = `day-cell ${statusClass}`;
      if (dateStr === todayStr()) cell.classList.add("is-today");
      if (dateStr === selectedDate) cell.classList.add("is-selected");
      if (isFuture(dateStr)) cell.classList.add("is-future");

      const num = document.createElement("div");
      num.className = "num";
      num.textContent = String(day);
      cell.appendChild(num);

      const c = dayCompletion(dateStr);
      if (c && !isFuture(dateStr)) {
        const frac = document.createElement("div");
        frac.className = "frac";
        frac.textContent = `${c.checked}/${c.total}`;
        cell.appendChild(frac);
      }

      cell.addEventListener("click", () => {
        selectedDate = dateStr;
        renderAll();
      });

      calendarGridEl.appendChild(cell);
    }
  }

  // ---------- Rendering: Heatmap (last 12 weeks) ----------
  const heatmapEl = document.getElementById("heatmap");
  function renderHeatmap() {
    heatmapEl.innerHTML = "";
    const today = new Date();
    const totalDays = 12 * 7;
    const start = addDays(today, -(totalDays - 1));
    // align start to a Sunday
    const startOffset = start.getDay();
    const alignedStart = addDays(start, -startOffset);

    for (let i = 0; i < totalDays + startOffset; i++) {
      const d = addDays(alignedStart, i);
      const dateStr = fmtDate(d);
      const cell = document.createElement("div");
      cell.className = "heat-cell";
      cell.title = dateStr;

      if (d > today) {
        cell.style.background = "var(--gray-bg)";
      } else {
        const c = dayCompletion(dateStr);
        if (!c || c.total === 0) {
          cell.style.background = "var(--gray-bg)";
        } else {
          cell.style.background = heatColor(c.pct);
        }
      }
      heatmapEl.appendChild(cell);
    }
  }

  function heatColor(pct) {
    if (pct === 0) return "var(--red)";
    if (pct < 0.5) return "color-mix(in srgb, var(--red) 50%, var(--amber))";
    if (pct < 1) return "var(--amber)";
    return "var(--green)";
  }

  // ---------- Rendering: Day panel ----------
  const selectedDateLabelEl = document.getElementById("selectedDateLabel");
  const selectedDateBadgeEl = document.getElementById("selectedDateBadge");
  const dayProgressBarEl = document.getElementById("dayProgressBar");
  const habitListEl = document.getElementById("habitList");
  const futureNoticeEl = document.getElementById("futureNotice");
  const dayNotesEl = document.getElementById("dayNotes");

  function renderDayPanel() {
    const d = parseDate(selectedDate);
    const isToday = selectedDate === todayStr();
    selectedDateLabelEl.textContent = isToday
      ? `Today · ${d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`
      : d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });

    const future = isFuture(selectedDate);
    futureNoticeEl.hidden = !future;
    habitListEl.hidden = future;

    const habits = activeHabits().filter(h => !h.createdAt || h.createdAt <= selectedDate);
    const log = state.logs[selectedDate] || {};
    const checkedCount = habits.filter(h => log[h.id]).length;

    selectedDateBadgeEl.textContent = `${checkedCount} / ${habits.length}`;
    const pct = habits.length ? (checkedCount / habits.length) * 100 : 0;
    dayProgressBarEl.style.width = `${pct}%`;

    habitListEl.innerHTML = "";
    let lastCategory = null;
    const grouped = [...habits].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

    if (grouped.length === 0) {
      habitListEl.innerHTML = `<p class="future-notice">No habits yet — click "Manage Habits" to add your first one.</p>`;
    }

    for (const h of grouped) {
      if (h.category !== lastCategory) {
        const label = document.createElement("div");
        label.className = "habit-category-label";
        label.textContent = h.category;
        habitListEl.appendChild(label);
        lastCategory = h.category;
      }

      const row = document.createElement("div");
      row.className = "habit-row";

      const btn = document.createElement("button");
      const isChecked = !!log[h.id];
      btn.className = "check-btn" + (isChecked ? " checked" : "");
      btn.textContent = isChecked ? "✓" : "✕";
      btn.disabled = future;
      btn.setAttribute("aria-label", `Toggle ${h.name} for ${selectedDate}`);
      btn.addEventListener("click", () => toggleHabit(h.id));

      const icon = document.createElement("span");
      icon.className = "habit-icon";
      icon.textContent = h.icon;

      const name = document.createElement("span");
      name.className = "habit-name";
      name.textContent = h.name;

      row.appendChild(btn);
      row.appendChild(icon);
      row.appendChild(name);
      habitListEl.appendChild(row);
    }

    dayNotesEl.value = (state.notes && state.notes[selectedDate]) || "";
  }

  function toggleHabit(habitId) {
    if (isFuture(selectedDate)) return;
    if (!state.logs[selectedDate]) state.logs[selectedDate] = {};
    state.logs[selectedDate][habitId] = !state.logs[selectedDate][habitId];
    saveState();
    renderAll();
  }

  dayNotesEl.addEventListener("input", () => {
    if (!state.notes) state.notes = {};
    state.notes[selectedDate] = dayNotesEl.value;
    saveState();
  });

  // ---------- Rendering: Stats ----------
  const statsGridEl = document.getElementById("statsGrid");
  const habitStreaksEl = document.getElementById("habitStreaks");
  const topbarStatsEl = document.getElementById("topbarStats");

  function computeOverallStreak() {
    // consecutive perfect days ending today (or yesterday if today not finished)
    let streak = 0;
    let cursor = new Date();
    // if today isn't complete yet, start counting from yesterday, but still show today's own state separately
    while (true) {
      const dateStr = fmtDate(cursor);
      const c = dayCompletion(dateStr);
      if (!c || c.total === 0) break;
      if (c.pct === 1) {
        streak++;
        cursor = addDays(cursor, -1);
      } else {
        break;
      }
    }
    return streak;
  }

  function computeHabitStreak(habitId) {
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const dateStr = fmtDate(cursor);
      const log = state.logs[dateStr];
      if (log && log[habitId]) {
        streak++;
        cursor = addDays(cursor, -1);
      } else {
        break;
      }
    }
    return streak;
  }

  function computeLast30DayRate() {
    let sumPct = 0, days = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(new Date(), -i);
      const dateStr = fmtDate(d);
      const c = dayCompletion(dateStr);
      if (c && c.total > 0) { sumPct += c.pct; days++; }
    }
    return days ? Math.round((sumPct / days) * 100) : 0;
  }

  function renderStats() {
    const overallStreak = computeOverallStreak();
    const rate30 = computeLast30DayRate();
    const todayC = dayCompletion(todayStr());
    const perfectDays = Object.keys(state.logs).filter(dateStr => {
      const c = dayCompletion(dateStr);
      return c && c.total > 0 && c.pct === 1;
    }).length;

    statsGridEl.innerHTML = `
      <div class="stat-box"><div class="value">🔥 ${overallStreak}</div><div class="label">Day Perfect Streak</div></div>
      <div class="stat-box"><div class="value">${rate30}%</div><div class="label">30-Day Completion</div></div>
      <div class="stat-box"><div class="value">${todayC ? todayC.checked : 0}/${todayC ? todayC.total : 0}</div><div class="label">Today</div></div>
      <div class="stat-box"><div class="value">${perfectDays}</div><div class="label">Perfect Days (All Time)</div></div>
    `;

    topbarStatsEl.innerHTML = `
      <div class="stat-chip">🔥 <b>${overallStreak}</b> day streak</div>
      <div class="stat-chip">📊 <b>${rate30}%</b> last 30 days</div>
    `;

    habitStreaksEl.innerHTML = "";
    const habits = activeHabits();
    if (habits.length === 0) {
      habitStreaksEl.innerHTML = `<p class="future-notice">No habits to show yet.</p>`;
    }
    for (const h of habits) {
      const s = computeHabitStreak(h.id);
      const row = document.createElement("div");
      row.className = "streak-row";
      row.innerHTML = `<span>${h.icon}</span><span class="name">${escapeHtml(h.name)}</span><span class="flame">🔥</span><span class="count">${s}</span>`;
      habitStreaksEl.appendChild(row);
    }
  }

  // ---------- Manage Habits Modal ----------
  const manageModal = document.getElementById("manageModal");
  const manageHabitsBtn = document.getElementById("manageHabitsBtn");
  const closeManageModal = document.getElementById("closeManageModal");
  const addHabitForm = document.getElementById("addHabitForm");
  const manageHabitListEl = document.getElementById("manageHabitList");

  manageHabitsBtn.addEventListener("click", () => {
    renderManageList();
    manageModal.hidden = false;
  });
  closeManageModal.addEventListener("click", () => (manageModal.hidden = true));
  manageModal.addEventListener("click", (e) => {
    if (e.target === manageModal) manageModal.hidden = true;
  });

  addHabitForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("newHabitName");
    const iconInput = document.getElementById("newHabitIcon");
    const catInput = document.getElementById("newHabitCategory");

    const name = nameInput.value.trim();
    if (!name) return;

    const id = "custom_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    state.habits.push({
      id,
      name,
      icon: iconInput.value.trim() || "⭐",
      category: catInput.value,
      type: "build",
      archived: false,
      createdAt: todayStr(),
    });
    saveState();
    nameInput.value = "";
    iconInput.value = "⭐";
    renderManageList();
    renderAll();
  });

  function renderManageList() {
    manageHabitListEl.innerHTML = "";
    for (const h of state.habits) {
      const row = document.createElement("div");
      row.className = "manage-row" + (h.archived ? " archived" : "");
      row.innerHTML = `
        <span class="habit-icon">${h.icon}</span>
        <span>
          <span class="habit-name">${escapeHtml(h.name)}</span>
          <span class="cat">${escapeHtml(h.category)}${h.archived ? " · archived" : ""}</span>
        </span>
      `;
      const actions = document.createElement("div");
      actions.className = "manage-row-actions";

      const archiveBtn = document.createElement("button");
      archiveBtn.className = "btn btn-small";
      archiveBtn.textContent = h.archived ? "Restore" : "Archive";
      archiveBtn.addEventListener("click", () => {
        h.archived = !h.archived;
        saveState();
        renderManageList();
        renderAll();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        if (!confirm(`Delete "${h.name}" and all its logged history? This can't be undone.`)) return;
        state.habits = state.habits.filter(x => x.id !== h.id);
        for (const dateStr of Object.keys(state.logs)) {
          delete state.logs[dateStr][h.id];
        }
        saveState();
        renderManageList();
        renderAll();
      });

      actions.appendChild(archiveBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(actions);
      manageHabitListEl.appendChild(row);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Export / Import ----------
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-tracker-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.habits) || typeof parsed.logs !== "object") {
          throw new Error("File does not look like a habit tracker backup.");
        }
        if (!confirm("Importing will replace your current data. Continue?")) return;
        state = { habits: parsed.habits, logs: parsed.logs, notes: parsed.notes || {} };
        saveState();
        renderAll();
      } catch (err) {
        alert("Could not import file: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  // ---------- Theme ----------
  const themeToggleBtn = document.getElementById("themeToggle");
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggleBtn.textContent = "☀️";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeToggleBtn.textContent = "🌙";
    }
    localStorage.setItem(THEME_KEY, theme);
  }
  themeToggleBtn.addEventListener("click", () => {
    const current = localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  (function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  })();

  // ---------- Calendar nav ----------
  document.getElementById("prevMonth").addEventListener("click", () => {
    viewMonth.setMonth(viewMonth.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    viewMonth.setMonth(viewMonth.getMonth() + 1);
    renderCalendar();
  });
  document.getElementById("todayBtn").addEventListener("click", () => {
    viewMonth = new Date();
    viewMonth.setDate(1);
    selectedDate = todayStr();
    renderAll();
  });

  // ---------- Render all ----------
  function renderAll() {
    renderCalendar();
    renderHeatmap();
    renderDayPanel();
    renderStats();
  }

  renderAll();
})();
