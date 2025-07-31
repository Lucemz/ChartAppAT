// ========= bundle.js =========
// Combina csvloader.js, metrics.js y main.js en un solo archivo auto‑ejecutable
// para que funcione aunque abras la página con file://
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
    const errUsers = new Map(), okUsers = new Map();
    rows.forEach((r) => {
      const id = r["Customer User ID"]?.trim() || r["AppsFlyer ID"]?.trim() || null;
      if (!id) return;
      const eventName = (r["Event Name"] || "").toLowerCase();
      const eventValue = (r["Event Value"] || "").toLowerCase();
      const time = new Date(r["Event Time"]);
      if (eventName === "ud_error" && eventValue.includes('"ud_flow":"login"')) {
        if (!errUsers.has(id)) errUsers.set(id, []); errUsers.get(id).push(time);
      }
      if (eventName === "af_login") {
        if (!okUsers.has(id)) okUsers.set(id, []); okUsers.get(id).push(time);
      }
    });

    const onlySuccess = [], onlyError = [], errorThenSuccess = [];
    const countsSuccess = {}, countsError = {}, countsErrThenOk = {};
    const all = new Set([...errUsers.keys(), ...okUsers.keys()]);

    all.forEach((id) => {
      const errs = errUsers.get(id) || [];
      const oks  = okUsers.get(id) || [];
      if (errs.length && oks.length) {
        const firstErr = Math.min(...errs.map((d) => d.getTime()));
        const firstOk  = Math.min(...oks.map((d)  => d.getTime()));
        if (firstOk > firstErr) {
          errorThenSuccess.push(id);
          countsErrThenOk[id] = errs.length + oks.length;
        } else { onlySuccess.push(id); countsSuccess[id] = oks.length; }
      } else if (oks.length) { onlySuccess.push(id); countsSuccess[id] = oks.length; }
      else if (errs.length){ onlyError.push(id); countsError[id] = errs.length; }
    });

    return {
      categoryUsers: { OK: onlySuccess, "Error→OK": errorThenSuccess, Error: onlyError },
      categoryCounts: { OK: countsSuccess, "Error→OK": countsErrThenOk, Error: countsError },
      allUsers: [...all],
    };
  };

  /* ---------- main ---------- */
  window.onerror = (...args) => console.error("Global error:", ...args);

  const fileInput    = document.getElementById("fileUpload");
  const statusMsg    = document.getElementById("statusMsg");
  const pieDiv       = document.getElementById("pieChart");
  const chartSection = document.getElementById("chartSection");
  const tableSection = document.getElementById("tableSection");
  const tableTitle   = document.getElementById("tableTitle");
  const detailsBody  = document.querySelector("#detailsTable tbody");
  const metricsSection = document.getElementById("metricsSection");

  let categoryUsers = {}, categoryCounts = {}, userVisibility = {};

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    console.log("[DEBUG] file selected:", file?.name);
    if (!file) return;
    statusMsg.textContent = "Procesando…";
    try {
      const rows = await loadCsv(file);
      console.log("[DEBUG] rows parsed:", rows.length);
      statusMsg.textContent = `CSV cargado: ${rows.length} filas.`;

      const { categoryUsers: cu, categoryCounts: cc, allUsers } = classifyLogin(rows);
      categoryUsers = cu; categoryCounts = cc;
      userVisibility = Object.fromEntries(allUsers.map((u) => [u, true]));
      console.log("[DEBUG] categoryCounts:", categoryCounts);

      const stats = computeEventStats(rows);
      updateMetrics(stats, {
        totalUsers: allUsers.length,
        onlySuccess: categoryUsers["OK"].length,
        onlyError: categoryUsers["Error"].length,
        both: categoryUsers["Error→OK"].length,
      });

      drawPie();
    } catch (err) {
      statusMsg.textContent = `Error: ${err.message}`;
      console.error(err);
    }
  });

  const visibleCounts = () => {
    const counts = ["OK","Error→OK","Error"].map(
      (lbl)=>categoryUsers[lbl].filter((u)=>userVisibility[u]).length
    );
    console.log("[DEBUG] visibleCounts:", counts); return counts;
  };

  function drawPie() {
    const labels = ["OK","Error→OK","Error"];
    try {
      Plotly.newPlot(
        pieDiv,
        [{ type:"pie", labels, values: visibleCounts(),
           hoverinfo:"label+percent+value", textinfo:"percent", }],
        { title:"Usuarios únicos – Login", height:400,
          margin:{t:60,b:20,l:0,r:0}}, { responsive:true });
    } catch (plotErr){ console.error("[DEBUG] Plotly error:",plotErr); }

    chartSection.classList.remove("hidden");
    tableSection.classList.add("hidden");

    pieDiv.on("plotly_click",(ev)=>{
      const label = labels[ev.points[0].pointNumber];
      showTable(label);
    });
  }

  function showTable(label){
    tableTitle.textContent = `Detalle – ${label}`; detailsBody.innerHTML="";
    categoryUsers[label].forEach((id)=>{
      const visible = userVisibility[id];
      const nEv = categoryCounts[label][id] || 1;
      const tr = document.createElement("tr");
      if(!visible) tr.classList.add("line-through","text-gray-400");
      tr.innerHTML = `
        <td class="px-2 py-1 text-center">
          <input type="checkbox" class="h-4 w-4"
                 ${visible?"checked":""} data-id="${id}" />
        </td>
        <td class="px-4 py-1 font-mono">${id}</td>
        <td class="px-4 py-1 text-center">${nEv}</td>
      `;
      detailsBody.appendChild(tr);
    });
    tableSection.classList.remove("hidden");
    detailsBody.querySelectorAll("input[type='checkbox']").forEach((cb)=>
      cb.addEventListener("change",(e)=>{
        const id=e.target.dataset.id;
        userVisibility[id]=e.target.checked;
        const row=e.target.closest("tr");
        row.classList.toggle("line-through",!e.target.checked);
        row.classList.toggle("text-gray-400",!e.target.checked);
        Plotly.restyle(pieDiv,{ values:[visibleCounts()] });
      })
    );
  }

  function computeEventStats(rows){
    let total=rows.length, ok=0, err=0;
    rows.forEach((r)=>{
      const name=(r["Event Name"]||"").toLowerCase();
      const val =(r["Event Value"]||"").toLowerCase();
      if(name==="af_login") ok++;
      if(name==="ud_error"&&val.includes('"ud_flow":"login"')) err++;
    });
    return { total, ok, err };
  }

  function updateMetrics(eventStats,userStats){
    document.getElementById("m-totalEvents").textContent = eventStats.total;
    document.getElementById("m-eventsOk").textContent    = eventStats.ok;
    document.getElementById("m-eventsErr").textContent   = eventStats.err;
    document.getElementById("m-totalUsers").textContent  = userStats.totalUsers;
    document.getElementById("m-onlySuccess").textContent = userStats.onlySuccess;
    document.getElementById("m-onlyError").textContent   = userStats.onlyError;
    document.getElementById("m-both").textContent        = userStats.both;
    metricsSection.classList.remove("hidden");
  }
})();