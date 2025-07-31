// bundle.js
// Auto-ejecutable que combina csvLoader, métricas y UI sin imports/exports
(() => {
  /* ---------- csvLoader ---------- */
  const loadCsv = (file) =>
    new Promise((resolve, reject) => {
      if (!file) { reject(new Error("No se recibió archivo")); return; }
      if (!file.name.toLowerCase().endsWith(".csv")) {
        reject(new Error("Formato no válido: selecciona un archivo .csv")); return;
      }
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });

  /* ---------- metrics ---------- */
  const classifyLogin = (rows) => {
    const errUsers = new Map(), okUsers = new Map();
    rows.forEach((r) => {
      const id = r["AppsFlyer ID"]?.trim() || null;
      if (!id) return;
      const name = (r["Event Name"] || "").toLowerCase();
      const val  = (r["Event Value"] || "").toLowerCase();
      const time = new Date(r["Event Time"]);
      if (name === "ud_error" && val.includes('"ud_flow":"login"')) {
        if (!errUsers.has(id)) errUsers.set(id, []);
        errUsers.get(id).push(time);
      }
      if (name === "af_login") {
        if (!okUsers.has(id)) okUsers.set(id, []);
        okUsers.get(id).push(time);
      }
    });

    const onlySuccess = [], onlyError = [], errorThenSuccess = [];
    const countsSuccess = {}, countsError = {}, countsErrThenOk = {};
    const all = new Set([...errUsers.keys(), ...okUsers.keys()]);

    all.forEach((id) => {
      const errs = errUsers.get(id) || [];
      const oks  = okUsers.get(id)  || [];
      if (oks.length > 0 && errs.length === 0) {
        onlySuccess.push(id); countsSuccess[id] = oks.length;
      } else if (errs.length > 0 && oks.length === 0) {
        onlyError.push(id);   countsError[id]  = errs.length;
      } else if (errs.length > 0 && oks.length > 0) {
        errorThenSuccess.push(id); countsErrThenOk[id] = errs.length + oks.length;
      }
    });

    const categoryEvents = { OK: [], "Error→OK": [], Error: [] };
    const userCategory = {};
    onlySuccess.forEach((u) => (userCategory[u] = "OK"));
    onlyError.forEach((u)   => (userCategory[u] = "Error"));
    errorThenSuccess.forEach((u) => (userCategory[u] = "Error→OK"));

    rows.forEach((r) => {
      const id = r["AppsFlyer ID"]?.trim() || null;
      if (!id) return;
      const cat = userCategory[id];
      if (!cat) return;
      const name = (r["Event Name"] || "").toLowerCase();
      const val  = (r["Event Value"] || "").toLowerCase();
      if (cat === "OK" && name === "af_login") {
        categoryEvents.OK.push(r);
      }
      if (cat === "Error" && name === "ud_error" && val.includes('"ud_flow":"login"')) {
        categoryEvents.Error.push(r);
      }
      if (cat === "Error→OK") {
        if (name === "ud_error" && val.includes('"ud_flow":"login"')) {
          categoryEvents["Error→OK"].push(r);
        }
        if (name === "af_login") {
          categoryEvents["Error→OK"].push(r);
        }
      }
    });

    const categoryCounts = { OK: {}, Error: {}, "Error→OK": {} };
    Object.entries(categoryEvents).forEach(([cat, evs]) => {
      evs.forEach((ev) => {
        const uid = ev["AppsFlyer ID"];
        categoryCounts[cat][uid] = (categoryCounts[cat][uid] || 0) + 1;
      });
    });

    return {
      categoryUsers: { OK: onlySuccess, "Error→OK": errorThenSuccess, Error: onlyError },
      categoryCounts,
      categoryEvents,
      allUsers: [...all],
    };
  };

  // Nueva función para registro
  const classifyRegistro = (rows) => {
    const errUsers = new Map(), okUsers = new Map();
    rows.forEach((r) => {
      const id = r["AppsFlyer ID"]?.trim() || null;
      if (!id) return;
      const name = (r["Event Name"] || "").toLowerCase();
      const val  = (r["Event Value"] || "").toLowerCase();
      const time = new Date(r["Event Time"]);
      if (name === "ud_error" && val.includes('"ud_flow":"registro"')) {
        if (!errUsers.has(id)) errUsers.set(id, []);
        errUsers.get(id).push(time);
      }
      if (name === "af_complete_registration") {
        if (!okUsers.has(id)) okUsers.set(id, []);
        okUsers.get(id).push(time);
      }
    });

    const onlySuccess = [], onlyError = [], errorThenSuccess = [];
    const countsSuccess = {}, countsError = {}, countsErrThenOk = {};
    const all = new Set([...errUsers.keys(), ...okUsers.keys()]);

    all.forEach((id) => {
      const errs = errUsers.get(id) || [];
      const oks  = okUsers.get(id)  || [];
      if (oks.length > 0 && errs.length === 0) {
        onlySuccess.push(id); countsSuccess[id] = oks.length;
      } else if (errs.length > 0 && oks.length === 0) {
        onlyError.push(id);   countsError[id]  = errs.length;
      } else if (errs.length > 0 && oks.length > 0) {
        errorThenSuccess.push(id); countsErrThenOk[id] = errs.length + oks.length;
      }
    });

    const categoryEvents = { OK: [], "Error→OK": [], Error: [] };
    const userCategory = {};
    onlySuccess.forEach((u) => (userCategory[u] = "OK"));
    onlyError.forEach((u)   => (userCategory[u] = "Error"));
    errorThenSuccess.forEach((u) => (userCategory[u] = "Error→OK"));

    rows.forEach((r) => {
      const id = r["AppsFlyer ID"]?.trim() || null;
      if (!id) return;
      const cat = userCategory[id];
      if (!cat) return;
      const name = (r["Event Name"] || "").toLowerCase();
      const val  = (r["Event Value"] || "").toLowerCase();
      if (cat === "OK" && name === "af_complete_registration") {
        categoryEvents.OK.push(r);
      }
      if (cat === "Error" && name === "ud_error" && val.includes('"ud_flow":"registro"')) {
        categoryEvents.Error.push(r);
      }
      if (cat === "Error→OK") {
        if (name === "ud_error" && val.includes('"ud_flow":"registro"')) {
          categoryEvents["Error→OK"].push(r);
        }
        if (name === "af_complete_registration") {
          categoryEvents["Error→OK"].push(r);
        }
      }
    });

    const categoryCounts = { OK: {}, Error: {}, "Error→OK": {} };
    Object.entries(categoryEvents).forEach(([cat, evs]) => {
      evs.forEach((ev) => {
        const uid = ev["AppsFlyer ID"];
        categoryCounts[cat][uid] = (categoryCounts[cat][uid] || 0) + 1;
      });
    });

    return {
      categoryUsers: { OK: onlySuccess, "Error→OK": errorThenSuccess, Error: onlyError },
      categoryCounts,
      categoryEvents,
      allUsers: [...all],
    };
  };

  /* ---------- main ---------- */
  window.onerror = (...args) => console.error("Global error:", ...args);

  let allRows = [], currentRows = [], savedRows = [];
  let currentLevel = 0;
  let currentCategory = null;
  let currentEventVal = null;
  let savedFilterStart = null, savedFilterEnd = null;
  let chartType = "pie";
  let filterStart = null, filterEnd = null;
  const eventFilters = {};

  // Selección de tipo de análisis
  const analysisSelect = document.getElementById("analysisTypeSelect");
  const metricTypeSelect = document.getElementById("metricTypeSelect");
  let analysisType = "login";
  let metricType = "unique";

  // Normalize Event Value
  function getEvVal(r) {
    const raw = r["Event Value"] || "";
    return raw.trim() === "{}" || raw.trim() === "" ? "login exitoso" : raw.trim();
  }

  function filterPipeline() {
    // Normalize displayed date range
    if (filterStart) {
      dateRangeInput.value = filterEnd && filterEnd !== filterStart
        ? `${filterStart} - ${filterEnd}`
        : filterStart;
    }
    let rows = allRows;
    if (filterStart) {
      const sd = filterStart, ed = filterEnd || sd;
      rows = rows.filter((r) => {
        const d = r["Event Time"].slice(0,10);
        return sd === ed ? d === sd : d >= sd && d <= ed;
      });
    }
    rows = rows.filter((r) => eventFilters[getEvVal(r)] !== false);
    updateFromRows(rows);
  }

  // Elementos DOM
  const fileInput = document.getElementById("fileUpload");
  const statusMsg = document.getElementById("statusMsg");
  const modeSelect = document.getElementById("modeSelect");
  const dateRangeInput = document.getElementById("dateRange");
  const loader = document.getElementById("loader");
  const chartTypeSelect = document.getElementById("chartTypeSelect");
  const pieDiv = document.getElementById("pieChart");
  const chartSection = document.getElementById("chartSection");
  const barSection = document.getElementById("barSection");
  const backButton = document.getElementById("backButton");
  const tableSection = document.getElementById("tableSection");
  const tableTitle = document.getElementById("tableTitle");
  const detailsBody = document.querySelector("#detailsTable tbody");
  const tableOverlay = document.getElementById("tableOverlay");
  const metricsSection = document.getElementById("metricsSection");
  // Main title and metric container
  const mainTitle = document.getElementById("mainTitle");
  const metricContainer = document.getElementById("metricContainer");

  // On initial load, set mainTitle and hide metricContainer
  mainTitle.textContent = "Login Analytics";

  // Deshabilitar hasta carga de CSV
  chartTypeSelect.disabled = true;
  analysisSelect.disabled  = true;
  metricTypeSelect.disabled = true;
  if (modeSelect) modeSelect.disabled = true;

  // Litepicker
  const picker = new Litepicker({
    element: dateRangeInput,
    singleMode: false,
    format: "YYYY-MM-DD",
    lang: "es-PE",
    delimiter: "-",
    setup: picker => {
      picker.on("selected", (startDate, endDate) => {
        const sd = startDate.format("YYYY-MM-DD");
        const ed = endDate ? endDate.format("YYYY-MM-DD") : sd;
        filterStart = sd;
        filterEnd   = ed !== sd ? ed : null;
        // Set single date if same, else range
        dateRangeInput.value = sd === ed ? sd : `${sd} - ${ed}`;
        // Hide picker immediately
        picker.hide();
        // Apply filter
        filterPipeline();
      });
    }
  });

  // Listeners de controles
  // modeSelect.addEventListener("change", () => {
  //   drawCurrentChart();
  // });
  chartTypeSelect.addEventListener("change", (e) => {
    chartType = e.target.value;
    drawCurrentChart();
  });

  metricTypeSelect.addEventListener("change", (e) => {
    metricType = e.target.value;
    drawCurrentChart();
  });

analysisSelect.addEventListener("change", (e) => {
  analysisType = e.target.value;
  if (analysisType === "navigation") {
    chartType = "bar";
    chartTypeSelect.value = "bar";
    navGroupVisibility = {};
    chartTypeSelect.disabled = true;
    metricTypeSelect.disabled = false;
    metricContainer.classList.remove("hidden");
    mainTitle.textContent = "Navigation Analytics";
  } else {
    chartTypeSelect.disabled = false;
    metricTypeSelect.disabled = true;
    metricContainer.classList.add("hidden");
    mainTitle.textContent = analysisType === "registro" ? "Registro Analytics" : "Login Analytics";
  }
  // Limpiar o mostrar tabla según modo seleccionado
  if (analysisType === "navigation") {
    detailsBody.innerHTML = "";
    navGroupVisibility = {};           // ya estaba arriba, se mantiene
    updateNavigationTable();           // prepara tabla inicial
    tableSection.classList.remove("hidden");
  } else {
    tableSection.classList.add("hidden");  // ocultar tabla para login/registro hasta que el usuario baje de nivel
    detailsBody.innerHTML = "";
    tableTitle.innerHTML  = "";
  }
  updateFromRows(allRows);
});

  // Formatear entrada manual de fechas
  dateRangeInput.addEventListener('change', () => {
    const val = dateRangeInput.value.trim();
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const rangePattern = /^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/;
    let sd, ed;
    if (rangePattern.test(val)) {
      [, sd, ed] = val.match(rangePattern);
      if (sd === ed) {
        filterStart = sd;
        filterEnd   = null;
        dateRangeInput.value = sd;
      } else {
        filterStart = sd;
        filterEnd   = ed;
      }
    } else if (datePattern.test(val)) {
      filterStart = val;
      filterEnd   = null;
    } else {
      return;
    }
    // Actualizar picker y filtrado
    picker.setDateRange(filterStart, filterEnd || filterStart);
    filterPipeline();
  });

backButton.addEventListener("click", () => {
  // Restaurar filtros previos
  filterStart = savedFilterStart;
  filterEnd   = savedFilterEnd;
  // Actualizar picker y visualización de rango
  if (filterStart) {
    dateRangeInput.value = filterEnd && filterEnd !== filterStart
      ? `${filterStart} - ${filterEnd}`
      : filterStart;
    picker.setDateRange(filterStart, filterEnd || filterStart);
  }
  // Volver a barras
  chartType = "bar";
  chartTypeSelect.value = "bar";
  updateFromRows(savedRows);
  // Limpiar estado de drill-down
  savedRows = [];
});

  fileInput.addEventListener("change", async (e) => {
    loader.classList.remove("hidden");
    const file = e.target.files[0];
    if (!file) {
      loader.classList.add("hidden");
      return;
    }
    statusMsg.textContent = "Procesando…";
    try {
      const rows = await loadCsv(file);
      allRows = rows;
      rows.forEach((r) => { eventFilters[getEvVal(r)] = true; });

      // Inicializar filtro de fecha según CSV
      const dates = rows.map(r => r["Event Time"].slice(0,10));
      const uniqueDates = [...new Set(dates)].sort();
      const minDate = uniqueDates[0];
      const maxDate = uniqueDates[uniqueDates.length - 1];
      filterStart = minDate;
      filterEnd   = maxDate !== minDate ? maxDate : null;
      // Mostrar rango en input (min-max o solo min)
      dateRangeInput.value = filterEnd ? `${minDate} - ${maxDate}` : minDate;
      // Establecer selección en el datepicker
      picker.setDateRange(minDate, filterEnd || minDate);

      // Habilitar controles
      if (modeSelect) modeSelect.disabled = false;
      chartTypeSelect.disabled = false;
      analysisSelect.disabled  = false;
      // (Above disables, below enables after load)
      chartTypeSelect.disabled = false;
      analysisSelect.disabled  = false;
      metricTypeSelect.disabled = analysisType !== "navigation";

      statusMsg.textContent = `CSV cargado: ${rows.length} filas.`;
      filterPipeline();
      loader.classList.add("hidden");
    } catch (err) {
      statusMsg.textContent = `Error: ${err.message}`;
      console.error(err);
      loader.classList.add("hidden");
    }
  });

  // Estado actual
  let categoryUsers = {}, categoryCounts = {}, categoryEvents = {}, userVisibility = {};
  let navOptionUsers = {}, navOptionCounts = {};
  // Estado de visibilidad de navegación (Navigation legend)
  let navGroupVisibility = {};

  async function updateFromRows(rows) {
    currentRows = rows;
    let result;
    if (analysisType === "registro") {
      result = classifyRegistro(rows);
    } else if (analysisType === "navigation") {
      result = classifyNavigation(rows);
    } else {
      result = classifyLogin(rows);
    }
    categoryUsers    = result.categoryUsers;
    categoryCounts   = result.categoryCounts;
    categoryEvents   = result.categoryEvents;
    userVisibility   = Object.fromEntries(result.allUsers.map(u => [u, true]));
    if (analysisType === "navigation") {
      navOptionUsers  = result.optionUsers;
      navOptionCounts = result.optionCounts;
    }
    if (analysisType !== "navigation") {
      const stats = computeEventStats(rows);
      updateMetrics(stats, {
        onlySuccess: categoryUsers.OK.length,
        onlyError:   categoryUsers.Error.length,
        both:        categoryUsers["Error→OK"].length
      });
    } else {
      metricsSection.classList.add("hidden");
    }
    drawCurrentChart();
  }

  function drawCurrentChart() {
    if (analysisType === "navigation") {
      drawNavigationChart();
      return;
    }
    if (chartType === "pie") {
      chartSection.classList.remove("hidden");
      barSection.classList.add("hidden");
      drawPie();
    } else {
      chartSection.classList.add("hidden");
      barSection.classList.remove("hidden");
      drawBar();
    }
  }
  // Nueva función para navegación (af_navigation)
  const classifyNavigation = (rows) => {
    const categoryEvents = {};       // group -> array of rows
    const optionUsers    = {};       // group -> option -> Set of users
    const optionCounts   = {};       // group -> option -> # events

    rows.forEach((r) => {
      if ((r["Event Name"] || "").toLowerCase() !== "af_navigation") return;
      // Use original JSON if preserved, else current value
      const rawEV = r._fullEventValue || r["Event Value"] || "";
      let obj;
      try {
        obj = JSON.parse(rawEV);
      } catch { obj = {}; }
      const group  = obj.group  || "Otro";
      const option = obj.option || "Sin nombre";
      // Guarda el valor completo del JSON para el nivel 3 (only if not already set)
      if (!r._fullEventValue) r._fullEventValue = r["Event Value"];
      r["Event Value"] = option;           // Sobrescribe para reutilizar la lógica existente

      (categoryEvents[group] = categoryEvents[group] || []).push(r);

      const uid = r["AppsFlyer ID"]?.trim() || "";
      optionUsers[group]  = optionUsers[group]  || {};
      optionCounts[group] = optionCounts[group] || {};
      optionUsers[group][option]  = optionUsers[group][option]  || new Set();
      optionCounts[group][option] = (optionCounts[group][option] || 0) + 1;
      optionUsers[group][option].add(uid);
    });

    // Compose flat user lists for navigation
    const allUsersSet = new Set();
    Object.values(optionUsers).forEach(optMap =>
      Object.values(optMap).forEach(set => set.forEach(u => allUsersSet.add(u)))
    );
    return {
      categoryUsers: { OK: Array.from(allUsersSet), "Error→OK": [], Error: [] },
      categoryCounts: {}, // not used for navigation
      categoryEvents,
      optionUsers,
      optionCounts,
      allUsers: Array.from(allUsersSet)
    };
  };
  // Helper to build traces for navigation chart, returns {traces, allOptions}
  function buildNavTraces() {
    const allGroups = Object.keys(navOptionCounts);
    const visibleGroups = allGroups.filter(g => navGroupVisibility[g] !== false);
    const baseGroups = visibleGroups.length ? visibleGroups : allGroups;

    // 1) Compute total metric per option across the base groups
    const optionTotals = {};
    baseGroups.forEach(g => {
      Object.keys(navOptionCounts[g]).forEach(opt => {
        const val = metricType === 'unique'
          ? (navOptionUsers[g]?.[opt]?.size || 0)
          : (navOptionCounts[g][opt] || 0);
        optionTotals[opt] = (optionTotals[opt] || 0) + val;
      });
    });

    // 2) Sort options descending by total metric, tie‑break alphabetically
    const allOptions = Object.keys(optionTotals).sort((a,b) => {
      const diff = optionTotals[b] - optionTotals[a];
      return diff !== 0 ? diff : a.localeCompare(b);
    });

    // 3) Build trace per group (keeps legend even if hidden)
    const traces = allGroups.map(g => {
      const visible = navGroupVisibility[g] !== false;
      const yVals = allOptions.map(opt => {
        if (!visible) return 0;
        return metricType === 'unique'
          ? (navOptionUsers[g]?.[opt]?.size || 0)
          : (navOptionCounts[g]?.[opt] || 0);
      });
      return {
        x: allOptions,
        y: yVals,
        name: g,
        type: 'bar',
        visible: visible ? true : 'legendonly'
      };
    });
    return { traces, allOptions };
  }

  // Helper to render navigation chart (bar), firstRender: whether to use newPlot
  function renderNavChart(firstRender=false) {
    const barDiv = document.getElementById('barChart');
    const {traces} = buildNavTraces();
    const layout = {
      barmode:'group',
      title: metricType==='unique'? 'Usuarios únicos por opción (Navigation)' : 'Repeticiones por opción (Navigation)',
      height:400,
      margin:{t:60,b:140,l:60,r:10},
      xaxis:{type:'category', tickangle:-45, automargin:true},
      yaxis:{title: metricType==='unique'? 'Usuarios únicos':'Repeticiones', automargin:true}
    };
    if(firstRender) {
      Plotly.newPlot(barDiv, traces, layout, {responsive:true});
    } else {
      Plotly.react(barDiv, traces, layout, {responsive:true});
    }
  }

  function drawNavigationChart() {
    // 6) Show overlay at the very top
    tableOverlay.classList.remove("hidden");

    chartSection.classList.add("hidden");
    barSection.classList.remove("hidden");
    const barDiv = document.getElementById("barChart");
    // Robustly purge previous chart if exists
    if(window.Plotly && barDiv) { try { Plotly.purge(barDiv); } catch{} }
    const groups = Object.keys(navOptionCounts);
    // 3) Initialize navGroupVisibility for any group not present
    groups.forEach(g => { if (!(g in navGroupVisibility)) navGroupVisibility[g] = true; });

    // Render navigation chart with traces based on navGroupVisibility
    renderNavChart(true);

    // Remove previous listeners if present
    if(barDiv.removeAllListeners) { barDiv.removeAllListeners(); }
    // Attach custom legend click: toggle group visibility and rerender
    barDiv.on('plotly_legendclick', (ev)=>{
      const grp = barDiv.data[ev.curveNumber].name;
      navGroupVisibility[grp] = !(navGroupVisibility[grp]===true);
      renderNavChart(false);
      updateNavigationTable();
      return false;
    });

    // Al hacer clic en una barra: mostrar tabla detallada
    barDiv.on("plotly_click", (ev) => {
      const opt = ev.points[0].x;
      const grp = ev.points[0].data.name;
      showEventUsers(grp, opt);
    });

    // 3) Call updateNavigationTable after plotting
    updateNavigationTable();

    // 6) Hide overlay and show table section
    tableOverlay.classList.add("hidden");
    tableSection.classList.remove("hidden");
  }

  // 2) Helper to build/refresh Navigation Level 1 table
  function updateNavigationTable() {
    currentLevel = 1;
    tableTitle.innerHTML = '<span>Navegación</span>';
    detailsBody.innerHTML = '';
    // Build rows [{group, option, uniq, reps}] only for visible groups
    let rows = [];
    const uniqUsersSet = new Set();
    Object.entries(navOptionUsers).forEach(([g, optMap]) => {
      if (navGroupVisibility[g] === false) return;
      Object.keys(optMap).forEach(opt => {
        const userSet = navOptionUsers[g][opt] || new Set();
        userSet.forEach(u => uniqUsersSet.add(u));
        rows.push({
          group: g,
          option: opt,
          uniq: navOptionUsers[g][opt]?.size || 0,
          reps: navOptionCounts[g][opt] || 0
        });
      });
    });
    // Sort descending by selected metric, then group, then option
    rows.sort((a, b) => {
      const mA = metricType === 'unique' ? a.uniq : a.reps;
      const mB = metricType === 'unique' ? b.uniq : b.reps;
      if (mB !== mA) return mB - mA;
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.option.localeCompare(b.option);
    });
    // Set thead
    document.querySelector('#detailsTable thead tr').innerHTML = `
      <th>Grupo</th><th>Opción</th><th>Usuarios únicos</th><th>Repeticiones</th>
    `;
    // Write tbody rows, Option td includes drill button with data-group
    rows.forEach(({ group, option, uniq, reps }) => {
      detailsBody.innerHTML += `
        <tr>
          <td class="px-4 py-1">${group}</td>
          <td class="px-4 py-1 flex items-center justify-between">
            <span>${option}</span>
            <button class="drill-event-button text-blue-500 hover:text-blue-700 px-1" data-group="${group}">›</button>
          </td>
          <td class="px-4 py-1 text-center">${uniq}</td>
          <td class="px-4 py-1 text-center">${reps}</td>
        </tr>
      `;
    });
    // Add totals row
    const totUniq = uniqUsersSet.size;
    const totReps = rows.reduce((s,r)=>s+r.reps,0);
    detailsBody.innerHTML += `<tr class="font-semibold bg-gray-50"><td class="px-4 py-1 text-right" colspan="2">Total</td><td class="px-4 py-1 text-center">${totUniq}</td><td class="px-4 py-1 text-center">${totReps}</td></tr>`;
    // Show table and hide overlay
    tableSection.classList.remove('hidden');
    tableOverlay.classList.add('hidden');
  }

  function visibleCounts() {
    // Always users mode
    return ["OK","Error→OK","Error"].map(lbl =>
      categoryUsers[lbl].filter(u => userVisibility[u]).length
    );
  }

  function drawPie() {
    const labels = ["OK","Error→OK","Error"];
    Plotly.newPlot(pieDiv, [{
      type: "pie",
      labels,
      values: visibleCounts(),
      hoverinfo: "label+percent+value",
      textinfo: "percent",
      marker: { colors: ["#66CDAA","#4682B4","#FFA07A"] }
    }], {
      title: analysisType === "registro"
               ? "Usuarios únicos – Registro"
               : "Usuarios únicos – Login",
      height: 400, margin: { t:60,b:20,l:0,r:0 }
    }, { responsive: true });

    tableSection.classList.add("hidden");
    pieDiv.on("plotly_click", (ev) => {
      const idx   = ev.points[0].pointNumber;
      const label = labels[idx];
      showTable(label);
    });
    pieDiv.on("plotly_legendclick", () => {
      setTimeout(() => {
        Plotly.restyle(pieDiv, "values", [visibleCounts()]);
      }, 0);
    });
  }

  function drawBar() {
    // Agrupar por día usando la fecha original del CSV
    const byDate = {};
    currentRows.forEach(r => {
      const key = r["Event Time"].slice(0,10);
      (byDate[key] = byDate[key] || []).push(r);
    });
    const dates = Object.keys(byDate).sort();
    const okCount = [], bothCount = [], errCount = [];
    dates.forEach(day => {
      const res = analysisType === "registro"
        ? classifyRegistro(byDate[day])
        : classifyLogin(byDate[day]);
      okCount.push(res.categoryUsers.OK.length);
      bothCount.push(res.categoryUsers["Error→OK"].length);
      errCount.push(res.categoryUsers.Error.length);
    });
    const totals = dates.map((d,i)=>okCount[i]+bothCount[i]+errCount[i]);
    Plotly.newPlot(
      document.getElementById("barChart"),
      [
        { x:dates, y:okCount,   name:"OK",         type:"bar", marker:{color:"#66CDAA"}, hoverinfo:"y", hovertemplate:"%{y}" },
        { x:dates, y:bothCount, name:"Error→OK",   type:"bar", marker:{color:"#4682B4"}, hoverinfo:"y", hovertemplate:"%{y}" },
        { x:dates, y:errCount,  name:"Error",      type:"bar", marker:{color:"#FFA07A"}, hoverinfo:"y", hovertemplate:"%{y}" }
      ],
      {
        barmode:"stack",
        title: analysisType === "registro"
                 ? "Registro por día y categoría"
                 : "Usuarios únicos por día y categoría",
        height:400,
        xaxis:{type:"category", tickformat:"%Y-%m-%d"},
        yaxis:{title:"Cantidad de usuarios"},
        annotations:dates.map((d,i)=>({
          x:d, y:totals[i], text:String(totals[i]), showarrow:false, yanchor:"bottom"
        }))
      },
      { responsive:true }
    );
    const barDiv = document.getElementById("barChart");
    barDiv.on("plotly_restyle", () => {
      const vis = barDiv.data.map(t => t.visible !== false && t.visible !== "legendonly");
      const updTotals = dates.map((_,i)=>
        (vis[0]?okCount[i]:0)+(vis[1]?bothCount[i]:0)+(vis[2]?errCount[i]:0)
      );
      Plotly.relayout(barDiv, {
        annotations:dates.map((d,i)=>({
          x:d, y:updTotals[i], text:String(updTotals[i]), showarrow:false, yanchor:"bottom"
        }))
      });
    });
    barDiv.on("plotly_click", (ev) => {
      const day = ev.points[0].x;
      // Guardar filtros actuales
      savedFilterStart = filterStart;
      savedFilterEnd   = filterEnd;
      // Guardar filas antes de drill-down
      savedRows = currentRows.slice();
      // Establecer fecha única seleccionada
      filterStart = day;
      filterEnd   = null;
      dateRangeInput.value = day;
      picker.setDateRange(day, day);
      // Cambiar al gráfico de torta
      chartType = "pie";
      chartTypeSelect.value = "pie";
      updateFromRows(savedRows.filter(r => r["Event Time"].startsWith(day)));
    });
  }

  function showTable(label) {
    tableOverlay.classList.remove("hidden");
    setTimeout(() => {
      // Drill Level 1: Event summary for a category
      currentLevel = 1;
      currentCategory = label;
      currentEventVal = null;
      detailsBody.innerHTML = "";
      tableTitle.innerHTML = `<span>${label}</span>`;
      const mapEV = new Map();
      categoryEvents[label].forEach(ev => {
        const v = getEvVal(ev), id = ev["AppsFlyer ID"];
        if (!mapEV.has(v)) mapEV.set(v, {users:new Set(), events:0});
        const o = mapEV.get(v);
        o.users.add(id);
        o.events++;
      });
      const rows = [...mapEV.entries()].sort((a,b)=>b[1].users.size-a[1].users.size);
      const totalUsers = new Set(categoryEvents[label].map(ev=>ev["AppsFlyer ID"])).size;
      document.querySelector("#detailsTable thead tr").innerHTML = `
        <th>Evento</th><th>Usuarios únicos</th><th>Repeticiones</th><th>% usuarios</th>
      `;
      rows.forEach(([evVal,obj]) => {
        const pct = totalUsers ? Math.round(obj.users.size/totalUsers*100) : 0;
        detailsBody.innerHTML += `
          <tr>
            <td class="px-4 py-1 flex items-center justify-between">
              <span>${evVal}</span>
              <button class="drill-event-button text-blue-500 hover:text-blue-700 px-1">›</button>
            </td>
            <td class="px-4 py-1 text-center">${obj.users.size}</td>
            <td class="px-4 py-1 text-center">${obj.events}</td>
            <td class="px-4 py-1 text-center">${pct}%</td>
          </tr>
        `;
      });
      detailsBody.innerHTML += `
        <tr class="font-semibold bg-gray-50">
          <td class="px-4 py-1 text-right">Total</td>
          <td class="px-4 py-1 text-center">${totalUsers}</td>
          <td class="px-4 py-1 text-center">${rows.reduce((s,[,o])=>s+o.events,0)}</td>
          <td class="px-4 py-1 text-center">100%</td>
        </tr>
      `;
      tableOverlay.classList.add("hidden");
      tableSection.classList.remove("hidden");
    }, 0);
  }

  // Drill-down clicks in the details table
  detailsBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('drill-event-button')) {
      const evVal = e.target.closest('tr').querySelector('span').textContent;
      // For navigation, set group from data-group attribute if present
      const group = e.target.dataset.group || currentCategory;
      showEventUsers(group, evVal);
    }
    else if (e.target.classList.contains('drill-user-button')) {
      const u = e.target.dataset.user;
      showUserRecords(u);
    }
  });

  function showEventUsers(category, evVal) {
    tableOverlay.classList.remove("hidden");
    setTimeout(() => {
      currentCategory = category;
      currentLevel = 2;
      currentEventVal = evVal;
      tableTitle.innerHTML = `<button id="tableBackButton" class="mr-2 text-gray-600 hover:text-gray-800">←</button>${category} - ${evVal}`;
      detailsBody.innerHTML = '';
      // Override table header as per requirements
      document.querySelector('#detailsTable thead tr').innerHTML = `
        <th>Usuario</th>
        <th>Repeticiones</th>
        <th></th>
      `;
      // build counts per user
      const mapU = new Map();
      categoryEvents[category]
        .filter(r => getEvVal(r) === evVal)
        .forEach(r => {
          const u = r['AppsFlyer ID'];
          mapU.set(u, (mapU.get(u) || 0) + 1);
        });
      [...mapU.entries()]
        .sort((a,b) => b[1] - a[1])
        .forEach(([u,count]) => {
          detailsBody.innerHTML += `
            <tr>
              <td class="px-4 py-1 font-mono">${u}</td>
              <td class="px-4 py-1 text-center">${count}</td>
              <td class="px-4 py-1 text-center">
                <button class="drill-user-button text-blue-500 hover:text-blue-700 px-1" data-user="${u}">›</button>
              </td>
            </tr>`;
        });
      // Add total repetitions row
      const totalReps = [...mapU.values()].reduce((sum, c) => sum + c, 0);
      detailsBody.innerHTML += `
        <tr class="font-semibold bg-gray-50">
          <td class="px-4 py-1 text-right">Total</td>
          <td class="px-4 py-1 text-center">${totalReps}</td>
          <td></td>
        </tr>
      `;
      tableOverlay.classList.add("hidden");
      tableSection.classList.remove('hidden');
      // back to Level1
      document.getElementById('tableBackButton')
        .addEventListener('click', () => showTable(category));
    }, 0);
  }

  function showUserRecords(userId) {
    tableOverlay.classList.remove("hidden");
    setTimeout(() => {
      currentLevel = 3;
      tableTitle.innerHTML = `<button id="tableBackButton" class="mr-2 text-gray-600 hover:text-gray-800">←</button>${userId}`;
      detailsBody.innerHTML = '';
      // Override table header as per requirements
      document.querySelector('#detailsTable thead tr').innerHTML = `
        <th>Evento</th>
        <th>Descripción</th>
        <th>Fecha</th>
      `;
      let recs = currentRows.filter(r => r['AppsFlyer ID'] === userId);
      recs = recs.filter(r => {
        const name = (r['Event Name'] || '').toLowerCase();
        const val  = (r['Event Value'] || '').toLowerCase();
        if (analysisType === 'navigation') {
          return name === 'af_navigation';
        }
        if (analysisType === 'login') {
          return name === 'af_login' || (name === 'ud_error' && val.includes('"ud_flow":"login"'));
        }
        // registro
        return name === 'af_complete_registration' || (name === 'ud_error' && val.includes('"ud_flow":"registro"'));
      });
      // sort by time asc
      recs.sort((a,b) => new Date(a['Event Time']) - new Date(b['Event Time']));
      recs.forEach(r => {
        detailsBody.innerHTML += `
          <tr>
            <td class="px-4 py-1">${r['Event Name']}</td>
            <td class="px-4 py-1 whitespace-pre-wrap break-words">${analysisType==='navigation' ? (r._fullEventValue || '') : (r['Event Value'] || '')}</td>
            <td class="px-4 py-1">${r['Event Time']}</td>
          </tr>
        `;
      });
      tableOverlay.classList.add("hidden");
      tableSection.classList.remove('hidden');
      // back to Level2
      document.getElementById('tableBackButton')
        .addEventListener('click', () => showEventUsers(currentCategory, currentEventVal));
    }, 0);
  }

  function computeEventStats(rows) {
    let total=0, ok=0, err=0;
    rows.forEach(r => {
      const name=(r["Event Name"]||"").toLowerCase();
      const val =(r["Event Value"]||"").toLowerCase();
      if (analysisType==="registro") {
        if (name==="af_complete_registration")                            { ok++; total++; }
        if (name==="ud_error" && val.includes('"ud_flow":"registro"'))    { err++; total++; }
      } else {
        if (name==="af_login")                                             { ok++; total++; }
        if (name==="ud_error" && val.includes('"ud_flow":"login"'))       { err++; total++; }
      }
    });
    return { total, ok, err };
  }

  function updateMetrics(eventStats, userStats) {
    document.getElementById("m-totalEvents").textContent = eventStats.total;
    document.getElementById("m-eventsOk").textContent     = eventStats.ok;
    document.getElementById("m-eventsErr").textContent    = eventStats.err;
    const successTotal = userStats.onlySuccess + userStats.both;
    const totalAll     = successTotal + userStats.onlyError;
    document.getElementById("m-totalAll").textContent     = totalAll;
    document.getElementById("m-successTotal").textContent = successTotal;
    document.getElementById("m-onlySuccess").textContent  = userStats.onlySuccess;
    document.getElementById("m-both").textContent         = userStats.both;
    document.getElementById("m-onlyError").textContent    = userStats.onlyError;
    metricsSection.classList.remove("hidden");
  }
})();