const currentUser = getSessionUser();
const periodSelect = document.getElementById("period-select");
const periodMessage = document.getElementById("period-message");
const attemptsMessage = document.getElementById("attempts-message");
const filterConfirmButton = document.getElementById("filter-button");

let charts = [];

/**
 * Sets the chart style from the page's CSS variables and loads the current week.
 */
function startDashboard() {
  Chart.defaults.font.family = readCssVariable("--font-body");
  Chart.defaults.color = readCssVariable("--muted");
  Chart.defaults.borderColor = readCssVariable("--line");
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.display = false;

  periodSelect.addEventListener("change", handlePeriodChange);
  filterConfirmButton.addEventListener("click", handleFilterClick);

  loadDashboard(getWeekPeriod(0));
}

/**
 * Loads the chosen week at once. A custom period only shows the date fields; it loads on "Filtrar".
 */
function handlePeriodChange() {
  document.getElementById("custom-period").hidden = periodSelect.value !== "custom";

  if (periodSelect.value === "current-week") {
    loadDashboard(getWeekPeriod(0));
  } else if (periodSelect.value === "previous-week") {
    loadDashboard(getWeekPeriod(1));
  }
}

/**
 * Checks the custom period's dates and loads the page with them.
 */
function handleFilterClick() {
  const start = document.getElementById("start-date").value;
  const end = document.getElementById("end-date").value;

  if (!start || !end) {
    showMessage(periodMessage, "Informe a data de início e a data de fim.", "error");
    return;
  }
  // Dates written as "YYYY-MM-DD" compare as text in date order.
  if (start > end) {
    showMessage(periodMessage, "A data de início não pode ser depois da data de fim.", "error");
    return;
  }
  loadDashboard({ start: start, end: end });
}

/**
 * Fetches the attempts and the lists of a period and draws the whole page with them.
 * @param {{start: string, end: string}} period - Days written "YYYY-MM-DD", both included.
 */
async function loadDashboard(period) {
  periodMessage.className = "message";
  attemptsMessage.className = "message";

  const noAttempts = { tentativas: [], periodo_anterior: { total: 0, acertos: 0 } };
  const attemptsData = await fetchDashboardData("tentativas", period, noAttempts);
  const lists = await fetchDashboardData("listasExercicios", period, []);
  const attempts = attemptsData.tentativas;

  renderStats(attempts, attemptsData.periodo_anterior, lists, period);
  renderCharts(attempts, lists, period);
  renderTable(attempts);
}

/**
 * Fetches one of the /dashboard routes for the logged-in user and a period.
 * @param {string} route - "tentativas" or "listasExercicios".
 * @param {{start: string, end: string}} period
 * @param {*} emptyData - Returned when there is no data or the request fails, so the page still draws.
 * @returns {Promise<*>} The reply's JSON, or emptyData.
 */
async function fetchDashboardData(route, period, emptyData) {
  const url = `/dashboard/${route}/${currentUser.id}?data_inicio=${period.start}&data_fim=${period.end}`;

  try {
    const response = await fetch(url);
    if (response.status !== 200) {
      return emptyData;
    }
    return await response.json();
  } catch {
    showMessage(attemptsMessage, "Não foi possível carregar os dados do dashboard.", "error");
    return emptyData;
  }
}

/**
 * Fills the three indicator cards and the numbers next to the donut chart.
 * The first two cards also show the progress compared with the previous period.
 * @param {object[]} attempts
 * @param {{total: number, acertos: number}} previousPeriod - The totals of the period right before, to compare with.
 * @param {object[]} lists
 * @param {{start: string, end: string}} period
 */
function renderStats(attempts, previousPeriod, lists, period) {
  const results = countResults(attempts);
  const progress = calculateProgress(attempts, previousPeriod);
  const hitRate = calculateRate(results.right, attempts.length) + "%";
  const periodText = formatToDayMonthYear(period.start) + " a " + formatToDayMonthYear(period.end);

  let solvedExercises = 0;
  let totalExercises = 0;
  for (const list of lists) {
    solvedExercises += list.resolvidos;
    totalExercises += list.total_exercicios;
  }

  document.getElementById("solved-in-period").textContent = results.right;
  document.getElementById("solved-in-period-dates").textContent = periodText;
  renderProgress("solved-in-period-progress", progress.solved, "");

  document.getElementById("hit-rate").textContent = hitRate;
  document.getElementById("hit-rate-dates").textContent = periodText;
  renderProgress("hit-rate-progress", progress.hitRate, " p.p.");

  document.getElementById("solved-exercises").textContent = solvedExercises + "/" + totalExercises;
  document.getElementById("solved-exercises-detail").textContent = calculateRate(solvedExercises, totalExercises) + "% dos exercícios";

  document.getElementById("results-acerto").textContent = results.right;
  document.getElementById("results-erro").textContent = results.wrong;
  document.getElementById("results-hit-rate").textContent = hitRate;
}

/**
 * Writes a progress with its sign, such as "+3 em relação à semana anterior", and marks it as up or down.
 * The CSS writes ▲ before "up" and ▼ before "down", and colors them.
 * @param {string} elementId
 * @param {number} difference - Positive when it went up, negative when it went down.
 * @param {string} unit - Written after the number, such as " p.p.".
 */
function renderProgress(elementId, difference, unit) {
  const comparedPeriod = periodSelect.value === "custom" ? "em relação aos 7 dias anteriores" : "em relação à semana anterior";
  const element = document.getElementById(elementId);

  element.textContent = (difference > 0 ? "+" : "") + difference + unit + " " + comparedPeriod;
  element.classList.toggle("up", difference > 0);
  element.classList.toggle("down", difference < 0);
}

/**
 * Draws the three charts again with the data of the period.
 * @param {object[]} attempts
 * @param {object[]} lists
 * @param {{start: string, end: string}} period
 */
function renderCharts(attempts, lists, period) {
  for (const chart of charts) {
    chart.destroy();
  }

  charts = [
    createDailyChart(attempts, period),
    createResultsChart(attempts),
    createLevelsChart(attempts, lists)
  ];
}

/**
 * Stacked bar chart ("Tentativas por dia") with the right and wrong attempts of each day of the period.
 * @param {object[]} attempts
 * @param {{start: string, end: string}} period
 * @returns {Chart}
 */
function createDailyChart(attempts, period) {
  const days = countAttemptsPerDay(attempts, period);
  const labels = [];
  const rightCounts = [];
  const wrongCounts = [];

  for (const day of days) {
    labels.push(day.label);
    rightCounts.push(day.right);
    wrongCounts.push(day.wrong);
  }

  // A 2px line in the panel color on top of each segment keeps right and wrong apart for color-blind readers.
  const gapColor = readCssVariable("--card");

  return new Chart(document.getElementById("daily-chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Acertos", data: rightCounts, backgroundColor: readCssVariable("--win"), borderColor: gapColor, borderWidth: { top: 2 } },
        { label: "Erros", data: wrongCounts, backgroundColor: readCssVariable("--loss"), borderColor: gapColor, borderWidth: { top: 2 } }
      ]
    },
    options: {
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

/**
 * Donut chart ("Resultados") with the number of right and wrong attempts. The hit rate in its middle is HTML.
 * @param {object[]} attempts
 * @returns {Chart}
 */
function createResultsChart(attempts) {
  const results = countResults(attempts);

  return new Chart(document.getElementById("results-chart"), {
    type: "doughnut",
    data: {
      labels: ["Acertos", "Erros"],
      datasets: [{
        data: [results.right, results.wrong],
        backgroundColor: [readCssVariable("--win"), readCssVariable("--loss")],
        borderColor: readCssVariable("--card"),
        borderWidth: 3
      }]
    },
    options: { cutout: "68%" }
  });
}

/**
 * Horizontal bar chart ("Acerto por nível") with the hit rate of each list, written after the end of each bar.
 * @param {object[]} attempts
 * @param {object[]} lists
 * @returns {Chart}
 */
function createLevelsChart(attempts, lists) {
  const labels = [];
  const rates = [];

  for (const list of lists) {
    labels.push(list.nome);
    rates.push(calculateListHitRate(attempts, list.nome));
  }

  const writeRates = {
    id: "writeRates",
    afterDatasetsDraw(chart) {
      const context = chart.ctx;
      const bars = chart.getDatasetMeta(0).data;

      context.save();
      context.fillStyle = readCssVariable("--ink");
      context.font = "600 12px " + Chart.defaults.font.family;
      context.textBaseline = "middle";
      for (let index = 0; index < bars.length; index++) {
        context.fillText(rates[index] + "%", bars[index].x + 6, bars[index].y);
      }
      context.restore();
    }
  };

  return new Chart(document.getElementById("levels-chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ data: rates, backgroundColor: readCssVariable("--brass"), maxBarThickness: 20 }]
    },
    options: {
      indexAxis: "y",
      // Room on the right for the percentage written after the longest bar.
      layout: { padding: { right: 40 } },
      scales: {
        x: { beginAtZero: true, max: 100 },
        y: { grid: { display: false } }
      }
    },
    plugins: [writeRates]
  });
}

/**
 * Fills the attempts table, or shows the empty message when the period has no attempts.
 * @param {object[]} attempts
 */
function renderTable(attempts) {
  const tableBody = document.getElementById("attempts-body");

  document.getElementById("attempts-empty").hidden = attempts.length > 0;
  document.getElementById("attempts-table").hidden = attempts.length === 0;

  tableBody.innerHTML = "";
  for (const attempt of attempts) {
    tableBody.appendChild(createAttemptRow(attempt));
  }
}

/**
 * Builds one table row: date, list, exercise and result tag.
 * @param {object} attempt
 * @returns {HTMLTableRowElement}
 */
function createAttemptRow(attempt) {
  const row = document.createElement("tr");
  row.appendChild(createCell(formatToBrazilIsoDate(attempt.data_tentativa)));
  row.appendChild(createCell(attempt.lista));
  row.appendChild(createCell(attempt.exercicio));

  const tag = document.createElement("span");
  if (attempt.acertou) {
    tag.className = "tag acerto";
    tag.textContent = "Acerto";
  } else {
    tag.className = "tag erro";
    tag.textContent = "Erro";
  }

  const resultCell = document.createElement("td");
  resultCell.appendChild(tag);
  row.appendChild(resultCell);
  return row;
}

/**
 * Creates a table cell with textContent, so text from the database is never read as HTML.
 * @param {string} text
 * @returns {HTMLTableCellElement}
 */
function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

/**
 * Counts the right and wrong attempts.
 * @param {object[]} attempts
 * @returns {{right: number, wrong: number}}
 */
function countResults(attempts) {
  let right = 0;
  let wrong = 0;

  for (const attempt of attempts) {
    if (attempt.acertou) {
      right++;
    } else {
      wrong++;
    }
  }
  return { right: right, wrong: wrong };
}

/**
 * Calculates the hit rate of the attempts made in one list.
 * @param {object[]} attempts
 * @param {string} listName
 * @returns {number} The percentage, 0 when the list has no attempts.
 */
function calculateListHitRate(attempts, listName) {
  const listAttempts = [];

  for (const attempt of attempts) {
    if (attempt.lista === listName) {
      listAttempts.push(attempt);
    }
  }
  return calculateRate(countResults(listAttempts).right, listAttempts.length);
}

/**
 * Compares the attempts of the period with the totals of the previous period, sent by the API.
 * @param {object[]} attempts
 * @param {{total: number, acertos: number}} previousPeriod
 * @returns {{solved: number, hitRate: number}} How much the right attempts and the hit rate (in percentage points)
 *   went up, as positive numbers, or down, as negative ones.
 */
function calculateProgress(attempts, previousPeriod) {
  const right = countResults(attempts).right;
  const hitRate = calculateRate(right, attempts.length);
  const previousHitRate = calculateRate(previousPeriod.acertos, previousPeriod.total);

  return {
    solved: right - previousPeriod.acertos,
    hitRate: Number((hitRate - previousHitRate).toFixed(2))
  };
}

/**
 * Counts the right and wrong attempts of each day of the period, from its first day to its last.
 * @param {object[]} attempts
 * @param {{start: string, end: string}} period
 * @returns {{key: string, label: string, right: number, wrong: number}[]} One item per day, labeled "DD/MM".
 */
function countAttemptsPerDay(attempts, period) {
  const days = [];
  // "T00:00" reads the day at midnight in the user's time zone, not in UTC.
  const day = new Date(period.start + "T00:00");
  const lastDay = new Date(period.end + "T00:00");

  while (day <= lastDay) {
    const label = day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    days.push({ key: formatToYearMonthDay(day), label: label, right: 0, wrong: 0 });
    day.setDate(day.getDate() + 1);
  }

  for (const attempt of attempts) {
    const attemptDayKey = formatToYearMonthDay(new Date(attempt.data_tentativa));

    for (const item of days) {
      if (item.key !== attemptDayKey) {
        continue;
      }
      if (attempt.acertou) {
        item.right++;
      } else {
        item.wrong++;
      }
    }
  }
  return days;
}

/**
 * Returns a week from Monday to Sunday, counted back from the current one.
 * @param {number} weeksAgo - 0 for the current week, 1 for the previous one.
 * @returns {{start: string, end: string}} Days written "YYYY-MM-DD".
 */
function getWeekPeriod(weeksAgo) {
  const DAYS_IN_WEEK = 7;
  const today = new Date();

  const daysSinceMonday = (today.getDay() + 6) % DAYS_IN_WEEK;

  const monday = new Date();
  monday.setDate(today.getDate() - daysSinceMonday - weeksAgo * DAYS_IN_WEEK);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + DAYS_IN_WEEK - 1);

  return { start: formatToYearMonthDay(monday), end: formatToYearMonthDay(sunday) };
}

/**
 * Calculates a share as a percentage with up to two decimals.
 * @param {number} part
 * @param {number} total - 0 gives a rate of 0.
 * @returns {number}
 */
function calculateRate(part, total) {
  if (total === 0) {
    return 0;
  }
  return Number(((part / total) * 100).toFixed(2));
}

/**
 * Writes a date as its day in the user's time zone, so attempts can be grouped by day.
 * @param {Date} date
 * @returns {string} Day as "YYYY-MM-DD".
 */
function formatToYearMonthDay(date) {
  return date.toLocaleDateString("en-CA");
}

/**
 * Writes a day of the period in the Brazilian format.
 * @param {string} dayKey - Day written "YYYY-MM-DD".
 * @returns {string} Day as "DD/MM/YYYY".
 */
function formatToDayMonthYear(dayKey) {
  const parts = dayKey.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

/**
 * Writes a date and time from the API in the Brazilian format, in the user's time zone.
 * @param {string} isoDate - Such as "2026-11-09T18:30:00.000Z".
 * @returns {string} Such as "09/11/2026, 15:30:00".
 */
function formatToBrazilIsoDate(isoDate) {
  return new Date(isoDate).toLocaleString("pt-BR");
}

/**
 * Reads a variable from the :root block of shared/style.css, so the charts use the page's colors.
 * @param {string} name - Such as "--win".
 * @returns {string}
 */
function readCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

startDashboard();
