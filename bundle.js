// ========= bundle.js =========
// Combina csvloader.js, metrics.js y main.js en un solo archivo auto-ejecutable
// para que funcione incluso abriendo index.html con file://
//
// No usa import/export ni type="module".

(() => {
  /* ---------- csvLoader ---------- */
  const loadCsv = (file) =>
    new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No se recibió archivo")); return;
      }
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
    const errUsers = new Map(),
      okUsers = new Map();

    rows.forEach((r) => {
      const id = r["AppsFlyer ID"]?.trim() || null; // contamos usuarios por AppsFlyer ID
      if (!id) return;

      const eventName = (r["Event Name"] || "").toLowerCase();
      const eventValue = (r["Event Value"] || "").toLowerCase();
      const time = new Date(r["Event Time"]);

      if (
        eventName === "ud_error" &&
        eventValue.includes('"ud_flow":"login"')
      ) {
        if (!errUsers.has(id)) errUsers.set(id, []);
        errUsers.get(id).push(time);
      }

      if (eventName === "af_login") {
        if (!okUsers.has(id)) okUsers.set(id, []);
        okUsers.get(id).push(time);
      }
    });

    const onlySuccess = [],
      onlyError = [],
      errorThenSuccess = [];
    const countsSuccess = {};
    const countsError   = {};
    const countsErrThenOk = {};
    const all = new Set([...errUsers.keys(), ...okUsers.keys()]);

    all.forEach((id) => {
      const errs = errUsers.get(id) || [];
      const oks = okUsers.get(id) || [];
      if (oks.length > 0 && errs.length === 0) {
        // Sólo éxito: tuvo logins pero nunca errores
        onlySuccess.push(id);
        countsSuccess[id] = oks.length;
      } else if (errs.length > 0 && oks.length === 0) {
        // Sólo error: tuvo errores pero nunca logins
        onlyError.push(id);
        countsError[id] = errs.length;
      } else if (errs.length > 0 && oks.length > 0) {
        // Error→OK: tuvo ambos, sin importar orden
        errorThenSuccess.push(id);
        countsErrThenOk[id] = errs.length + oks.length;
      }
    });

    // ---- eventos por categoría (filtrados) ----
    const categoryEvents = { OK: [], "Error→OK": [], Error: [] };
    const userCategory = {};
    onlySuccess.forEach((u) => (userCategory[u] = "OK"));
    onlyError.forEach((u) => (userCategory[u] = "Error"));
    errorThenSuccess.forEach((u) => (userCategory[u] = "Error→OK"));

    rows.forEach((r) => {
      const id = r["AppsFlyer ID"]?.trim() || null; // contamos usuarios por AppsFlyer ID
      if (!id) return;
      const cat = userCategory[id];
      if (!cat) return;

      const name = (r["Event Name"] || "").toLowerCase();
      const val = (r["Event Value"] || "").toLowerCase();

      // Para la categoría elegida, incluimos SOLO el tipo de evento relevante
      if (cat === "OK" && name === "af_login") categoryEvents.OK.push(r);

      // Solo-error → ud_error
      if (cat === "Error" && name === "ud_error" && val.includes('"ud_flow":"login"'))
        categoryEvents.Error.push(r);

      // Error→OK: queremos los errores y logins para usuarios mixtos
      if (cat === "Error→OK") {
        // incluir errores y logins para usuarios mixtos
        if (name === "ud_error" && val.includes('"ud_flow":"login"')) {
          categoryEvents["Error→OK"].push(r);
        }
        if (name === "af_login") {
          categoryEvents["Error→OK"].push(r);
        }
      }
    });

    // ---- conteos por usuario y categoría ----
    const categoryCounts = {
      OK: {},
      Error: {},
      "Error→OK": {},
    };

    categoryEvents.OK.forEach((ev) => {
      const uid = ev["AppsFlyer ID"];
      categoryCounts.OK[uid] = (categoryCounts.OK[uid] || 0) + 1;
    });
    categoryEvents.Error.forEach((ev) => {
      const uid = ev["AppsFlyer ID"];
      categoryCounts.Error[uid] = (categoryCounts.Error[uid] || 0) + 1;
    });
    categoryEvents["Error→OK"].forEach((ev) => {
      const uid = ev["AppsFlyer ID"];
      categoryCounts["Error→OK"][uid] =
        (categoryCounts["Error→OK"][uid] || 0) + 1;
    });

    return {
      categoryUsers: {
        OK: onlySuccess,
        "Error→OK": errorThenSuccess,
        Error: onlyError,
      },
      categoryCounts,
      categoryEvents,
      allUsers: [...all],
    };
  };

  /* ---------- main ---------- */
  window.onerror = (...args) => console.error("Global error:", ...args);

  const fileInput = document.getElementById("fileUpload");
  const statusMsg = document.getElementById("statusMsg");
  const pieDiv = document.getElementById("pieChart");
  const chartSection = document.getElementById("chartSection");
  const tableSection = document.getElementById("tableSection");
  const tableTitle = document.getElementById("tableTitle");
  const detailsBody = document.querySelector("#detailsTable tbody");
  const metricsSection = document.getElementById("metricsSection");

  const modeSelect = document.getElementById("modeSelect");
  let mode = "users"; // 'users' | 'events'
  modeSelect.addEventListener("change", (e) => {
    mode = e.target.value;
    drawPie();
  });

  let categoryUsers = {},
    categoryCounts = {},
    categoryEvents = {},
    userVisibility = {};

  /* ---- carga CSV ---- */
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    console.log("[DEBUG] file selected:", file?.name);
    if (!file) return;

    statusMsg.textContent = "Procesando…";
    try {
      const rows = await loadCsv(file);
      console.log("[DEBUG] rows parsed:", rows.length);
      statusMsg.textContent = `CSV cargado: ${rows.length} filas.`;

      const result = classifyLogin(rows);

      categoryUsers = result.categoryUsers;
      categoryCounts = result.categoryCounts;
      categoryEvents = result.categoryEvents;

      userVisibility = Object.fromEntries(
        result.allUsers.map((u) => [u, true])
      );
      console.log("[DEBUG] categoryCounts:", categoryCounts);

      const stats = computeEventStats(rows);
      updateMetrics(stats, {
        onlySuccess: categoryUsers.OK.length,
        onlyError:   categoryUsers.Error.length,
        both:        categoryUsers["Error→OK"].length
      });

      drawPie();
    } catch (err) {
      statusMsg.textContent = `Error: ${err.message}`;
      console.error(err);
    }
  });

  /* ---- helpers ---- */
  const visibleCounts = () => {
    if (mode === "users") {
      return ["OK", "Error→OK", "Error"].map(
        (lbl) =>
          categoryUsers[lbl].filter((u) => userVisibility[u]).length
      );
    }
    // eventos
    return ["OK", "Error→OK", "Error"].map(
      (lbl) =>
        categoryEvents[lbl].filter((ev) => {
          const id = ev["AppsFlyer ID"];
          return userVisibility[id];
        }).length
    );
  };

  function drawPie() {
    const labels = ["OK", "Error→OK", "Error"];
    try {
      Plotly.newPlot(
        pieDiv,
        [
          {
            type: "pie",
            labels,
            values: visibleCounts(),
            hoverinfo: "label+percent+value",
            textinfo: "percent",
          },
        ],
        {
          title: "Usuarios únicos – Login",
          height: 400,
          margin: { t: 60, b: 20, l: 0, r: 0 },
        },
        { responsive: true }
      );
    } catch (plotErr) {
      console.error("[DEBUG] Plotly error:", plotErr);
    }

    chartSection.classList.remove("hidden");
    tableSection.classList.add("hidden");

    pieDiv.on("plotly_click", (ev) => {
      const label = labels[ev.points[0].pointNumber];
      showTable(label);
    });
  }

  function showTable(label) {
    if (mode === "users") {
      // ---- tabla agregada por Event Value ----
      tableTitle.textContent = `Detalle – ${label} (usuarios únicos)`;
      detailsBody.innerHTML = "";
      // actualizar cabecera
      document.querySelector("#detailsTable thead tr").innerHTML = `
        <th class="w-12 px-2 py-1 text-center font-medium text-gray-700">✓</th>
        <th class="px-4 py-1 text-left font-medium text-gray-700">Event Value</th>
        <th class="px-4 py-1 text-center font-medium text-gray-700">User&nbsp;count</th>
        <th class="px-4 py-1 text-center font-medium text-gray-700">Event&nbsp;count</th>
      `;

      // agrupamos
      const mapEV = new Map(); // evValue => { users:Set, events:number }
      categoryEvents[label].forEach((ev) => {
        const evValRaw = (ev["Event Value"] || "");
        // Para OK normalmente es '{}' → lo tomamos textual
        const evVal =
          evValRaw.trim() === "{}" || evValRaw.trim() === ""
            ? "(vacío)"
            : evValRaw.trim();
        const id = ev["AppsFlyer ID"];
        if (!mapEV.has(evVal)) mapEV.set(evVal, { users: new Set(), events: 0 });
        const obj = mapEV.get(evVal);
        obj.users.add(id);
        obj.events++;
      });

      // ordenar por event count desc
      const rows = [...mapEV.entries()].sort((a,b)=> b[1].users.size - a[1].users.size);

      rows.forEach(([evVal, obj]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-2 py-1 text-center">
            <input type="checkbox" class="h-4 w-4" checked data-ev="${evVal}" />
          </td>
          <td class="px-4 py-1">${evVal}</td>
          <td class="px-4 py-1 text-center">${obj.users.size}</td>
          <td class="px-4 py-1 text-center">${obj.events}</td>
        `;
        detailsBody.appendChild(tr);
      });

      // --- fila totales ---
      const totalUsers = rows.reduce((s, [, obj]) => s + obj.users.size, 0);
      const totalEvents = rows.reduce((s, [, obj]) => s + obj.events, 0);
      const totalTr = document.createElement("tr");
      totalTr.classList.add("font-semibold", "bg-gray-50");
      totalTr.innerHTML = `
        <td></td>
        <td class="px-4 py-1 text-right">Totales</td>
        <td class="px-4 py-1 text-center">${totalUsers}</td>
        <td class="px-4 py-1 text-center">${totalEvents}</td>
      `;
      detailsBody.appendChild(totalTr);

      tableSection.classList.remove("hidden");

      // checkbox handler → afecta userVisibility
      detailsBody.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.addEventListener("change", (e) => {
          const evVal = e.target.dataset.ev;
          const affectedUsers = mapEV.get(evVal).users;
          affectedUsers.forEach((uid) => {
            userVisibility[uid] = e.target.checked;
          });
          Plotly.restyle(pieDiv, { values: [visibleCounts()] });
        });
      });
      return;
    }
    // ---- tabla de eventos ----
    detailsBody.innerHTML = "";
    categoryEvents[label].forEach((ev) => {
      const ts  = ev["Event Time"];
      const en  = ev["Event Name"];
      const val = (ev["Event Value"]||"").slice(0,60);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-2 py-1 text-center">
          <input type="checkbox" class="h-4 w-4" checked data-id="${ev["AppsFlyer ID"]}" />
        </td>
        <td class="px-4 py-1 font-mono">${ts}</td>
        <td class="px-4 py-1">${en}</td>
        <td class="px-4 py-1 truncate">${val}</td>
      `;
      detailsBody.appendChild(tr);
    });
    // totales para eventos tabla simple
    const footerTr = document.createElement("tr");
    footerTr.classList.add("font-semibold", "bg-gray-50");
    footerTr.innerHTML = `
      <td></td>
      <td class="px-4 py-1 text-right">Totales</td>
      <td></td>
      <td class="px-4 py-1 text-center">${categoryEvents[label].length}</td>
    `;
    detailsBody.appendChild(footerTr);

    tableSection.classList.remove("hidden");
  }

  function computeEventStats(rows) {
    let total = 0,
      ok = 0,
      err = 0;
    rows.forEach((r)=>{
      const name=(r["Event Name"]||"").toLowerCase();
      const val =(r["Event Value"]||"").toLowerCase();
      if(name==="af_login"){ ok++; total++; }
      if(name==="ud_error" && val.includes('"ud_flow":"login"')){ err++; total++; }
    });
    return { total, ok, err };
  }

  function updateMetrics(eventStats, userStats) {
    document.getElementById("m-totalEvents").textContent =
      eventStats.total;
    document.getElementById("m-eventsOk").textContent =
      eventStats.ok;
    document.getElementById("m-eventsErr").textContent =
      eventStats.err;

    const successTotal = userStats.onlySuccess + userStats.both;
    const totalAll     = successTotal + userStats.onlyError;

    document.getElementById("m-totalAll").textContent    = totalAll;
    document.getElementById("m-successTotal").textContent = successTotal;
    document.getElementById("m-onlySuccess").textContent  = userStats.onlySuccess;
    document.getElementById("m-both").textContent         = userStats.both;
    document.getElementById("m-onlyError").textContent    = userStats.onlyError;

    metricsSection.classList.remove("hidden");
  }
})();