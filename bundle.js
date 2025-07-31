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
  let savedFilterStart = null, savedFilterEnd = null;
  let chartType = "pie";
  let filterStart = null, filterEnd = null;
  const eventFilters = {};

  // Selección de tipo de análisis
  const analysisSelect = document.getElementById("analysisTypeSelect");
  let analysisType = "login";

  // Normalize Event Value
  function getEvVal(r) {
    const raw = r["Event Value"] || "";
    return raw.trim() === "{}" || raw.trim() === "" ? "login exitoso" : raw.trim();
  }

  function filterPipeline() {
    // Normalize displayed date range
    if (filterStart) {
      dateRangeInput.value = filterEnd && filterEnd !== filterStart
        ? `${filterStart}-${filterEnd}`
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
  const metricsSection = document.getElementById("metricsSection");

  // Deshabilitar hasta carga de CSV
  modeSelect.disabled      = true;
  chartTypeSelect.disabled = true;
  analysisSelect.disabled  = true;

  // Litepicker
  const picker = new Litepicker({
    element: dateRangeInput,
    singleMode: false,
    format: "YYYY-MM-DD",
    lang: "es-PE",
    delimiter: "-",
    setup: (picker) => {
      picker.on("selected", (startDate, endDate) => {
        const sd = startDate.format("YYYY-MM-DD");
        const ed = endDate ? endDate.format("YYYY-MM-DD") : sd;
        filterStart = sd;
        filterEnd   = ed !== sd ? ed : null;
        dateRangeInput.value = filterEnd ? `${filterStart}-${filterEnd}` : filterStart;
        filterPipeline();
      });
    },
  });

  // Listeners de controles
  modeSelect.addEventListener("change", () => {
    drawCurrentChart();
  });
  chartTypeSelect.addEventListener("change", (e) => {
    chartType = e.target.value;
    drawCurrentChart();
  });

  analysisSelect.addEventListener("change", (e) => {
    analysisType = e.target.value;
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
      ? `${filterStart}-${filterEnd}`
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
      dateRangeInput.value = filterEnd ? `${minDate}-${maxDate}` : minDate;
      // Establecer selección en el datepicker
      picker.setDateRange(minDate, filterEnd || minDate);

      // Habilitar controles
      modeSelect.disabled      = false;
      chartTypeSelect.disabled = false;
      analysisSelect.disabled  = false;

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

  async function updateFromRows(rows) {
    currentRows = rows;
    const result = analysisType === "registro"
      ? classifyRegistro(rows)
      : classifyLogin(rows);
    categoryUsers    = result.categoryUsers;
    categoryCounts   = result.categoryCounts;
    categoryEvents   = result.categoryEvents;
    userVisibility   = Object.fromEntries(result.allUsers.map(u => [u, true]));
    const stats = computeEventStats(rows);
    updateMetrics(stats, {
      onlySuccess: categoryUsers.OK.length,
      onlyError:   categoryUsers.Error.length,
      both:        categoryUsers["Error→OK"].length
    });
    drawCurrentChart();
  }

  function drawCurrentChart() {
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

  function visibleCounts() {
    if (modeSelect.value === "users") {
      return ["OK","Error→OK","Error"].map(lbl =>
        categoryUsers[lbl].filter(u => userVisibility[u]).length
      );
    } else {
      return ["OK","Error→OK","Error"].map(lbl =>
        categoryEvents[lbl].filter(ev => userVisibility[ev["AppsFlyer ID"]]).length
      );
    }
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
    detailsBody.innerHTML = "";
    tableTitle.textContent = label;
    if (modeSelect.value === "users") {
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
            <td class="px-4 py-1">${evVal}</td>
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
    } else {
      // tabla de eventos
      categoryEvents[label].forEach(ev => {
        detailsBody.innerHTML += `
          <tr>
            <td><input type="checkbox" checked data-id="${ev["AppsFlyer ID"]}" /></td>
            <td class="font-mono">${ev["Event Time"]}</td>
            <td>${ev["Event Name"]}</td>
            <td class="truncate">${(ev["Event Value"]||"").slice(0,60)}</td>
          </tr>
        `;
      });
      detailsBody.innerHTML += `
        <tr class="font-semibold bg-gray-50">
          <td></td><td class="text-right">Totales</td><td></td>
          <td class="text-center">${categoryEvents[label].length}</td>
        </tr>
      `;
    }
    tableSection.classList.remove("hidden");
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