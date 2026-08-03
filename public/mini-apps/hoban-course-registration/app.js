(function () {
  const MAX_CREDITS = 21;
  const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const CHALLENGE_COUNTDOWN_MS = 10 * 1000;
  const CHALLENGE_START_TIME_MS = ((16 * 60 + 59) * 60 + 50) * 1000;

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  window.addEventListener("load", resetScrollPosition);

  const state = {
    courses: [],
    results: [],
    registered: [],
    captcha: "",
    user: {
      studentNo: "20260012345",
      name: "김호반",
    },
    challenge: {
      active: false,
      startedAt: 0,
      opensAt: 0,
      finishedAt: null,
    },
  };

  let challengeTimerId = null;

  const $ = (selector) => document.querySelector(selector);

  const loginView = $("#loginView");
  const sugangView = $("#sugangView");
  const loginForm = $("#loginForm");
  const logoutButton = $("#logoutButton");
  const courseCodeInput = $("#courseCodeInput");
  const captchaInput = $("#captchaInput");
  const confirmButton = $("#confirmButton");
  const queryButton = $("#queryButton");
  const refreshCaptchaButton = $("#refreshCaptchaButton");
  const resultBody = $("#resultBody");
  const registeredBody = $("#registeredBody");
  const resultEmpty = $("#resultEmpty");
  const registeredEmpty = $("#registeredEmpty");
  const loadingOverlay = $("#loadingOverlay");
  const challengeToggleButton = $("#challengeToggleButton");
  const challengeClock = $("#challengeClock");
  const challengeButtonLabel = $("#challengeButtonLabel");
  const challengeResultModal = $("#challengeResultModal");
  const challengeResultBody = $("#challengeResultBody");
  const challengeResultSummary = $("#challengeResultSummary");
  const challengeAllClearTime = $("#challengeAllClearTime");
  const challengeReplayButton = $("#challengeReplayButton");
  const challengeEndButton = $("#challengeEndButton");
  const goToTopButtons = document.querySelectorAll(".go-to-top-button");

  function resetScrollPosition() {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (quoted) {
        if (char === '"' && next === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (char !== "\r") {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }

    const headers = rows.shift() || [];
    return rows
      .filter((items) => items.some(Boolean))
      .map((items) => {
        const record = {};
        headers.forEach((header, index) => {
          record[header] = items[index] || "";
        });
        return record;
      });
  }

  async function loadCourses() {
    let csvText = "";
    try {
      const response = await fetch("data/courses.csv", { cache: "no-store" });
      if (response.ok) {
        csvText = await response.text();
      }
    } catch (error) {
      csvText = "";
    }

    if (!csvText && window.__KNU_COURSES_CSV__) {
      csvText = window.__KNU_COURSES_CSV__;
    }

    state.courses = parseCsv(csvText).map((course) => ({
      ...course,
      courseCode: normalizeCode(course.courseCode),
      subjectCode: normalizeCode(course.subjectCode),
      creditsNumber: Number(course.credits || 0),
    }));
  }

  function normalizeCode(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function route() {
    const isSugang = window.location.hash === "#/sugang";
    document.body.classList.toggle("login-mode", !isSugang);
    document.body.classList.toggle("sugang-mode", isSugang);
    loginView.hidden = isSugang;
    sugangView.hidden = !isSugang;
    resetScrollPosition();

    if (isSugang) {
      applyUser();
      newCaptcha();
      window.setTimeout(() => {
        courseCodeInput.focus({ preventScroll: true });
        window.requestAnimationFrame(resetScrollPosition);
        window.setTimeout(resetScrollPosition, 120);
      }, 0);
    }
  }

  function applyUser() {
    $("#studentNo").textContent = state.user.studentNo;
    $("#summaryStudentNo").textContent = state.user.studentNo;
    $("#userName").textContent = state.user.name;
    $("#summaryName").textContent = state.user.name;
  }

  function updateClock() {
    if (state.challenge.active) {
      $("#clock").textContent = getChallengeClockText();
      return;
    }

    const now = new Date();
    $("#clock").textContent = new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  }

  function getChallengeNow() {
    return state.challenge.finishedAt ?? performance.now();
  }

  function getChallengeClockText() {
    const elapsed = Math.max(0, getChallengeNow() - state.challenge.startedAt);
    const virtualTime = CHALLENGE_START_TIME_MS + elapsed;
    const totalSeconds = Math.floor(virtualTime / 1000) % (24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  function formatChallengeDuration(milliseconds) {
    const duration = Math.max(0, Math.floor(milliseconds));
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const millis = duration % 1000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  }

  function formatChallengeTimeGap(milliseconds) {
    const duration = Math.max(0, Math.floor(milliseconds));
    const seconds = Math.floor(duration / 1000);
    const millis = duration % 1000;
    return `+${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  }

  function isChallengeLoginOpen() {
    return !state.challenge.active || getChallengeNow() >= state.challenge.opensAt;
  }

  function updateChallengeUi() {
    if (!state.challenge.active) {
      challengeClock.hidden = true;
      challengeButtonLabel.textContent = "챌린지 모드 시작";
      challengeToggleButton.classList.remove("active");
      updateClock();
      return;
    }

    challengeClock.hidden = false;
    challengeClock.textContent = getChallengeClockText();
    challengeButtonLabel.textContent = "챌린지 마치기";
    challengeToggleButton.classList.add("active");
    updateClock();
  }

  function startChallenge() {
    hideChallengeResult();
    window.clearInterval(challengeTimerId);

    const startedAt = performance.now();
    state.challenge.active = true;
    state.challenge.startedAt = startedAt;
    state.challenge.opensAt = startedAt + CHALLENGE_COUNTDOWN_MS;
    state.challenge.finishedAt = null;
    state.results = [];
    state.registered = [];

    renderResults();
    renderRegistered();
    courseCodeInput.value = "";
    captchaInput.value = "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    route();
    updateChallengeUi();
    challengeTimerId = window.setInterval(updateChallengeUi, 40);
  }

  function finishChallenge() {
    if (!state.challenge.active) {
      return;
    }

    state.challenge.finishedAt = performance.now();
    window.clearInterval(challengeTimerId);
    challengeTimerId = null;
    updateChallengeUi();
    renderChallengeResults();
    challengeResultModal.hidden = false;
    document.body.classList.add("challenge-modal-open");
    challengeReplayButton.focus();
  }

  function endChallenge() {
    hideChallengeResult();
    window.clearInterval(challengeTimerId);
    challengeTimerId = null;
    state.challenge.active = false;
    state.challenge.startedAt = 0;
    state.challenge.opensAt = 0;
    state.challenge.finishedAt = null;
    updateChallengeUi();
    challengeToggleButton.focus();
  }

  function hideChallengeResult() {
    challengeResultModal.hidden = true;
    document.body.classList.remove("challenge-modal-open");
  }

  function renderChallengeResults() {
    const completedCourses = state.registered.filter((course) => Number.isFinite(course.challengeElapsedMs));
    challengeResultBody.innerHTML = "";
    challengeResultSummary.hidden = completedCourses.length === 0;

    if (completedCourses.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = '<td class="challenge-result-empty" colspan="5">신청한 과목이 없습니다.</td>';
      challengeResultBody.appendChild(emptyRow);
      return;
    }

    completedCourses.forEach((course, index) => {
      const previousElapsedMs = index === 0 ? 0 : completedCourses[index - 1].challengeElapsedMs;
      const timeGapMs = course.challengeElapsedMs - previousElapsedMs;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(course.courseCode)}</td>
        <td>${escapeHtml(course.courseName)}</td>
        <td>${escapeHtml(course.professor || "-")}</td>
        <td><strong>${formatChallengeDuration(course.challengeElapsedMs)}</strong></td>
        <td><strong>${formatChallengeTimeGap(timeGapMs)}</strong></td>
      `;
      challengeResultBody.appendChild(row);
    });

    const allClearTime = Math.max(...completedCourses.map((course) => course.challengeElapsedMs));
    challengeAllClearTime.textContent = formatChallengeDuration(allClearTime);
  }

  function newCaptcha() {
    state.captcha = Array.from({ length: 4 }, () => {
      const index = Math.floor(Math.random() * CAPTCHA_CHARS.length);
      return CAPTCHA_CHARS[index];
    }).join("");
    captchaInput.value = "";
    drawCaptcha();
  }

  function drawCaptcha() {
    const canvas = $("#captchaCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3f4f5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 28; i += 1) {
      ctx.fillStyle = "rgba(115, 120, 126, 0.12)";
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    ctx.strokeStyle = "#20242a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(9, 9);
    ctx.bezierCurveTo(42, 14, 89, 22, 122, 27);
    ctx.stroke();

    ctx.font = "bold 23px Arial";
    ctx.textBaseline = "middle";
    [...state.captcha].forEach((char, index) => {
      ctx.save();
      ctx.translate(20 + index * 27, 17);
      ctx.rotate((Math.random() - 0.5) * 0.28);
      ctx.fillStyle = index % 2 ? "#8d9298" : "#747a81";
      ctx.fillText(char, -8, 0);
      ctx.restore();
    });
  }

  function runSearch() {
    const requestedCode = normalizeCode(courseCodeInput.value);
    const typedCaptcha = normalizeCode(captchaInput.value);

    if (!requestedCode) {
      alert("강좌번호를 입력하세요.");
      courseCodeInput.focus();
      return;
    }

    if (typedCaptcha !== state.captcha) {
      alert("자동입력방지 문자를 확인하세요.");
      newCaptcha();
      captchaInput.focus();
      return;
    }

    const matches = state.courses.filter((course) => {
      if (course.courseCode === requestedCode) return true;
      if (course.subjectCode === requestedCode) return true;
      return false;
    });

    state.results = matches;
    renderResults();
    newCaptcha();

    const firstApplyButton = resultBody.querySelector("button");
    if (firstApplyButton) {
      firstApplyButton.focus();
    } else {
      courseCodeInput.select();
    }
  }

  function renderResults() {
    $("#searchCount").textContent = state.results.length;
    resultBody.innerHTML = "";
    resultEmpty.hidden = state.results.length > 0;

    state.results.forEach((course, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><button class="mini-button" type="button">신청</button></td>
        <td>${escapeHtml(course.subjectCode)}</td>
        <td class="text-left">${escapeHtml(course.courseName)}</td>
        <td>${escapeHtml(course.section)}</td>
        <td>${escapeHtml(course.category)}</td>
        <td>${escapeHtml(course.credits)}</td>
        <td>99</td>
        <td></td>
        <td class="text-left">${escapeHtml(course.time)}</td>
        <td>${escapeHtml(course.capacity)}</td>
        <td>${escapeHtml(course.enrolled)}</td>
        <td>${escapeHtml(course.professor)}</td>
      `;
      tr.querySelector("button").addEventListener("click", () => applyCourse(course));
      resultBody.appendChild(tr);
    });
  }

  function applyCourse(course) {
    if (state.registered.some((item) => item.courseCode === course.courseCode)) {
      alert("이미 신청한 과목입니다.");
      return;
    }

    if (currentCredits() + course.creditsNumber > MAX_CREDITS) {
      alert("수강신청 가능학점을 초과하였습니다.");
      return;
    }

    if (!confirm("신청하시겠습니까?")) {
      return;
    }

    showLoading(true);
    window.setTimeout(() => {
      state.registered.push({
        ...course,
        appliedAt: new Intl.DateTimeFormat("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()).replace(/\. /g, ".").replace(/\.$/, ""),
        challengeElapsedMs: state.challenge.active
          ? Math.max(0, performance.now() - state.challenge.opensAt)
          : null,
      });
      state.results = [];
      renderResults();
      renderRegistered();
      showLoading(false);
      alert("신청되었습니다.");
      courseCodeInput.value = "";
      courseCodeInput.focus();
    }, 420);
  }

  function renderRegistered() {
    $("#registeredCount").textContent = state.registered.length;
    registeredBody.innerHTML = "";
    registeredEmpty.hidden = state.registered.length > 0;

    state.registered.forEach((course, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><button class="mini-button delete-button" type="button">삭제</button></td>
        <td>${escapeHtml(course.subjectCode)}</td>
        <td class="text-left">${escapeHtml(course.courseName)}</td>
        <td>${escapeHtml(course.section)}</td>
        <td>
          <select class="category-select" aria-label="교과구분" disabled>
            <option selected>${escapeHtml(course.category)}</option>
            <option>전공필수</option>
            <option>전공선택</option>
            <option>일반선택</option>
          </select>
        </td>
        <td>${escapeHtml(course.credits)}</td>
        <td></td>
        <td></td>
        <td class="text-left">${escapeHtml(course.time)}</td>
        <td>${escapeHtml(course.capacity)}</td>
        <td>${escapeHtml(course.appliedAt)}</td>
      `;
      tr.querySelector("button").addEventListener("click", () => deleteCourse(course.courseCode));
      registeredBody.appendChild(tr);
    });

    $("#appliedCredits").textContent = currentCredits();
    $("#availableCredits").textContent = MAX_CREDITS;
  }

  function deleteCourse(courseCode) {
    if (!confirm("삭제하시겠습니까?")) {
      return;
    }

    state.registered = state.registered.filter((course) => course.courseCode !== courseCode);
    renderRegistered();
    alert("삭제되었습니다.");
  }

  function currentCredits() {
    return state.registered.reduce((sum, course) => sum + course.creditsNumber, 0);
  }

  function showLoading(show) {
    loadingOverlay.classList.toggle("active", show);
    loadingOverlay.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isChallengeLoginOpen()) {
      alert("수강신청 기간이 아닙니다");
      return;
    }

    const studentNo = $("#studentNoInput").value.trim();
    const userId = $("#userIdInput").value.trim();
    state.user.studentNo = studentNo || "20260012345";
    state.user.name = userId || "김호반";
    window.history.pushState(null, "", "#/sugang");
    route();
  });

  logoutButton.addEventListener("click", () => {
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    route();
  });

  challengeToggleButton.addEventListener("click", () => {
    if (state.challenge.active) {
      finishChallenge();
    } else {
      startChallenge();
    }
  });

  challengeReplayButton.addEventListener("click", startChallenge);
  challengeEndButton.addEventListener("click", endChallenge);

  refreshCaptchaButton.addEventListener("click", () => {
    newCaptcha();
    captchaInput.focus();
  });

  confirmButton.addEventListener("click", runSearch);
  queryButton.addEventListener("click", runSearch);

  courseCodeInput.addEventListener("input", () => {
    courseCodeInput.value = normalizeCode(courseCodeInput.value);
  });

  courseCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      captchaInput.focus();
    }
  });

  captchaInput.addEventListener("input", () => {
    captchaInput.value = normalizeCode(captchaInput.value).slice(0, 4);
  });

  captchaInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });

  window.addEventListener("hashchange", route);

  function updateGoToTopButtons() {
    const visible = window.scrollY > 160;
    goToTopButtons.forEach((button) => {
      button.classList.toggle("visible", visible);
    });
  }

  goToTopButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", updateGoToTopButtons, { passive: true });
  updateGoToTopButtons();

  loadCourses().then(() => {
    updateClock();
    window.setInterval(updateClock, 1000);
    renderResults();
    renderRegistered();
    route();
  });
})();
