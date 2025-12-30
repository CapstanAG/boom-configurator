// ===== BOOM CONFIG SCHEMA v1 (LOCKED) =====
const BOOM_SCHEMA_VERSION = 1;

// Central factory for a new, empty config
function createEmptyBoomConfig(overrides = {}) {
  const nowIso = new Date().toISOString();

  const base = {
    schemaVersion: BOOM_SCHEMA_VERSION,

    machine: {
      id: "",
      label: "",
      oem: "",
      model: "",
      boomWidthFt: 0,
      nozzleSpacingIn: 0,
      ...(overrides.machine || {})
    },

    platformDocBundles: [],   // array of { id, label, platform, docs: DocItem[] }
    boomSpecificDocs: [],     // array of DocItem

    installSteps: {           // container for generated instructions
      version: 1,
      generatedAt: null,
      contentHtml: "",
      source: "auto"
    },

    metadata: {
      configId: "",
      name: "",
      scope: "user",          // factory | user | oem
      status: "draft",        // draft | submitted | approved | rejected
      docsVersion: "",
      installStepsVersion: "",
      createdBy: "local",
      createdAt: nowIso,
      updatedAt: nowIso,
      notes: "",
      ...(overrides.metadata || {})
    }
  };

  // Shallow merge top-level overrides last
  return {
    ...base,
    ...overrides,
    machine: { ...base.machine, ...(overrides.machine || {}) },
    metadata: { ...base.metadata, ...(overrides.metadata || {}) }
  };
}



// === Debug overlay removed for production ===
(function(){
  // No-op debug helpers (overlay disabled)
  window.DBG  = function(){ /* noop */ };
  window.DERR = function(err, ctx){
    try { console.error('[ERR]', ctx || '', err); } catch {}
  };
  // No overlay UI or F9 toggle
  window.addEventListener('error', function(e){
    try { console.error('[ERROR]', e.message || e.error || e); } catch {}
  });
  window.addEventListener('unhandledrejection', function(e){
    try { console.error('[UNHANDLED]', e.reason || e); } catch {}
  });
})();

// --- 1. Docs Registry (local JS stand-in for docsRegistry.json) ---

const DOCS_REGISTRY = {
  bundles: [
    {
      id: "PP3-ET-LSeries-Core-Docs",
      scope: "BUNDLE",
      platform: "PP3",
      make: "Equipment Technologies",
      model: "L-Series",
      yearLabel: "2019–2023",
      title: "PP3 on ET L-Series – Core Docs",
      docs: [
        {
          id: "PP3-ET-L-PartsPinouts",
          type: "Parts & Pinouts",
          title: "Parts / Pinouts Document",
          url: "https://example.com/pp3-et-l/parts-pinouts",
          yearLabel: "2019–2023",
          notes: ""
        },
        {
          id: "PP3-ET-L-BeginnerSetup",
          type: "Beginner Setup Guide",
          title: "Beginner Setup Guide",
          url: "https://example.com/pp3-et-l/beginner-setup",
          yearLabel: "All years",
          notes: ""
        },
        {
          id: "PP3-ET-L-ExpertChecklist",
          type: "Expert Setup Checklist",
          title: "Expert Setup Checklist",
          url: "https://example.com/pp3-et-l/expert-checklist",
          yearLabel: "",
          notes: ""
        },
        {
          id: "PP3-ET-L-PreDelivery",
          type: "Pre-Delivery Checklist",
          title: "Pre-Delivery Checklist",
          url: "https://example.com/pp3-et-l/pre-delivery",
          yearLabel: "",
          notes: ""
        },
        {
          id: "PP3-ET-L-SoftwareRev",
          type: "Software Revision",
          title: "Current Software Revision",
          url: "https://example.com/pp3-et-l/software-revision",
          yearLabel: "2021+ only",
          revision: "v3.12.7",
          notes: "Verify controller shows v3.12.7 or higher."
        },
        {
          id: "PP3-ET-L-MonitorSetup-Long",
          type: "Monitor Setup",
          title: "Monitor Setup – Full Guide",
          url: "https://example.com/pp3-et-l/monitor-setup",
          yearLabel: "",
          notes: "Use with the short how-to videos.",
          videos: [
            { title: "Video 1 – Basic Setup", url: "https://example.com/videos/monitor-setup-1" },
            { title: "Video 2 – Sections", url: "https://example.com/videos/monitor-setup-2" },
            { title: "Video 3 – Advanced Features", url: "https://example.com/videos/monitor-setup-3" }
          ]
        }
      ]
    }
  ]
};

// --- 2. Demo boom config object (this will later come from your real config loader) ---

let currentConfig = loadCurrentConfigFromStorage() || createEmptyBoomConfig();

let editingBoomDocIndex = null;  // already added earlier

// Normalize any raw object into a valid BoomConfig matching schema v1
function normalizeConfig(raw) {
  if (!raw || typeof raw !== "object") {
    return createEmptyBoomConfig();
  }

  // If old configs didn't have schemaVersion, stamp it now
  if (!raw.schemaVersion) {
    raw.schemaVersion = BOOM_SCHEMA_VERSION;
  }

  // Pass raw into the factory so it fills any missing fields/arrays
  return createEmptyBoomConfig(raw);
}

// Prepare config for saving (localStorage, download, etc.)
function getConfigForSave() {
  const nowIso = new Date().toISOString();

  return {
    ...currentConfig,
    schemaVersion: BOOM_SCHEMA_VERSION,
    metadata: {
      ...currentConfig.metadata,
      updatedAt: nowIso
    }
  };
}
const LS_CURRENT = 'boomcfg.currentConfig.v1';

function loadCurrentConfigFromStorage() {
  try {
    const raw = localStorage.getItem(LS_CURRENT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeConfig(parsed);
  } catch (e) {
    console.error('loadCurrentConfigFromStorage', e);
    return null;
  }
}

function saveCurrentConfigToStorage() {
  try {
    const pack = getConfigForSave();
    localStorage.setItem(LS_CURRENT, JSON.stringify(pack));
  } catch (e) {
    console.error('saveCurrentConfigToStorage', e);
  }
}



function ensureDocsFieldsOnConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return cfg;

  // machine info (may be partially filled from save metadata later)
  if (!cfg.machine) {
    cfg.machine = {
      platform: "",
      make: "",
      model: "",
      boomType: "",
      width: null,
      widthUnit: "ft",
      spacingIn: null
    };
  } else {
    cfg.machine.platform   = cfg.machine.platform   || "";
    cfg.machine.make       = cfg.machine.make       || "";
    cfg.machine.model      = cfg.machine.model      || "";
    cfg.machine.boomType   = cfg.machine.boomType   || "";
    cfg.machine.width      = cfg.machine.width      ?? null;
    cfg.machine.widthUnit  = cfg.machine.widthUnit  || "ft";
    cfg.machine.spacingIn  = cfg.machine.spacingIn  ?? null;
  }

  // shared bundles and boom-specific docs
  if (!Array.isArray(cfg.platformDocBundles)) {
    cfg.platformDocBundles = [];
  }
  if (!Array.isArray(cfg.boomSpecificDocs)) {
    cfg.boomSpecificDocs = [];
  }

  // install steps container
  if (!cfg.installSteps || typeof cfg.installSteps !== "object") {
    cfg.installSteps = {
      version: 1,
      generatedAt: null,
      contentHtml: "",
      source: "auto"
    };
  }

  // metadata extension
  if (!cfg.metadata) {
    cfg.metadata = {
      scope: "MY_CONFIG",
      status: "DRAFT",
      createdBy: "",
      createdAt: null,
      approvedBy: null,
      approvedAt: null,
      docsVersion: 1
    };
  } else {
    cfg.metadata.scope       = cfg.metadata.scope       || "MY_CONFIG";
    cfg.metadata.status      = cfg.metadata.status      || "DRAFT";
    cfg.metadata.docsVersion = cfg.metadata.docsVersion || 1;
  }

  return cfg;
}

// Global hook for future real integration (boom.js can call this later)
window.setDocsConfig = function (configObj) {
  const cfg = ensureDocsFieldsOnConfig(configObj || null);
  currentConfig = cfg;
  editingBoomDocIndex = null;

  // Factory lock detection:
  //  - from browse list (_src === 'factory')
  //  - or from metadata.scope if you later tag presets as FACTORY / FACTORY_PRESET
  window.__currentIsFactory =
    !!cfg &&
    (
      cfg._src === 'factory' ||
      (cfg.metadata && (cfg.metadata.scope === 'FACTORY' || cfg.metadata.scope === 'FACTORY_PRESET'))
    );

  renderRelatedDocsPanel();
  renderInstallPanelFromConfig();
  applyFactoryLocking();
};
function applyFactoryLocking() {
  const isFactory = !!window.__currentIsFactory;

  // Disable all boom-builder inputs for factory presets
  const builder = document.getElementById('builderPanel');
  if (builder) {
    builder.querySelectorAll('input, select, textarea, button').forEach(el => {
      el.disabled = isFactory;
    });
  }

  // Disable all VCM inputs for factory presets (these are generated inside vcmFields)
  const vcmFields = document.getElementById('vcmFields');
  if (vcmFields) {
    vcmFields.querySelectorAll('input, select, textarea, button').forEach(el => {
      el.disabled = isFactory;
    });
  }
// Lock Documentation panels for factory presets
const relatedDocsPanel = document.getElementById('relatedDocsPanel');
if (relatedDocsPanel) {
  relatedDocsPanel.querySelectorAll('input, select, textarea, button').forEach(el => {
    el.disabled = isFactory;
  });
}
const installPanel = document.getElementById('installPanel');
if (installPanel) {
  installPanel.querySelectorAll('input, select, textarea, button').forEach(el => {
    el.disabled = isFactory;
  });
}


  // Main Save button: factory presets must NOT overwrite; treat as Save As
  const btnSave = document.getElementById('btnSave');
  if (btnSave) {
    if (isFactory) {
      btnSave.textContent = 'Save As';
      btnSave.dataset.factorySaveAs = '1';
    } else {
      btnSave.textContent = 'Save';
      delete btnSave.dataset.factorySaveAs;
    }
  }

  // Save modal: disable overwrite button, keep Create New enabled
  const btnMetaSave = document.getElementById('btnMetaSave');
  if (btnMetaSave) btnMetaSave.disabled = isFactory;
// Lock hub mode selectors (main UI + save modal)
const hubModeSel = document.getElementById('hubMode');
if (hubModeSel) hubModeSel.disabled = isFactory;

const metaHub = document.getElementById('metaHubMode');
if (metaHub) metaHub.disabled = isFactory;

  // Optional CSS hook
  document.body.classList.toggle('is-factory', isFactory);
}



// Attach docs + machine info to a serialized config object before saving
function attachDocsToConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return cfg;

  // 1) Map meta → machine for docs filtering
  const m = cfg.meta || {};
  cfg.machine = {
    platform: "", // (optional in future – PP3/PP2/etc)
    make: m.make || "",
    model: m.model || "",
    boomType: m.boomType || "",
    width: m.width ?? null,
    widthUnit: m.widthUnit || "ft",
    spacingIn: m.nozzleSpacing ?? null
  };

  // 2) Pull docs state from currentConfig if it exists
  let docCfg = currentConfig ? ensureDocsFieldsOnConfig(currentConfig) : null;
  if (!docCfg) {
    // ensure at least empty containers
    docCfg = ensureDocsFieldsOnConfig({});
  }

  cfg.platformDocBundles = Array.isArray(docCfg.platformDocBundles)
    ? docCfg.platformDocBundles.slice()
    : [];

  cfg.boomSpecificDocs = Array.isArray(docCfg.boomSpecificDocs)
    ? docCfg.boomSpecificDocs.map(d => ({ ...d }))
    : [];

  cfg.installSteps = docCfg.installSteps
    ? { ...docCfg.installSteps }
    : {
        version: 1,
        generatedAt: null,
        contentHtml: "",
        source: "auto"
      };

  // 3) Ensure docsVersion tag in metadata
  if (!cfg.metadata) cfg.metadata = {};
  if (!cfg.metadata.docsVersion) cfg.metadata.docsVersion = 1;

  return cfg;
}



const DEMO_CONFIG = {
  id: "ET-L-120ft-20in-PP3",
  name: "ET L-Series 120' 20\" PP3 Boom",
  machine: {
    platform: "PP3",
    make: "Equipment Technologies",
    model: "L-Series"
    // Year intentionally NOT stored here
  },
  platformDocBundles: [
    "PP3-ET-LSeries-Core-Docs"
  ],
  boomSpecificDocs: [
    {
      id: "boom-note-001",
      type: "Install Note",
      title: "Special note for 132' custom demo boom",
      url: "",
      notes: "Demo note: this would be unique to this boom build."
    }
  ]
  // ...all your existing boom + VCM + parts fields live alongside these...
};

// --- 3. Utility: get bundle by ID ---

function getDocBundleById(bundleId) {
  if (!DOCS_REGISTRY || !Array.isArray(DOCS_REGISTRY.bundles)) return null;
  return DOCS_REGISTRY.bundles.find(b => b.id === bundleId) || null;
}
// --- Platform doc bundles selector helpers ---

function getRelevantBundlesForConfig(cfg) {
  if (!DOCS_REGISTRY || !Array.isArray(DOCS_REGISTRY.bundles)) return [];
  if (!cfg || !cfg.machine) {
    // If no config, just show all bundles (demo mode)
    return DOCS_REGISTRY.bundles.slice();
  }

  const { platform, make, model } = cfg.machine;

  return DOCS_REGISTRY.bundles.filter(b => {
    if (b.platform && platform && b.platform !== platform) return false;
    if (b.make && make && b.make !== make) return false;
    if (b.model && model && b.model !== model) return false;
    return true;
  });
}

function renderBundleSelector() {
  const wrap = document.getElementById("platformBundleSelector");
  if (!wrap) return;

  wrap.innerHTML = "";

  if (!currentConfig) {
    wrap.textContent = "Load a configuration to select platform doc bundles.";
    return;
  }

  const bundles = getRelevantBundlesForConfig(currentConfig);
  if (!bundles.length) {
    wrap.textContent = "No platform bundles available for this make/model.";
    return;
  }

  const selectedIds = Array.isArray(currentConfig.platformDocBundles)
    ? currentConfig.platformDocBundles
    : [];

  const list = document.createElement("div");
  list.className = "bundle-selector-list";

  bundles.forEach(b => {
    const row = document.createElement("label");
    row.className = "bundle-row";

    const isChecked = selectedIds.includes(b.id);

    row.innerHTML = `
      <input
        type="checkbox"
        class="bundle-checkbox"
        data-bundle-id="${b.id}"
        ${isChecked ? "checked" : ""}
      >
      <span class="bundle-title">${b.title || b.id}</span>
      <span class="bundle-meta">
        ${[b.platform, b.make, b.model].filter(Boolean).join(" • ")}
        ${b.yearLabel ? " • " + b.yearLabel : ""}
      </span>
    `;

    list.appendChild(row);
  });

  wrap.appendChild(list);

  const checkboxes = wrap.querySelectorAll(".bundle-checkbox");
  checkboxes.forEach(cb => {
cb.addEventListener('change', ()=> {
  if (!currentConfig) return;

  if (!Array.isArray(currentConfig.platformDocBundles)) {
    currentConfig.platformDocBundles = [];
  }

  const set = new Set(currentConfig.platformDocBundles);
  if (cb.checked) set.add(b.id);
  else set.delete(b.id);

  currentConfig.platformDocBundles = Array.from(set);

  renderRelatedDocsPanel(); // re-render docs list based on new selection
});


  });
}


// --- Helpers for boom-specific docs ---

function ensureBoomDocsArray() {
  if (!currentConfig) return [];
  if (!Array.isArray(currentConfig.boomSpecificDocs)) {
    currentConfig.boomSpecificDocs = [];
  }
  return currentConfig.boomSpecificDocs;
}
function normalizeDocUrl(raw) {
  const url = (raw || "").trim();
  if (!url) return "";
  // If it already has http/https, leave it alone
  if (/^https?:\/\//i.test(url)) return url;
  // Otherwise assume https
  return "https://" + url;
}

function deleteBoomDoc(idx) {
  const docs = ensureBoomDocsArray();
  if (idx < 0 || idx >= docs.length) return;
  docs.splice(idx, 1);
  renderRelatedDocsPanel();
}

function handleAddBoomDoc() {
  if (!currentConfig) {
    alert("No configuration loaded. Load or select a config first.");
    return;
  }


  const typeEl = document.getElementById("boomDocType");
  const titleEl = document.getElementById("boomDocTitle");
  const urlEl = document.getElementById("boomDocUrl");
  const notesEl = document.getElementById("boomDocNotes");

  if (!titleEl || !titleEl.value.trim()) {
    alert("Title is required for a boom-specific document.");
    return;
  }

  const docs = ensureBoomDocsArray();
  docs.push({
    id: "boom-doc-" + Date.now(),
    type: typeEl ? typeEl.value.trim() : "",
    title: titleEl.value.trim(),
    url: normalizeDocUrl(urlEl ? urlEl.value : ""),
    notes: notesEl ? notesEl.value.trim() : ""
  });

  // Clear inputs
  if (typeEl) typeEl.value = "";
  if (titleEl) titleEl.value = "";
  if (urlEl) urlEl.value = "";
  if (notesEl) notesEl.value = "";

  renderRelatedDocsPanel();
}


// --- 4. Render Related Docs panel ---

function renderRelatedDocsPanel() {
  const panel = document.getElementById("relatedDocsPanel");
  const status = document.getElementById("docsDemoStatus");
  if (!panel) return;

  if (!currentConfig) {
    // Nothing loaded yet
    status && (status.textContent = "No config loaded.");
    document.getElementById("platformDocsEmpty").style.display = "block";
    document.getElementById("platformDocsTable").style.display = "none";
    document.getElementById("boomDocsEmpty").style.display = "block";
    document.getElementById("boomDocsTable").style.display = "none";
    return;
  }

  status && (status.textContent = `Loaded: ${currentConfig.name}`);
  
  // NEW: update bundle selector based on currentConfig
  renderBundleSelector();

  // PLATFORM DOCS
  const platformDocsBody = document.getElementById("platformDocsBody");
  const platformEmpty = document.getElementById("platformDocsEmpty");
  const platformTable = document.getElementById("platformDocsTable");

  platformDocsBody.innerHTML = "";

  const bundleIds = Array.isArray(currentConfig.platformDocBundles)
    ? currentConfig.platformDocBundles
    : [];

  let platformDocs = [];

  bundleIds.forEach(id => {
    const bundle = getDocBundleById(id);
    if (bundle && Array.isArray(bundle.docs)) {
      platformDocs = platformDocs.concat(
        bundle.docs.map(doc => ({
          bundleTitle: bundle.title,
          platform: bundle.platform,
          make: bundle.make,
          model: bundle.model,
          yearLabel: doc.yearLabel || bundle.yearLabel || "",
          ...doc
        }))
      );
    }
  });

  if (!platformDocs.length) {
    platformEmpty.style.display = "block";
    platformTable.style.display = "none";
  } else {
    platformEmpty.style.display = "none";
    platformTable.style.display = "table";

    platformDocs.forEach(doc => {
      const tr = document.createElement("tr");
      platformDocsBody.appendChild(tr);
    });
  }

  // BOOM-SPECIFIC DOCS
  const boomDocsBody = document.getElementById("boomDocsBody");
  const boomEmpty = document.getElementById("boomDocsEmpty");
  const boomTable = document.getElementById("boomDocsTable");

  boomDocsBody.innerHTML = "";

  const boomDocs = Array.isArray(currentConfig.boomSpecificDocs)
    ? currentConfig.boomSpecificDocs
    : [];

  if (!boomDocs.length) {
    boomEmpty.style.display = "block";
    boomTable.style.display = "none";
  } else {
    boomEmpty.style.display = "none";
    boomTable.style.display = "table";

    boomDocs.forEach((doc, idx) => {
      const isEditing = editingBoomDocIndex === idx;
      const tr = document.createElement("tr");

      if (!isEditing) {
// VIEW MODE (NOT EDITING)
const hasUrl = !!(doc.url && doc.url.trim());
const safeUrl = hasUrl ? doc.url : "";

const titleHtml = hasUrl
  ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${doc.title}</a>`
  : doc.title;

const urlHtml = hasUrl
  ? `<div class="boom-doc-url">${safeUrl}</div>`
  : "";

tr.innerHTML = `
  <td style="padding:4px 2px;vertical-align:top;">${doc.type || ""}</td>
  <td style="padding:4px 2px;vertical-align:top;">
    ${titleHtml}
    ${urlHtml}
  </td>
  <td style="padding:4px 2px;vertical-align:top;">${doc.notes || ""}</td>
  <td class="no-print" style="padding:4px 2px;vertical-align:top;">
    <button
      type="button"
      class="boom-docs-edit-btn"
      data-doc-idx="${idx}"
    >Edit</button>
    <button
      type="button"
      class="boom-docs-delete-btn"
      data-doc-idx="${idx}"
    >Delete</button>
  </td>
`;

      } else {
        // EDIT MODE ROW
        tr.innerHTML = `
          <td style="padding:4px 2px;vertical-align:top;">
            <input
              type="text"
              class="boom-doc-edit-type"
              value="${doc.type || ""}"
              style="width:100%;box-sizing:border-box;font-size:0.8rem;padding:2px 4px;"
              placeholder="Type"
            >
          </td>
          <td style="padding:4px 2px;vertical-align:top;">
            <input
              type="text"
              class="boom-doc-edit-title"
              value="${doc.title || ""}"
              style="width:100%;box-sizing:border-box;font-size:0.8rem;padding:2px 4px;"
              placeholder="Title*"
            >
            <input
              type="url"
              class="boom-doc-edit-url"
              value="${doc.url || ""}"
              style="width:100%;box-sizing:border-box;font-size:0.8rem;padding:2px 4px;margin-top:2px;"
              placeholder="URL (optional)"
            >
          </td>
          <td style="padding:4px 2px;vertical-align:top;">
            <input
              type="text"
              class="boom-doc-edit-notes"
              value="${doc.notes || ""}"
              style="width:100%;box-sizing:border-box;font-size:0.8rem;padding:2px 4px;"
              placeholder="Notes (optional)"
            >
          </td>
          <td class="no-print" style="padding:4px 2px;vertical-align:top;">
            <button
              type="button"
              class="boom-docs-save-edit-btn"
              data-doc-idx="${idx}"
            >Save</button>
            <button
              type="button"
              class="boom-docs-cancel-edit-btn"
              data-doc-idx="${idx}"
            >Cancel</button>
          </td>
        `;
      }

      boomDocsBody.appendChild(tr);
    });

    // Wire DELETE in view mode
    const deleteButtons = boomDocsBody.querySelectorAll(".boom-docs-delete-btn");
    deleteButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-doc-idx"));
        deleteBoomDoc(idx);
      });
    });

    // Wire EDIT in view mode
    const editButtons = boomDocsBody.querySelectorAll(".boom-docs-edit-btn");
    editButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-doc-idx"));
        editingBoomDocIndex = idx;
        renderRelatedDocsPanel();
      });
    });

    // Wire SAVE/CANCEL in edit mode
    const saveButtons = boomDocsBody.querySelectorAll(".boom-docs-save-edit-btn");
    saveButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-doc-idx"));
        const row = btn.closest("tr");
        const docs = ensureBoomDocsArray();
        if (!row || idx < 0 || idx >= docs.length) return;

        const doc = docs[idx];
        const typeInput = row.querySelector(".boom-doc-edit-type");
        const titleInput = row.querySelector(".boom-doc-edit-title");
        const urlInput = row.querySelector(".boom-doc-edit-url");
        const notesInput = row.querySelector(".boom-doc-edit-notes");

        const newTitle = titleInput ? titleInput.value.trim() : "";
        if (!newTitle) {
          alert("Title is required.");
          return;
        }

        doc.type = typeInput ? typeInput.value.trim() : "";
        doc.title = newTitle;
        doc.url = normalizeDocUrl(urlInput ? urlInput.value : "");
        doc.notes = notesInput ? notesInput.value.trim() : "";

        editingBoomDocIndex = null;
        renderRelatedDocsPanel();
      });
    });

    const cancelButtons = boomDocsBody.querySelectorAll(".boom-docs-cancel-edit-btn");
    cancelButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        editingBoomDocIndex = null;
        renderRelatedDocsPanel();
      });
    });
  }



}
function renderInstallPanelFromConfig() {
  const out = document.getElementById("installOutput");
  if (!out) return;

  if (!currentConfig || !currentConfig.installSteps || !currentConfig.installSteps.contentHtml) {
    out.innerHTML = `
      <p style="font-size:0.82rem;color:#777;">
        Click "Generate from Current Boom" to build draft install steps based on the current boom inputs.
      </p>
    `;
    return;
  }

  const ts = currentConfig.installSteps.generatedAt
    ? new Date(currentConfig.installSteps.generatedAt).toLocaleString()
    : null;

  out.innerHTML = `
    ${ts ? `<p style="font-size:0.75rem;color:#666;margin:0 0 6px;">Last generated: ${ts}</p>` : ""}
    ${currentConfig.installSteps.contentHtml}
  `;
}

// === PANEL VISIBILITY TOGGLES ===

function applyPanelVisibilityFromToggles() {
  const buildVcmChecked = document.getElementById("toggleBuildVcm")?.checked ?? true;
  const partsChecked    = document.getElementById("toggleParts")?.checked ?? true;
  const docsChecked     = document.getElementById("toggleDocs")?.checked ?? true;
  const installChecked  = document.getElementById("toggleInstall")?.checked ?? true;

  // Top row panels (now using explicit IDs from the HTML)
  const buildPanel = document.getElementById("builderPanel");  // boom data panel
  const vcmPanel   = document.getElementById("vcmPanel");      // VCM panel
  const partsPanel = document.getElementById("partsPanel");    // parts panel

  // Build & VCM together
  if (buildPanel) buildPanel.style.display = buildVcmChecked ? "" : "none";
  if (vcmPanel)   vcmPanel.style.display   = buildVcmChecked ? "" : "none";

  // Parts panel
  if (partsPanel) partsPanel.style.display = partsChecked ? "" : "none";

  // Docs card
  const docsCard = document.getElementById("relatedDocsPanel");
  if (docsCard) docsCard.style.display = docsChecked ? "" : "none";

  // Install panel
  const installCard = document.getElementById("installPanel");
  if (installCard) installCard.style.display = installChecked ? "" : "none";
}


function initPanelToggles() {
  const ids = ["toggleBuildVcm", "toggleParts", "toggleDocs", "toggleInstall"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", applyPanelVisibilityFromToggles);
    }
  });

  // Initial visibility
  applyPanelVisibilityFromToggles();
}
function generateInstallInstructions() {
  if (!currentConfig) {
    alert("No configuration loaded. Load or select a config first.");
    return;
  }

  const out = document.getElementById("installOutput");
  if (!out) return;

  // --- pull from config first, fallback to UI for backward compatibility ---
  const meta = currentConfig.meta || {};
  const structure = currentConfig.structure || {};
  const foldsObj = (structure.folds || {});
  const vcm = currentConfig.vcm || {};

  const iTotal = document.getElementById("totalNozzles");
  const iSpace = document.getElementById("nozzleSpacing");
  const iGate  = document.getElementById("gatewayMount");

  const totalNozzles = Number(meta.totalNozzles ?? iTotal?.value ?? 0) || 0;
  const spacingIn    = Number(meta.nozzleSpacing ?? iSpace?.value ?? 0) || 0;
  const hubModeVal   = String(meta.hubMode ?? vcm.mode ?? "").toLowerCase() || "standard";
  const gatewayMount = Number(structure.gatewayMount ?? iGate?.value ?? 0) || 0;

  const breakaway = Number(foldsObj.breakaway ?? 0) || 0;
  const outerFold = Number(foldsObj.outer ?? 0) || 0;
  const innerFold = Number(foldsObj.inner ?? 0) || 0;
  const primaryFold = Number(foldsObj.primary ?? 0) || 0;

  if (!totalNozzles || !spacingIn) {
    alert("Install instructions require Total Nozzles and Nozzle Spacing.");
    return;
  }

  // hub nozzle position (matches drawing logic)
  const hubNozzle = gatewayMount > 0 ? gatewayMount : (totalNozzles / 2 + 0.5);

  // global fold boundaries (approx; used only for extension-length estimate)
  const foldNozzles = [];
  [breakaway, outerFold, innerFold, primaryFold].forEach(v => {
    if (v > 0 && v < (totalNozzles / 2)) {
      foldNozzles.push(v);
      foldNozzles.push(totalNozzles - v);
    }
  });

  const roundUp5 = (ft) => Math.ceil(ft / 5) * 5;

  const extId = (a, b) => {
    const A = a.type === "hub" ? "hub" : `vcm:${a.nozzle}`;
    const B = b.type === "hub" ? "hub" : `vcm:${b.nozzle}`;
    return [A, B].sort().join("->");
  };

  const calcExtensionFeet = (a, b) => {
    const nozzleA = (a.type === "hub") ? hubNozzle : a.nozzle;
    const nozzleB = b.nozzle;
    const minN = Math.min(nozzleA, nozzleB);
    const maxN = Math.max(nozzleA, nozzleB);

    let runFt = (Math.abs(nozzleB - nozzleA) * spacingIn) / 12;
    if (a.type === "hub") runFt += 5;

    let crossed = 0;
    foldNozzles.forEach(fn => { if (fn > minN && fn < maxN) crossed++; });
    runFt += crossed * 4;

    return roundUp5(runFt);
  };

  const extOverrides = new Map(
    Object.entries((currentConfig.extensions && currentConfig.extensions.overrides) || {})
  );

  // Build VCM model (matches draw logic: sequential nozzle allocation left->right)
  const maxPorts = (hubModeVal === "lite") ? 4 : 8;
  const data = (vcm.data || {});
  const model = [];
  let cursor = 1;

  for (let p = 1; p <= maxPorts; p++) {
    const row = data[String(p)] || data[p];
    if (!row) continue;

    const portVCMs = [];
    const seqs = ["v1", "v2", "v3"];

    for (let i = 0; i < seqs.length; i++) {
      const k = seqs[i];
      const cfg = row[k] || {};
      const noz = Number(cfg.nozzles || 0) || 0;
      if (noz <= 0) continue;

      const start = cursor;
      const end = Math.min(cursor + noz - 1, totalNozzles);
      const count = end - start + 1;
      let mount = (start + end) / 2;

      const onLeft = mount < hubNozzle;

      // ≤6 rule: mount at end nearest hub (matches boom graphic behavior)
      if (count <= 6) mount = onLeft ? end : start;

      mount += (Number(cfg.shift || 0) || 0);

      portVCMs.push({
        port: p,
        seq: (i + 1),
        label: `${p}-${i + 1}`,
        nozzleStart: start,
        nozzleEnd: end,
        nozzleCount: count,
        mountNozzle: mount
      });

      cursor = end + 1;
    }

    if (portVCMs.length) model.push(...portVCMs);
  }

  // Left→Right ordering for installer workflow (locked rule)
  const vcmOrdered = model
    .slice()
    .sort((a, b) => (a.mountNozzle - b.mountNozzle));

  // VCM Map rows + dust plugs (6-drop harness only; locked)
  const harnessCount = (n) => (n <= 6 ? 1 : 2);
  const harnessCapacity = (n) => (harnessCount(n) * 6);
  const dustPlugs = (n) => Math.max(0, harnessCapacity(n) - n);
  
   // Build port groups (needed by terminators + extension table)
  const byPort = {};
  model.forEach(v => {
    if (!byPort[v.port]) byPort[v.port] = [];
    byPort[v.port].push(v);
  });


  // Terminators (explicit): last VCM on left chain + last VCM on right chain per port
  const terminatorSet = new Set();
  Object.keys(byPort).forEach(pStr => {
    const listAll = byPort[pStr] || [];
    if (!listAll.length) return;

    const left = listAll.filter(v => v.mountNozzle <= hubNozzle).sort((a, b) => (a.mountNozzle - b.mountNozzle));
    const right = listAll.filter(v => v.mountNozzle > hubNozzle).sort((a, b) => (b.mountNozzle - a.mountNozzle));

    if (left.length) terminatorSet.add(left[0].label);   // farthest left
    if (right.length) terminatorSet.add(right[0].label); // farthest right
  });


  const vcmMapRows = vcmOrdered.map(v => {
    const h = harnessCount(v.nozzleCount);
    const cap = harnessCapacity(v.nozzleCount);
    const plugs = dustPlugs(v.nozzleCount);
    return `
      <tr>
        <td><strong>${v.label}</strong></td>
        <td>${v.port}</td>
        <td>${v.nozzleStart}–${v.nozzleEnd}</td>
        <td>${v.nozzleCount}</td>
        <td>${h}</td>
        <td>${plugs}</td>
        <td>${terminatorSet.has(v.label) ? "Terminate VCM" : ""}</td>
      </tr>
    `;
  }).join("");

  // Extension table (From → To → Length), still presented Left→Right by midpoint nozzle
  const extEdges = [];

  Object.keys(byPort).forEach(pStr => {
    const listAll = byPort[pStr] || [];

    const left = [];
    const right = [];
    listAll.forEach(v => {
      if (v.mountNozzle > hubNozzle) right.push(v);
      else left.push(v); // includes straddlers
    });

    // chain order: nearest hub → outward (same as drawing logic)
    left.sort((a, b) => (b.mountNozzle - a.mountNozzle));   // left side: closer hub = larger nozzle #
    right.sort((a, b) => (a.mountNozzle - b.mountNozzle));  // right side: closer hub = smaller nozzle #

    const addEdge = (fromNode, toNode, fromLabel, toLabel) => {
      const id = extId(fromNode, toNode);
      let feet = extOverrides.has(id) ? Number(extOverrides.get(id)) : calcExtensionFeet(fromNode, toNode);
      feet = Math.max(1, Math.round(feet));
      const mid = ( (fromNode.type === "hub" ? hubNozzle : fromNode.nozzle) + toNode.nozzle ) / 2;
      extEdges.push({ fromLabel, toLabel, feet, mid });
    };

    // LEFT edges
    if (left.length) {
		addEdge({ type: "hub" }, { type: "vcm", nozzle: left[0].mountNozzle }, `Hub (Port ${pStr})`, `VCM ${left[0].label}`);
      for (let i = 0; i < left.length - 1; i++) {
        addEdge(
          { type: "vcm", nozzle: left[i].mountNozzle },
          { type: "vcm", nozzle: left[i + 1].mountNozzle },
          `VCM ${left[i].label}`,
		  `VCM ${left[i + 1].label}`
        );
      }
    }

    // RIGHT edges
    if (right.length) {
      addEdge({ type: "hub" }, { type: "vcm", nozzle: right[0].mountNozzle }, `Hub (Port ${pStr})`, `VCM ${right[0].label}`);
      for (let i = 0; i < right.length - 1; i++) {
        addEdge(
          { type: "vcm", nozzle: right[i].mountNozzle },
          { type: "vcm", nozzle: right[i + 1].mountNozzle },
			`VCM ${right[i].label}`,
			`VCM ${right[i + 1].label}`
        );
      }
    }
  });

  extEdges.sort((a, b) => (a.mid - b.mid));

  const extRows = extEdges.map(e => `
    <tr>
      <td>${e.fromLabel}</td>
      <td>${e.toLabel}</td>
      <td><strong>${e.feet}'</strong></td>
    </tr>
  `).join("");

  // Terminators (explicit, per-port end-of-chain)
  const terminatorLines = [];
  Object.keys(byPort).forEach(pStr => {
    const listAll = byPort[pStr] || [];
    if (!listAll.length) return;

    const left = listAll.filter(v => v.mountNozzle <= hubNozzle).sort((a, b) => (a.mountNozzle - b.mountNozzle));
    const right = listAll.filter(v => v.mountNozzle > hubNozzle).sort((a, b) => (b.mountNozzle - a.mountNozzle));

    if (left.length) {
      const outerMost = left[0]; // smallest mountNozzle on left side = farthest left
      terminatorLines.push(`<li>Port ${pStr}: Install chain terminator at outermost VCM <strong>${outerMost.label}</strong>.</li>`);
    }
    if (right.length) {
      const outerMost = right[0]; // largest mountNozzle on right side = farthest right
      terminatorLines.push(`<li>Port ${pStr}: Install chain terminator at outermost VCM <strong>${outerMost.label}</strong>.</li>`);
    }
  });

  // Header
  const machineLabelParts = [meta.make || "", meta.model || ""].filter(Boolean);
  const machineLabel = machineLabelParts.join(" ");
  const headerTitle = currentConfig.name || "PinPoint III Boom Install Instructions";
    // PowerHub mounting position text (no math shown to user)
  let powerHubPosText = "Mount PowerHub in the center.";
  if (gatewayMount > 0) {
    if (gatewayMount < (totalNozzles / 2)) powerHubPosText = "Mount PowerHub to the left of center.";
    else if (gatewayMount > (totalNozzles / 2)) powerHubPosText = "Mount PowerHub to the right of center.";
  }

  const headerHtml = `
    <h1>${headerTitle}</h1>
    <p><strong>Machine:</strong> ${machineLabel || "Unspecified machine"}</p>
    <p><strong>Boom:</strong> ${totalNozzles}-nozzle boom @ ${spacingIn}" spacing</p>
    <p><strong>Hub:</strong> ${hubModeVal === "lite" ? "PinPoint III Lite Hub (Ports 1–4)" : "PinPoint III Standard Hub (Ports 1–8)"}</p>
  `;

  const sectionPrep = `
    <h2>Section 1 – Prep & Verification</h2>
    <ul>
      <li>Install PowerHub using machine-specific mounting brackets or a universal mounting kit.</li>
      <li><strong>PowerHub mounting position:</strong> ${powerHubPosText} Orient hub with power lugs at the bottom.</li>
      <li>If the power harness is installed, ensure the circuit breaker is tripped before continuing.</li>
      <li>Confirm the boom on the machine matches the boom drawing (nozzle count, spacing, folds).</li>
	  <li>Flush/clean boom prior to valve install and confirm 80-mesh (or finer) strainers are installed.</li>
      <li>Install all solenoid valves onto spray bodies across the boom.</li>
      <li><strong>IMPORTANT:</strong> Do not spin o-rings when installing Spitfire valves. Hold the coil stationary while tightening the flynut.</li>
      <li><strong>VCM orientation:</strong> mount with connectors facing the ground or perpendicular to the ground. Do not face connectors upward.</li>
      <li><strong>VCM orientation:</strong> keep the 12-pin DT connector labeled “Left 1-6” on the left and “Right 7-12” on the right.</li>
      <li><strong>Installer workflow:</strong> start at the leftmost boom tip and work left → right.</li>
    </ul>
  `;


  const sectionVcmMap = `
    <h2>Section 2 – VCM Map (Mount + Valve Ranges)</h2>
    <p>Mount each VCM at the labeled position shown in the Boom Graphic.</p>
    <table class="install-table">
      <thead>
        <tr>
          <th>VCM</th>
          <th>Port</th>
          <th>Valves</th>
          <th>Used</th>
          <th>6-Drop Harnesses</th>
          <th>Dust Plugs</th>
          <th>CAN Terminator</th>
        </tr>
      </thead>
      <tbody>
        ${vcmMapRows || `<tr><td colspan="8">No VCMs defined.</td></tr>`}
      </tbody>
    </table>
    <ul>
      <li><strong>Mounting:</strong> Mount each VCM at the labeled position shown in the Boom Graphic.</li>
      <li><strong>Nozzle Drop Harness Installation Rules:</strong> If a nozzle drop harness runs to the left of a VCM mounting position, plug it into the VCM 12-pin connector labeled <strong>Left 1-6</strong>. If it runs to the right of a VCM mounting position, plug it into the VCM 12-pin connector labeled <strong>Right 7-12</strong>.</li>
      <li><strong>Nozzle Drop Harnesses Note:</strong> During installation of nozzle drop harnesses, drops may be skipped to go around obstacles and fold joints.</li>
	  <li><strong>Dust plugs:</strong> Install 2-pin Weatherpack dust plugs on all nozzle harness drops not plugged into a valve (see Dust Plugs column).</li>
    </ul>
  `;

const sectionExt = `
  <h2>Section 3 – Extension Harness Table</h2>
  <p>Install extension harnesses per the Boom Graphic, use table as reference to boom graphic.</p>

  <table class="install-table">
    <thead>
      <tr>
        <th>From</th>
        <th>To</th>
        <th>Length</th>
      </tr>
    </thead>
    <tbody>
      ${extRows || `<tr><td colspan="3">No extension harnesses required.</td></tr>`}
    </tbody>
  </table>

  <h3>Best Practices</h3>
  <ul>
    <li>Do not overtighten zip ties.</li>
    <li>Do not zip tie harnesses permanently until initial tests are completed.</li>
    <li>If a harness is too long and must be coiled, do not overbend it (never tighter than the radius of a soda can).</li>
    <li>Avoid routing over rough surfaces and sharp points.</li>
    <li>Add additional protection in high-friction areas.</li>
  </ul>
`;

// Full document HTML (no schema change)
const fullHtml = `<div class="install-doc">${headerHtml}${sectionPrep}${sectionVcmMap}${sectionExt}</div>`;


  // Ensure installSteps container exists
  if (!currentConfig.installSteps || typeof currentConfig.installSteps !== "object") {
    currentConfig.installSteps = {
      version: 0,
      generatedAt: null,
      contentHtml: "",
      source: "auto"
    };
  }

  const prevVersion = Number(currentConfig.installSteps.version) || 0;
  const newVersion = prevVersion + 1;

  currentConfig.installSteps.version = newVersion;
  currentConfig.installSteps.generatedAt = new Date().toISOString();
  currentConfig.installSteps.contentHtml = fullHtml;
  currentConfig.installSteps.source = "auto";

  renderInstallPanelFromConfig();
  alert(`Install instructions generated (version ${newVersion}).`);
}



// --- 5. TEMP demo button wiring ---

function initDocsDemoControls() {
  const demoBtn = document.getElementById("loadDocsDemoBtn");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      currentConfig = ensureDocsFieldsOnConfig({ ...DEMO_CONFIG });
      editingBoomDocIndex = null;
      renderRelatedDocsPanel();
    });
  }

  const addBoomDocBtn = document.getElementById("boomDocAddBtn");
  if (addBoomDocBtn) {
    addBoomDocBtn.addEventListener("click", handleAddBoomDoc);
  }

  // Initial state
  renderRelatedDocsPanel();
}
function initInstallPanel() {
  const btn = document.getElementById("btnGenerateInstall");
  if (btn) {
    btn.addEventListener("click", generateInstallInstructions);
  }

  const printBtn = document.getElementById("btnPrintInstall");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Initial render based on whatever currentConfig is (likely null or demo later)
  renderInstallPanelFromConfig();
}




// Call init from your existing DOMContentLoaded/init code
document.addEventListener("DOMContentLoaded", () => {
  initDocsDemoControls();
  initInstallPanel();
   initPanelToggles();
});


// === Main app ===
window.addEventListener('DOMContentLoaded', () => {
  // ----- constants -----
  const BOOM_Y = 120;
  const MAX_Y = 36;
  const NOZZLE_PX = 26;
  const VCM_Y = 168;
  const DOCK = 4; // px separation left/right dock from VCM center

  const DEFAULTS = {
    totalNozzles: 54,
    nozzleSpacing: 20,
    breakaway: 4,
    outerFold: 0,
    innerFold: 12,
    primaryFold: 24,
    gatewayMount: 0
  };
// --- Help popover toggle (delegated) ---
(function setupHelpPopover(){
  let openPop = null;

  function closePop() {
    if (!openPop) return;
    const id = openPop.id;
    openPop.hidden = true;
    const btn = document.querySelector(`.help-icon[aria-controls="${id}"]`);
    if (btn) btn.setAttribute('aria-expanded', 'false');
    openPop = null;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('.help-icon');
    if (btn) {
      const targetId = btn.getAttribute('aria-controls');
      const pop = targetId && document.getElementById(targetId);
      if (!pop) return;

      // if another popover is open, close it first
      if (openPop && openPop !== pop) closePop();

      const willOpen = pop.hidden;
      pop.hidden = !willOpen;
      btn.setAttribute('aria-expanded', String(willOpen));

      if (willOpen) {
        openPop = pop;
        // simple positioning near the button
        // position popover adjacent to the button (viewport-anchored)
const r = btn.getBoundingClientRect();
pop.style.position = 'fixed';
pop.style.top = `${Math.round(r.bottom + 8)}px`;

const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
const pw = pop.offsetWidth || 280; // fallback width if 0 on first open
let left = Math.round(r.left);

// if it would overflow right edge, right-align it to the button
if (left + pw > vw - 8) left = Math.max(8, Math.round(r.right - pw));

pop.style.left = `${left}px`;
pop.style.maxWidth = 'min(420px, 90vw)';
pop.style.zIndex = '3000';

      } else {
        openPop = null;
      }
      e.stopPropagation();
      return;
    }

    // click outside closes
    if (openPop && !e.target.closest('.help-pop')) closePop();
  });

  // ESC closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePop();
  });
})();

  // ----- DOM -----
  const el = (id) => document.getElementById(id);
  const boomEl = el('boom');
  const nozzlesEl = el('nozzles');
  const vcmLayer = el('vcmLayer');
  const errEl = el('err');
  const boomTitleEl = el('boomTitle');
  const boomInfoEl  = el('boomInfo');
  const iConfigName = el('configName');

  const iTotal = el('totalNozzles');
  const iSpace = el('nozzleSpacing');
  const iBreak = el('breakaway');
  const iOuter = el('outerFold');
  const iInner = el('innerFold');
  const iPrim  = el('primaryFold');
  const iGate  = el('gatewayMount');
  const btnReset = el('resetBtn');

  const hubMode = el('hubMode');
  const vcmFields = el('vcmFields');
  const partsTableRoot = el('partsTable');

  // Required elements check
  const missing = [];
  if (!boomEl) missing.push('#boom');
  if (!nozzlesEl) missing.push('#nozzles');
  if (!vcmLayer) missing.push('#vcmLayer');
  if (!hubMode) missing.push('#hubMode');
  if (!vcmFields) missing.push('#vcmFields');
  if (missing.length) {
    if (errEl) errEl.textContent = 'Missing elements: ' + missing.join(', ');
    DBG('Missing required elements:', missing.join(', '));
    return;
  }

  // ----- state -----
  const extOverrides = new Map();      // segmentId -> ft
  let EXT_COUNTS = Object.create(null); // { feet: qty }
  let lastBoomState = null, lastVCMModel = null;
  let rafId = null;

  // ----- utils -----
  const assert = (cond, msg) => { if (!cond) throw new Error('ASSERT: ' + msg); };
  const yFromPercent = (p) => MAX_Y + (BOOM_Y - MAX_Y) * (1 - p);
  const nozzleToX = (no, offsetX) => offsetX + (no - 0.5) * NOZZLE_PX;
  const sanitizeName = (s) => String(s||'').trim().replace(/[\\/:*?"<>|]+/g, '-');
  const stampDate = () => {
    const d = new Date(); const p=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  };
  const roundToNearest = (arr, value) =>
    arr.slice().sort((a,b) => {
      const da=Math.abs(a-value), db=Math.abs(b-value);
      return da!==db ? da-db : a-b;
    })[0];

  // ----- scheduling -----
  
  // Ensure global callable drawAllNow for schedulers
  if (typeof window.drawAllNow !== 'function') {
    window.drawAllNow = function(){ try { return _drawAllNowImpl && _drawAllNowImpl(); } catch(e){ DERR?.(e,'drawAllNow'); } };
  }
function scheduleDraw() {
    DBG('scheduleDraw queued');
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      try { window.drawAllNow(); }
      catch (e) { DERR(e, 'drawAllNow'); }
    });
  }

  // ----- VCM inputs panel -----
  function updateShiftDisplay(cell, shiftVal) {
    if (!cell) return;
    const L = cell.querySelector('.vcm-shift-left');
    const R = cell.querySelector('.vcm-shift-right');
    if (!L || !R) return;
    L.classList.remove('has-shift'); R.classList.remove('has-shift');
    L.dataset.shift = ""; R.dataset.shift = "";
    if (shiftVal > 0) { R.classList.add('has-shift'); R.dataset.shift = String(shiftVal); }
    else if (shiftVal < 0) { L.classList.add('has-shift'); L.dataset.shift = String(Math.abs(shiftVal)); }
  }
  function renderVCMInputs(mode) {
    const max = mode === 'lite' ? 4 : 8;
    vcmFields.innerHTML = '';
    for (let p = 1; p <= max; p++) {
      const row = document.createElement('div');
      row.className = 'vcm-row';
      row.innerHTML = `
        <div style="font-size:11px;font-weight:600;">Port ${p}</div>
        ${[1,2,3].map(v => `
          <div class="vcm-cell" data-port="${p}" data-vcm="${v}">
            <button class="bump vcm-shift-left" data-port="${p}" data-vcm="${v}" data-dir="-1"></button>
            <input type="number" min="0" max="12" value="0" data-port="${p}" data-vcm="${v}" />
            <button class="bump vcm-shift-right" data-port="${p}" data-vcm="${v}" data-dir="1"></button>
            <div class="shift-flag" data-port="${p}" data-vcm="${v}" style="display:none;">0</div>
          </div>
        `).join('')}
      `;
      vcmFields.appendChild(row);
    }
    vcmFields.querySelectorAll('input[type=number]').forEach(inp => {
      inp.addEventListener('input', e => {
        let val = +e.target.value || 0;
        e.target.value = Math.max(0, Math.min(12, val));
        scheduleDraw(); validateDropCount();
      });
    });
    vcmFields.querySelectorAll('.bump').forEach(btn => {
      btn.addEventListener('click', e => {
        const { port, vcm, dir } = e.currentTarget.dataset;
        const flag = vcmFields.querySelector(`.shift-flag[data-port="${port}"][data-vcm="${vcm}"]`);
        let val = +(flag?.textContent || '0');
        val = Math.max(-6, Math.min(6, val + (+dir || 0)));
        if (flag) { flag.textContent = String(val); flag.style.display = 'none'; }
        const cell = e.currentTarget.closest('.vcm-cell');
        updateShiftDisplay(cell, val);
        scheduleDraw();
      });
    });
  }
  function setPortValue(port, seq, val) {
    const input = vcmFields.querySelector(`input[data-port="${port}"][data-vcm="${seq}"]`);
    if (input) input.value = val;
    const flag = vcmFields.querySelector(`.shift-flag[data-port="${port}"][data-vcm="${seq}"]`);
    if (flag) { flag.textContent = '0'; flag.style.display = 'none'; }
    const cell = vcmFields.querySelector(`.vcm-cell[data-port="${port}"][data-vcm="${seq}"]`);
    if (cell) updateShiftDisplay(cell, 0);
  }
  function applyInitialVCMDefaults() {
    setPortValue(1,1,12); setPortValue(1,2,12); setPortValue(2,1,6); setPortValue(3,1,12); setPortValue(3,2,12);
    scheduleDraw(); validateDropCount();
  }
  function zeroAllPorts() {
    vcmFields.querySelectorAll('.vcm-cell input[type="number"]').forEach(inp => { inp.value = 0; });
    vcmFields.querySelectorAll('.shift-flag').forEach(f => { f.textContent = '0'; f.style.display = 'none'; });
    vcmFields.querySelectorAll('.vcm-cell').forEach(cell => updateShiftDisplay(cell, 0));
    scheduleDraw(); validateDropCount();
  }
  function readVCMs() {
    const mode = hubMode.value;
    const max = mode === 'lite' ? 4 : 8;
    const data = {};
    for (let p = 1; p <= max; p++) {
      data[p] = { v1:{nozzles:0,shift:0}, v2:{nozzles:0,shift:0}, v3:{nozzles:0,shift:0} };
      [1,2,3].forEach(v => {
        const inp = vcmFields.querySelector(`input[data-port="${p}"][data-vcm="${v}"]`);
        const sh  = vcmFields.querySelector(`.shift-flag[data-port="${p}"][data-vcm="${v}"]`);
        if (inp) data[p]['v'+v].nozzles = +inp.value || 0;
        if (sh)  data[p]['v'+v].shift   = +sh.textContent || 0;
      });
    }
    return { mode, data };
  }
  function validateDropCount() {
    const total = +iTotal.value || 0;
    const msg = el('vcmStatus'); const tn = iTotal;
    const { data } = readVCMs();
    const drops = Object.values(data).reduce((s,row)=>s+(row.v1.nozzles||0)+(row.v2.nozzles||0)+(row.v3.nozzles||0),0);
    if (drops > total && total > 0) { if (msg) msg.textContent = `Heads up: VCM drops (${drops}) exceed total nozzles (${total}).`; tn?.classList.add('invalid'); }
    else { if (msg) msg.textContent = ''; tn?.classList.remove('invalid'); }
  }

  // ----- Boom drawing -----
  function buildBoom() {
    if (errEl) errEl.textContent = '';
    nozzlesEl.innerHTML = '';
    ['boom-line','fold-line','fold-label','slope','tip-line','center-bar','hub'].forEach(cls => {
      Array.from(boomEl.querySelectorAll('.' + cls)).forEach(n => n.remove());
    });

    const nRaw = +iTotal.value || 0;
    const totalNozzles = Math.max(1, Math.min(nRaw, 200));
    let breakaway = +iBreak.value || 0;
    let outer     = +iOuter.value || 0;
    let inner     = +iInner.value || 0;
    let primary   = +iPrim.value  || 0;
    const gateway = +iGate.value  || 0;

    if (totalNozzles < 1) { if (errEl) errEl.textContent = 'Need at least 1 nozzle.'; return null; }

    const offsetX = 30;
    const totalWidth = totalNozzles * NOZZLE_PX;
    boomEl.style.width = (totalWidth + offsetX*2) + 'px';

    // nozzles row
    nozzlesEl.style.left = offsetX + 'px';
    nozzlesEl.style.top  = (BOOM_Y + 5) + 'px';
    for (let i = 1; i <= totalNozzles; i++) {
      const d = document.createElement('div'); d.className = 'nozzle'; d.textContent = i; nozzlesEl.appendChild(d);
    }

    // rail
    const bl = document.createElement('div');
    bl.className = 'boom-line';
    bl.style.left = offsetX + 'px';
    bl.style.top  = BOOM_Y + 'px';
    bl.style.width = totalWidth + 'px';
    boomEl.appendChild(bl);

    const half = totalNozzles / 2;
    if (breakaway > half) breakaway = 0;
    if (outer     > half) outer     = 0;
    if (inner     > half) inner     = 0;
    if (primary   > half) primary   = 0;

    const ordered = [];
    if (breakaway > 0) ordered.push({ name:'Breakaway', val:breakaway });
    if (outer > 0 && outer > breakaway) ordered.push({ name:'Outer', val:outer });
    if (inner > 0 && inner > Math.max(breakaway, outer)) ordered.push({ name:'Inner', val:inner });

    let centerL = null, centerR = null, hasPrimary = false;
    if (primary > 0 && primary > Math.max(breakaway, outer, inner)) {
      ordered.push({ name:'Primary', val:primary }); hasPrimary = true;
    }

    const folds = { breakaway:[], outer:[], inner:[], primary:[] };
    ordered.forEach(f => {
      const leftX  = offsetX + f.val * NOZZLE_PX;
      const rightX = offsetX + (totalNozzles - f.val) * NOZZLE_PX;
      folds[f.name.toLowerCase()].push(leftX, rightX);
    });

    // diagonal runs + labels
    function seg(a, b) {
      const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy), ang=Math.atan2(dy,dx)*180/Math.PI;
      const s = document.createElement('div'); s.className='slope';
      s.style.left=a.x+'px'; s.style.top=a.y+'px'; s.style.width=(len+1)+'px'; s.style.transform='rotate('+ang+'deg)';
      boomEl.appendChild(s);
      if (a.label) {
        const f = document.createElement('div'); f.className='fold-line';
        f.style.left=(a.x-6)+'px'; f.style.top=a.y+'px'; f.style.height=(BOOM_Y-a.y)+'px'; boomEl.appendChild(f);
        const l=document.createElement('div'); l.className='fold-label'; l.style.left=a.x+'px'; l.style.top=(a.y-18)+'px';
        l.textContent=a.label; boomEl.appendChild(l);
      }
    }
    function tip(x,y){ const t=document.createElement('div'); t.className='tip-line';
      t.style.left=x+'px'; t.style.top=y+'px'; t.style.height=(BOOM_Y - y + 4)+'px'; boomEl.appendChild(t); }

    if (hasPrimary) {
      centerL = folds.primary[0]; centerR = folds.primary[1];
      const bar = document.createElement('div');
      bar.className='center-bar'; bar.style.left=(centerL-2)+'px'; bar.style.top=(MAX_Y-1)+'px'; bar.style.width=(centerR-centerL+4)+'px';
      boomEl.appendChild(bar);

      // left path
      const ptsL = [{x:centerL,y:yFromPercent(1.0),label:'Primary'}];
      if (folds.inner.length===2) ptsL.push({x:folds.inner[0],y:yFromPercent(0.6),label:'Inner'});
      if (folds.outer.length===2) ptsL.push({x:folds.outer[0],y:yFromPercent(0.4),label:'Outer'});
      if (folds.breakaway.length===2) ptsL.push({x:folds.breakaway[0],y:yFromPercent(0.15),label:'Breakaway'});
      ptsL.push({x:offsetX,y:yFromPercent(0.1),label:null});
      for (let i=0;i<ptsL.length-1;i++) seg(ptsL[i],ptsL[i+1]); tip(offsetX,yFromPercent(0.1));

      // right path
      const tipX = offsetX + totalWidth;
      const ptsR = [{x:centerR,y:yFromPercent(1.0),label:'Primary'}];
      if (folds.inner.length===2) ptsR.push({x:folds.inner[1],y:yFromPercent(0.6),label:'Inner'});
      if (folds.outer.length===2) ptsR.push({x:folds.outer[1],y:yFromPercent(0.4),label:'Outer'});
      if (folds.breakaway.length===2) ptsR.push({x:folds.breakaway[1],y:yFromPercent(0.15),label:'Breakaway'});
      ptsR.push({x:tipX,y:yFromPercent(0.1),label:null});
      for (let i=0;i<ptsR.length-1;i++) seg(ptsR[i],ptsR[i+1]); tip(tipX,yFromPercent(0.1));
    }

    // hub pos
    let hubX;
    if (gateway===0 && centerL!=null && centerR!=null) hubX=(centerL+centerR)/2;
    else if (gateway>0) hubX=offsetX + (gateway*NOZZLE_PX) - (NOZZLE_PX/2);
    else hubX=offsetX + (totalNozzles*NOZZLE_PX)/2;

    const hub = document.createElement('div');
    hub.className='hub'; hub.style.left=(hubX-20)+'px'; hub.style.top=(MAX_Y+14)+'px'; hub.textContent='HUB';
    boomEl.appendChild(hub);

    return {
      totalNozzles, offsetX, hubX,
      folds: [].concat(folds.breakaway, folds.outer, folds.inner, folds.primary)
    };
  }


  // ----- VCM model -----
  function buildVCMModel(boomState) {
    if (!boomState) return [];
    const { totalNozzles, hubX } = boomState;
    const { mode, data } = readVCMs();
    const max = mode === 'lite' ? 4 : 8;

    const results = [];
    let cursor = 1;

    for (let p = 1; p <= max; p++) {
      const raw = data[p] || {};
      const vs = [raw.v1, raw.v2, raw.v3];
      const portVCMs = [];

      for (let i = 0; i < vs.length; i++) {
        const cfg = vs[i];
        if (!cfg || !cfg.nozzles) continue;
        if (cursor > totalNozzles) break;

        const start = cursor;
        const end   = Math.min(cursor + cfg.nozzles - 1, totalNozzles);
        const count = end - start + 1;
        let mount = (start + end) / 2;

        const xCenter = nozzleToX(mount, boomState.offsetX);
        const onLeft = xCenter < hubX;

        // ≤6 rule: mount at end nearest hub
        if (count <= 6) mount = onLeft ? end : start;

        mount += (cfg.shift || 0);

        portVCMs.push({ port:p, seq:i+1, nozzleStart:start, nozzleEnd:end, nozzleCount:count, mountNozzle:mount });
        cursor = end + 1;
      }
      if (portVCMs.length) results.push(portVCMs);
    }
    return results;
  }

  // ----- VCM drawing -----
  function clearVCMs(){ vcmLayer.innerHTML = ''; }
  function drawVCMRect(x,label){
    const d=document.createElement('div'); d.className='vcm'; d.style.left=(x-13)+'px'; d.style.top=(VCM_Y-7)+'px'; d.textContent=label; vcmLayer.appendChild(d);
  }
  function drawDropLines(vcmX, vcm, boomState){
    const nozzleBottomY = BOOM_Y + 5 + 18;
    const harnessY = nozzleBottomY + 12;
    const vcmTopY = VCM_Y - 7;
    const hubX = boomState.hubX;
    const isLeft = vcmX < hubX;
    const bundleL = vcmX - 12;
    const bundleR = vcmX + 12;
    let usedL=false, usedR=false;

    for (let n = vcm.nozzleStart; n <= vcm.nozzleEnd; n++) {
      const nx = nozzleToX(n, boomState.offsetX);
      let targetX;
      if (vcm.nozzleCount <= 6) targetX = isLeft ? bundleL : bundleR;
      else {
        const firstHalf = (n - vcm.nozzleStart) < 6;
        targetX = firstHalf ? bundleL : bundleR;
      }
      const v1=document.createElement('div'); v1.className='vline'; v1.style.left=nx+'px'; v1.style.top=nozzleBottomY+'px'; v1.style.height=(harnessY-nozzleBottomY)+'px'; vcmLayer.appendChild(v1);
      const h1=document.createElement('div'); h1.className='hline'; h1.style.left=Math.min(nx,targetX)+'px'; h1.style.top=harnessY+'px'; h1.style.width=Math.abs(nx-targetX)+'px'; vcmLayer.appendChild(h1);
      if (targetX===bundleL) usedL=true; if (targetX===bundleR) usedR=true;
    }
    if (usedL){ const up=document.createElement('div'); up.className='vline'; up.style.left=bundleL+'px'; up.style.top=harnessY+'px'; up.style.height=(vcmTopY-harnessY)+'px'; vcmLayer.appendChild(up); }
    if (usedR){ const up=document.createElement('div'); up.className='vline'; up.style.left=bundleR+'px'; up.style.top=harnessY+'px'; up.style.height=(vcmTopY-harnessY)+'px'; vcmLayer.appendChild(up); }
  }

  function extId(a,b){
    const A = a.type==='hub' ? 'hub' : `vcm:${a.nozzle}`;
    const B = b.type==='hub' ? 'hub' : `vcm:${b.nozzle}`;
    return [A,B].sort().join('->');
  }
  function calcExtensionFeet(a,b,boomState){
    const spacingIn = +iSpace.value || 20;
    const folds = boomState.folds || [];
    let nozzleA, xA;
    if (a.type==='hub'){ nozzleA = (boomState.hubX - boomState.offsetX)/NOZZLE_PX + 0.5; xA=boomState.hubX; }
    else { nozzleA=a.nozzle; xA=a.x; }
    const nozzleB=b.nozzle, xB=b.x;
    const distNoz = Math.abs(nozzleB-nozzleA);
    let runFt = (distNoz*spacingIn)/12;
    if (a.type==='hub') runFt += 5;
    const minX=Math.min(xA,xB), maxX=Math.max(xA,xB);
    let crossed=0; folds.forEach(fx=>{ if (fx>minX && fx<maxX) crossed++; });
    runFt += crossed*4;
    return Math.ceil(runFt/5)*5;
  }
  function drawExtension(fromX,toX,railY,fromNode,toNode,boomState){
    const chooseDock = (selfX,otherX)=> (otherX<selfX ? -1 : 1);
    let ax=fromX, bx=toX;
    if (fromNode.type==='vcm'){ const side=chooseDock(fromX,toX); ax=fromX+side*DOCK; if (fromNode.ref){ if (side<0) fromNode.ref.usedL=true; else fromNode.ref.usedR=true; } }
    if (toNode.type==='vcm'){ const side=chooseDock(toX,fromX); bx=toX+side*DOCK; if (toNode.ref){ if (side<0) toNode.ref.usedL=true; else toNode.ref.usedR=true; } }
    const h=document.createElement('div'); h.className='hline'; h.style.left=Math.min(ax,bx)+'px'; h.style.top=railY+'px'; h.style.width=Math.abs(bx-ax)+'px'; vcmLayer.appendChild(h);
    const id=extId(fromNode,toNode);
    let feet = extOverrides.has(id) ? extOverrides.get(id) : calcExtensionFeet(fromNode,toNode,boomState);
    feet = Math.max(1, Math.round(feet));
    EXT_COUNTS[feet]=(EXT_COUNTS[feet]||0)+1;
    const midX=(ax+bx)/2, labelY=railY+5;
    const leader=document.createElement('div'); leader.className='vline'; leader.style.left=midX+'px'; leader.style.top=railY+'px'; leader.style.height=(labelY-railY-6)+'px'; vcmLayer.appendChild(leader);
    const lbl=document.createElement('div'); lbl.className='ext-label'; lbl.dataset.extId=id; lbl.style.left=midX+'px'; lbl.style.top=labelY+'px'; lbl.textContent=feet+"'"; vcmLayer.appendChild(lbl);
  }

  function drawVCMs(boomState, vcmModel){
    EXT_COUNTS = Object.create(null);
    clearVCMs();
    const baseY = VCM_Y + 20, stepY = 22, hubX = boomState.hubX;
    const left=[], right=[];
    vcmModel.forEach(portVCMs=>{
      const xs = portVCMs.map(v=>nozzleToX(v.mountNozzle,boomState.offsetX));
      const minX=Math.min(...xs), maxX=Math.max(...xs);
      if (maxX < hubX) left.push({portVCMs,minX,maxX});
      else if (minX > hubX) right.push({portVCMs,minX,maxX});
      else left.push({portVCMs,minX,maxX}); // straddlers → left
    });
    left.sort((a,b)=>a.minX-b.minX);
    right.sort((a,b)=>b.maxX-a.maxX);

    // LEFT
    left.forEach((p,i)=>{
      const railY = baseY + (left.length-1-i)*stepY;
      const list = p.portVCMs.map(v=>({...v,x:nozzleToX(v.mountNozzle,boomState.offsetX)})).sort((a,b)=>b.x-a.x);
      list.forEach(v=>{ v.usedL=false; v.usedR=false; drawVCMRect(v.x, v.port+'-'+v.seq); drawDropLines(v.x, v, boomState); });
      for (let j=0;j<list.length-1;j++){
        drawExtension(list[j].x, list[j+1].x, railY,
          {type:'vcm', nozzle:list[j].mountNozzle, x:list[j].x, ref:list[j]},
          {type:'vcm', nozzle:list[j+1].mountNozzle, x:list[j+1].x, ref:list[j+1]},
          boomState);
      }
      // hub riser
      const up=document.createElement('div'); up.className='vline'; up.style.left=hubX+'px'; up.style.top=(VCM_Y+7)+'px'; up.style.height=(railY-(VCM_Y+7))+'px'; vcmLayer.appendChild(up);
      // hub → nearest (nearest to hub is list[0] on LEFT)
      const nearest=list[0];
      drawExtension(hubX, nearest.x, railY, {type:'hub', x:hubX}, {type:'vcm', nozzle:nearest.mountNozzle, x:nearest.x, ref:nearest}, boomState);
      // hub dot
      const dot=document.createElement('div'); dot.className='rail-dot'; dot.style.left=(hubX-2)+'px'; dot.style.top=(railY-2)+'px'; vcmLayer.appendChild(dot);
      // draw only used risers
      list.forEach(v=>{
        if (v.usedL){ const r=document.createElement('div'); r.className='vline'; r.style.left=(v.x-DOCK)+'px'; r.style.top=(VCM_Y+7)+'px'; r.style.height=(railY-(VCM_Y+7))+'px'; vcmLayer.appendChild(r); }
        if (v.usedR){ const r=document.createElement('div'); r.className='vline'; r.style.left=(v.x+DOCK)+'px'; r.style.top=(VCM_Y+7)+'px'; r.style.height=(railY-(VCM_Y+7))+'px'; vcmLayer.appendChild(r); }
      });
    });

    // RIGHT
    right.forEach((p,i)=>{
      const railY = baseY + (right.length-1-i)*stepY;
      const list = p.portVCMs.map(v=>({...v,x:nozzleToX(v.mountNozzle,boomState.offsetX)})).sort((a,b)=>a.x-b.x);
      list.forEach(v=>{ v.usedL=false; v.usedR=false; drawVCMRect(v.x, v.port+'-'+v.seq); drawDropLines(v.x, v, boomState); });
      for (let j=0;j<list.length-1;j++){
        drawExtension(list[j].x, list[j+1].x, railY,
          {type:'vcm', nozzle:list[j].mountNozzle, x:list[j].x, ref:list[j]},
          {type:'vcm', nozzle:list[j+1].mountNozzle, x:list[j+1].x, ref:list[j+1]},
          boomState);
      }
      const up=document.createElement('div'); up.className='vline'; up.style.left=hubX+'px'; up.style.top=(VCM_Y+7)+'px'; up.style.height=(railY-(VCM_Y+7))+'px'; vcmLayer.appendChild(up);
      const closest=list[0];
      drawExtension(hubX, closest.x, railY, {type:'hub', x:hubX}, {type:'vcm', nozzle:closest.mountNozzle, x:closest.x, ref:closest}, boomState);
      const dot=document.createElement('div'); dot.className='rail-dot'; dot.style.left=(hubX-2)+'px'; dot.style.top=(railY-2)+'px'; vcmLayer.appendChild(dot);
      list.forEach(v=>{
        if (v.usedL){ const r=document.createElement('div'); r.className='vline'; r.style.left=(v.x-DOCK)+'px'; r.style.top=(VCM_Y+7)+'px'; r.style.height=(railY-(VCM_Y+7))+'px'; vcmLayer.appendChild(r); }
        if (v.usedR){ const r=document.createElement('div'); r.className='vline'; r.style.left=(v.x+DOCK)+'px'; r.style.top=(VCM_Y+7)+'px'; r.style.height=(railY-(VCM_Y+7))+'px'; vcmLayer.appendChild(r); }
      });
    });
  }

  // click-to-override extension label
  vcmLayer.addEventListener('click', (e) => {
    const lbl = e.target.closest('.ext-label');
    if (!lbl) return;
    const id = lbl.dataset.extId;
    const current = parseInt((lbl.textContent||'0').replace(/\D+/g,''),10)||0;
    const input = prompt('Set extension length (ft):', current || '');
    if (input === null) return;
    const val = Math.round(Number(input));
    if (!isFinite(val) || val <= 0) return;
    extOverrides.set(id, val);
    scheduleDraw();
  });

  // ----- Parts list -----
  function renderPartsList(boomState, vcmModel){
    const tbody = document.querySelector('#partsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const spacingIn = +iSpace.value || 20;
    const hubType = hubMode.value; // 'lite' or 'standard'
    const totalNozzles = boomState ? boomState.totalNozzles : 0;

    const { mode, data } = readVCMs();
    const max = mode === 'lite' ? 4 : 8;
    let portsUsed = 0, vcmCount = 0, harnesses = 0;
    for (let p=1;p<=max;p++){
      const row=data[p]; if (!row) continue;
      const used=(row.v1.nozzles||0)+(row.v2.nozzles||0)+(row.v3.nozzles||0);
      if (used>0){ portsUsed++; if (row.v1.nozzles>0)vcmCount++; if (row.v2.nozzles>0)vcmCount++; if (row.v3.nozzles>0)vcmCount++; }
      [row.v1,row.v2,row.v3].forEach(v=>{ if (v.nozzles>0) harnesses += (v.nozzles<=6 ? 1 : 2); });
    }

    // spacing → harness PN
    const HARNESS_MAP = { 20:'118200-200', 15:'118200-201', 10:'118200-203', 22:'118200-204', 30:'118200-205', 2:'118202-202' };
    const opts = Object.keys(HARNESS_MAP).map(Number);
    const chosen = roundToNearest(opts, spacingIn);
    const harnessPN = HARNESS_MAP[chosen];
    const harnessDesc = `${chosen}" 6-Drop Nozzle Harness`;

    // dust plugs for unused drops
    const totalDrops = harnesses * 6;
    const unusedDrops = Math.max(0, totalDrops - totalNozzles);

    // extensions from labels
    const extRows = Object.entries(EXT_COUNTS)
      .map(([feetStr, qty])=>{ const f=Math.max(1,parseInt(feetStr,10)||0); const code=String(f).padStart(3,'0'); return { pn:`150004-${code}`, desc:`${f}' Extension Harness`, qty }; })
      .sort((a,b)=> parseInt(a.pn.slice(-3)) - parseInt(b.pn.slice(-3)));

    function addRow(pn,desc,qty){
      if (!qty || qty<=0) return;
      const tr=document.createElement('tr'); tr.innerHTML=`<td>${pn}</td><td>${desc}</td><td>${qty}</td>`; tbody.appendChild(tr);
    }

    addRow(hubType==='lite'?'123000-130':'123000-150', hubType==='lite'?'Lite Hub':'Standard Hub', 1);
    addRow('123300-001','LeapStart VCM', vcmCount);
    addRow(harnessPN, harnessDesc, harnesses);

    // 5' nozzle drop extension (user-entered)
    const userRow=document.createElement('tr');
    userRow.innerHTML = `<td>118673-001</td><td>5' Nozzle Drop Extension</td><td><input id="user-ext-input" type="number" min="0" value="${window.USER_DROP_EXT_QTY||0}" style="width:70px;height:26px;"></td>`;
    tbody.appendChild(userRow);

    extRows.forEach(r=> addRow(r.pn, r.desc, r.qty));
    addRow('116200-045', '2-Pin Dust Plug (cap unused drops)', unusedDrops);
    addRow('150003-005','VCM Terminator', portsUsed);
    const sixPinQty = (hubType==='lite'?4:8) - portsUsed;
    addRow('706530-348','Dust Plug 6-Pin DT', Math.max(0, sixPinQty));
    addRow('706530-352','Dust Plug 4-Pin DT', 2);
  }

  partsTableRoot?.addEventListener('input', (e) => {
    const inp = e.target;
    if (inp && inp.id === 'user-ext-input') {
      window.USER_DROP_EXT_QTY = Math.max(0, Math.floor(+inp.value || 0));
      renderPartsList(lastBoomState, lastVCMModel);
    }
  });

  // ----- Boom meta (title/info) -----
  function updateBoomMeta(boomState){
    const name = (iConfigName?.value || '').trim();
    if (boomTitleEl){ boomTitleEl.textContent = name || ''; boomTitleEl.style.display = name ? '' : 'none'; }
    if (boomInfoEl && boomState){
      const total = boomState.totalNozzles || 0;
      const spacing = +iSpace.value || 0;
      const feet = (total*spacing)/12;
      boomInfoEl.textContent = `Total Nozzles = ${total}, Nozzle Spacing = ${spacing}, Boom Dimension = ${feet.toFixed(1)}`;
      boomInfoEl.style.display = '';
    }
  }

  // ----- Master render -----
  function _drawAllNowImpl(){
    DBG('drawAllNow begin');
    let boomState, vcmModel;
    try { boomState = buildBoom(); assert(!!boomState, 'buildBoom returned null'); }
    catch(e){ return DERR(e,'buildBoom'); }
    try { vcmModel = buildVCMModel(boomState); }
    catch(e){ return DERR(e,'buildVCMModel'); }
    try { drawVCMs(boomState, vcmModel); }
    catch(e){ return DERR(e,'drawVCMs'); }
    try { lastBoomState=boomState; lastVCMModel=vcmModel; renderPartsList(boomState, vcmModel); }
    catch(e){ return DERR(e,'renderPartsList'); }
    try { updateBoomMeta(boomState); }
    catch(e){ return DERR(e,'updateBoomMeta'); }
    DBG('drawAllNow end');
  }
  window.drawAllNow = _drawAllNowImpl;


  // ----- Exports -----
  async function renderBoomToCanvas() {
    const boom = boomEl; if (!boom) return null;
    const prev = boom.style.overflow; boom.style.overflow='hidden';
    // html2canvas must be included in HTML
    const canvas = await html2canvas(boom, { backgroundColor:'#ffffff', scale: Math.max(2, window.devicePixelRatio||1) });
    boom.style.overflow = prev; return canvas;
  }
  async function exportPNG(){
    try {
      const canvas = await renderBoomToCanvas(); if (!canvas) return;
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=(sanitizeName(iConfigName?.value)||'')+'_boom_'+stampDate()+'.png'; a.click();
    } catch(e){ DERR(e,'exportPNG'); }
  }
  function tableToCsv(table){
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(tr=>{
      const cells=Array.from(tr.children).map(td=>{
        let txt=(td.innerText||'').replace(/\r?\n/g,' ').trim();
        if (/[",]/.test(txt)) txt=`"${txt.replace(/"/g,'""')}"`;
        return txt;
      });
      return cells.join(',');
    }).join('\r\n');
  }
  function exportPartsCsv(){
    try{
      const tbl = el('partsTable'); if (!tbl) return;
      const csv = tableToCsv(tbl);
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=(sanitizeName(iConfigName?.value)||'')+'_parts_'+stampDate()+'.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch(e){ DERR(e,'exportPartsCsv'); }
  }
// Guess a simple display name if none is provided
function cfgDisplayNameGuess(){
  const tn = document.getElementById('totalNozzles')?.value || '';
  const sp = document.getElementById('nozzleSpacing')?.value || '';
  const hub= document.getElementById('hubMode')?.value || 'lite';
  return `Cfg ${tn}×${sp} ${hub}`.trim();
}

// Load factory presets from localStorage + any seeded presets on the page
function bootstrapFactoryPresets(){
  try {
    const seeded = Array.isArray(window.FACTORY_PRESETS) ? window.FACTORY_PRESETS : [];

    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem('boomcfg.factoryPresets.v1') || '[]');
    } catch {
      stored = [];
    }

    const byId = new Map();
    [...seeded, ...stored].forEach(cfg => {
      if (!cfg || typeof cfg !== 'object') return;
      const meta = cfg.metadata || {};
      const id = cfg.id || cfg.configId || (
        'cfg_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      );
      byId.set(id, {
        ...cfg,
        id,
        metadata: {
          ...meta,
          scope: meta.scope || 'FACTORY_PRESET',
          status: meta.status || 'APPROVED'
        }
      });
    });

    const merged = Array.from(byId.values());
    window.FACTORY_PRESETS = merged;
    localStorage.setItem('boomcfg.factoryPresets.v1', JSON.stringify(merged));
  } catch (e) {
    DERR?.(e, 'bootstrapFactoryPresets');
  }
}
async function refreshFactoryPresetsFromGitHub(){
  try {
    const res = await fetch(FACTORY_PRESETS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Factory presets fetch failed: ${res.status}`);
    const arr = await res.json();
    if (!Array.isArray(arr)) throw new Error("factory_presets.json must be an array of config objects");

    window.FACTORY_PRESETS = arr;
    localStorage.setItem(LS_FACTORY, JSON.stringify(arr));
  } catch (e) {
    // fallback to cached presets
    try {
      const cached = JSON.parse(localStorage.getItem(LS_FACTORY) || "[]");
      if (Array.isArray(cached) && cached.length) window.FACTORY_PRESETS = cached;
    } catch {}
    DERR?.(e, 'refreshFactoryPresetsFromGitHub');
  }
}



const LS_MY='boomcfg.myConfigs.v1';

// ---- Factory presets source (GitHub) ----
// Put this JSON in your repo: /data/factory_presets.json
const FACTORY_PRESETS_URL = "data/factory_presets.json";
const LS_FACTORY='boomcfg.factoryPresets.v1';

  const readMy = ()=>{ try{return JSON.parse(localStorage.getItem(LS_MY)||'[]');}catch{return[];} };
  const writeMy = (x)=> localStorage.setItem(LS_MY, JSON.stringify(x));
  const readQueue = ()=>{ try{return JSON.parse(localStorage.getItem(LS_QUEUE)||'[]');}catch{return[];} };
  const writeQueue = (x)=> localStorage.setItem(LS_QUEUE, JSON.stringify(x));
  const uid = ()=> 'cfg_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const nowISO = ()=> new Date().toISOString();
  function buildDisplayName(meta){
    const make=meta.make?.trim()||'', model=meta.model?.trim()||'';
    const type=meta.boomType?.trim()||'';
    const widthVal=+meta.width||0, widthUnit=(meta.widthUnit||'ft').toLowerCase();
    const spacing=+meta.spacing||0;
    const hub=(meta.hubMode||'').replace(/^\w/,c=>c.toUpperCase());
    const base=`${make} ${model} • ${type} • ${widthVal}${widthUnit} • ${spacing}" • ${hub}`;
    const v=(meta.variant||'').trim();
    return v ? `${base} • v:${v}` : base;
  }

  
function serializeCurrentToConfig(meta, asNewId=false){
  // ---- PRELUDE: get current UI values and a stable id
  const hub          = hubMode?.value || 'lite';
  const spacing      = +iSpace?.value || 20;
  const totalNozzles = +iTotal?.value || 0;
  const gateway      = +iGate?.value  || 0;
  const widthFt      = (totalNozzles && spacing) ? (totalNozzles * spacing / 12) : 0;

  // keep/assign id across saves unless 'Create New'
  let id = (!asNewId && window.__currentConfigId) ? window.__currentConfigId : uid();
  window.__currentConfigId = id;

  // folds
  const folds = {
    breakaway: +iBreak?.value || 0,
    outer:     +iOuter?.value || 0,
    inner:     +iInner?.value || 0,
    primary:   +iPrim?.value  || 0
  };

  // vcm snapshot
  const vcmSnap = (typeof readVCMs === 'function') ? readVCMs() : { mode: hub, data: {} };

  // extension overrides
  const overrides = {};
  if (window.extOverrides && typeof window.extOverrides.forEach === 'function') {
    window.extOverrides.forEach((len, idx)=>{ overrides[idx] = len; });
  }

  // optional: 5' drop list
  const fiveFootDrops = (typeof window.readFiveFootDrops === 'function')
    ? window.readFiveFootDrops()
    : [];

  // Build base config object
  const cfg = {
    id,
    name: buildDisplayName(meta),
    version: '3.8.0',
    createdAt: meta.createdAt || nowISO(),
    updatedAt: nowISO(),
    source: meta.source || 'user',

    meta: {
      totalNozzles,
      nozzleSpacing: spacing,
      hubMode: hub,
      make: meta.make, model: meta.model, boomType: meta.boomType,
      width: +(+widthFt).toFixed(2), widthUnit: 'ft',
      variant: meta.variant || '', tags: meta.tags || []
    },

    structure: {
      gatewayMount: gateway,
      folds
    },

    vcm: vcmSnap,

    extensions: {
      overrides,           // 10
      fiveFootDrops        // 11
    }
  };

  // Let docs system stamp its fields onto this config
  if (typeof attachDocsToConfig === 'function') {
    attachDocsToConfig(cfg);
  }

  return cfg;
}



  // Save dialog
  (function(){
    function initSaveDialog(){
      const overlay = el('saveMetaOverlay');
      if (!overlay) return;
      const err = el('metaErr');
const f = {
  name: el('metaConfigName'),
  make: el('metaMake'),
  model: el('metaModel'),
  type: el('metaBoomType'),
  width: el('metaWidth'),
  unit: el('metaWidthUnit'),
  spac: el('metaSpacing'),
  hub: el('metaHubMode'),
  var: el('metaVariant'),

  optSave: el('metaOptSaveLocal'),
  optDl: el('metaOptDownload'),
  optReq: el('metaOptRequestApproval'),

  fn: el('metaFirstName'),
  ln: el('metaLastName'),
  email: el('metaEmail'),
  approvalFields: el('metaApprovalFields'),

  importBtn: el('btnImportRequest'),
  importFile: el('fileImportRequest')
};
function syncApprovalFields() {
  const on = !!f.optReq?.checked;
  if (f.approvalFields) f.approvalFields.toggleAttribute('hidden', !on);
}
if (f.optReq) f.optReq.addEventListener('change', syncApprovalFields);
syncApprovalFields();
// Import Request File (JSON) -> load into current UI (employee workflow)
if (f.importBtn && f.importFile) {
  f.importBtn.addEventListener('click', () => f.importFile.click());

  f.importFile.addEventListener('change', async () => {
    const file = f.importFile.files && f.importFile.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const obj = JSON.parse(text);

      // Support either raw config JSON OR wrapper { config: {...} }
      const cfg = (obj && typeof obj === 'object' && obj.config && typeof obj.config === 'object')
        ? obj.config
        : obj;

      if (typeof applyConfigToUI !== 'function') {
        throw new Error('applyConfigToUI not found');
      }

      applyConfigToUI(cfg);
      hide(); // close save dialog after import
    } catch (e) {
      alert('Import failed. Select a valid .json config file.');
      console.error(e);
    } finally {
      f.importFile.value = '';
    }
  });
}


      // Rename 'Save As' button to 'Create New'
      const saveAsBtn = el('btnMetaSaveAs');
      if (saveAsBtn) { saveAsBtn.textContent = 'Create New'; if ('value' in saveAsBtn) saveAsBtn.value = 'Create New'; }


      function show(){ overlay.removeAttribute('hidden'); }
      function hide(){ overlay.setAttribute('hidden',''); if (err){err.textContent=''; err.setAttribute('hidden','');} }

window.launchSaveDialog = function(isSaveAs=false){
  // Always (re)seed the modal from the CURRENT open config
  const cfg = (typeof currentConfig === 'object' && currentConfig) ? currentConfig : null;
  const m   = cfg?.meta || {};

  // Prefer saved meta for the open config; otherwise fall back to current UI inputs; otherwise blank.
  const hub = (m.hubMode || hubMode?.value || 'lite').toString().toLowerCase();
  const sp  = (m.nozzleSpacing != null ? +m.nozzleSpacing : (+iSpace?.value || 20));
  const tn  = +iTotal?.value || 0;

  const guessFt  = (tn && sp) ? (tn * sp / 12) : '';
  const widthVal = (m.width != null && m.width !== '') ? m.width : guessFt;
  const unitVal  = (m.widthUnit || 'ft');

  // These 4 were persisting across saves — always reset them from the current open config
  if (f.make)  f.make.value  = m.make || '';
  if (f.model) f.model.value = m.model || '';
  if (f.type)  f.type.value  = m.boomType || '';
  if (f.var)   f.var.value   = (m.variant != null ? m.variant : '');

  if (f.hub)   f.hub.value   = hub;
  if (f.spac)  f.spac.value  = (isFinite(sp) ? sp : '');
  if (f.unit)  f.unit.value  = unitVal;
  if (f.width) f.width.value = widthVal;

  const lastAlso = JSON.parse(localStorage.getItem('boomcfg.alsoSubmit.default') || 'true');
  if (f.also) f.also.checked = !!lastAlso;

  overlay.dataset.saveAs = isSaveAs ? '1' : '';
  show();
};


      async function handleMetaSubmit(forceNewId){
        const meta = {
          make:f.make?.value?.trim(), model:f.model?.value?.trim(), boomType:f.type?.value?.trim(),
          width:f.width?.value, widthUnit:f.unit?.value,
          spacing:f.spac?.value, hubMode:f.hub?.value,
          variant:f.var?.value?.trim()
        };
        const missing=[]; if(!meta.make)missing.push('Make'); if(!meta.model)missing.push('Model'); if(!meta.boomType)missing.push('Boom Type');
        if(!meta.width)missing.push('Boom Width'); if(!meta.spacing)missing.push('Nozzle Spacing'); if(!meta.hubMode)missing.push('Hub Mode');
        if (missing.length){ if (err){ err.textContent='Missing: '+missing.join(', '); err.removeAttribute('hidden'); } return; }

        const cfg = serializeCurrentToConfig(meta, forceNewId);
        if (iConfigName) iConfigName.value = cfg.name;
// Save (overwrite) is ONLY allowed for Draft "My Configs".
// Factory, Submitted, or Approved must create a new Draft instead.
if (!forceNewId) {
  const curStatus = (currentConfig?.metadata?.status || '').toUpperCase();
  const isDraft = (curStatus === 'DRAFT' || curStatus === '');
  if (window.__currentIsFactory || !isDraft) {
    forceNewId = true;
    // Rebuild cfg as a new draft ID + name
    const cfg2 = serializeCurrentToConfig(meta, true);
    if (iConfigName) iConfigName.value = cfg2.name;
    // swap in the new object for the rest of this function
    cfg.id = cfg2.id;
    cfg.name = cfg2.name;
    cfg.meta = cfg2.meta;
  }
}

        // ---- Step 3a: Save + Approval wiring ----

        // Ensure metadata exists and set default scope/status
        if (!cfg.metadata) cfg.metadata = {};
        cfg.metadata.scope  = 'MY_CONFIG';
cfg.metadata.status = 'DRAFT';

        // 1) Save to "My Configs"
        const mine = readMy();
		// Prevent name collisions (hard block)
const newName = (cfg.name || '').trim().toLowerCase();
const collision = mine.some(x =>
  ((x.name || '').trim().toLowerCase() === newName) && (x.id !== cfg.id)
);
if (collision) {
  if (err) {
    err.textContent = 'Name already exists. Choose a different name.';
    err.removeAttribute('hidden');
  }
  return;
}

        const ix = mine.findIndex(x => x.id === cfg.id);
        if (ix >= 0) {
          mine[ix] = cfg;
        } else {
          mine.push(cfg);
        }
        writeMy(mine);

// 2) Options: Save / Download / Request Approval
const optSave = !!f.optSave?.checked;
const optDl = !!f.optDl?.checked;
const optReq = !!f.optReq?.checked;

if (!optSave && !optDl && !optReq) {
  if (err) {
    err.textContent = 'Select at least one option: Save, Download, or Request Approval.';
    err.removeAttribute('hidden');
  }
  return;
}

// Save locally only if selected
if (!optSave) {
  // Remove the just-saved local write by reverting mine[] update above:
  // simplest surgical approach: DO NOT writeMy() unless optSave is true.
  // (See note below: we’ll adjust writeMy() call position.)
}

// Build submission payload only if needed (download or request)
let submission = null;
if (optDl || optReq) {
  submission = {
    id: 'sub_' + uid(),
    createdAt: new Date().toISOString(),
    status: 'SUBMITTED',
    submitter: {
      firstName: (f.fn?.value || '').trim(),
      lastName: (f.ln?.value || '').trim(),
      email: (f.email?.value || '').trim()
    },
    configId: cfg.id,
    configName: cfg.name,
    metadata: cfg.metadata,
    config: cfg
  };
}

// Download option (external users)
if (optDl) {
  const blob = new Blob([JSON.stringify(submission, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const __safe =
    (String(cfg.name || '')
      .replace(/[\\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80)) || 'config';
  a.download = `config_request_${__safe}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
        // Auto-download config JSON on Save/Create (MVP)
        (function () {
          const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          const __safe = (((cfg.name || 'config') + '')
            .replace(/[\\\/:*?"<>|]+/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80)) || 'config';
          a.download = `${__safe}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        })();

        hide();

        // toast
        const t=document.createElement('div'); t.textContent='Saved locally' + (queued ? ' • Submission queued' : '');
        Object.assign(t.style,{position:'fixed',bottom:'16px',right:'16px',background:'#0b2b4c',color:'#fff',padding:'10px 12px',borderRadius:'8px',zIndex:2000});
        document.body.appendChild(t); setTimeout(()=>t.remove(),1500);
      }

      el('btnMetaSave')?.addEventListener('click', ()=> handleMetaSubmit(false));
      el('btnMetaSaveAs')?.addEventListener('click', ()=> handleMetaSubmit(true));
      el('btnMetaCancel')?.addEventListener('click', ()=> overlay.setAttribute('hidden',''));
      document.querySelector('[data-close="#saveMetaOverlay"]')?.addEventListener('click', ()=> overlay.setAttribute('hidden',''));
    }
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', initSaveDialog, {once:true}); else initSaveDialog();
  })();
// --- SHIM: applyConfigToUI (loads all 11 fields) ---
if (typeof window.applyConfigToUI !== 'function') {
  window.applyConfigToUI = function(cfg){
    try {
      const get = id => document.getElementById(id);
      const setIfNum = (id, v) => { if (isFinite(v)) { const el=get(id); if (el) el.value=Number(v); } };
      const set = (id, v) => { if (v!=null) { const el=get(id); if (el) el.value=v; } };

      const m  = cfg?.meta || {};
      const st = cfg?.structure || {};
      const fd = (st.folds && !Array.isArray(st.folds)) ? st.folds : {};
      const vcm = cfg?.vcm || {};

      // 1,2,7,8
      setIfNum('totalNozzles',  m.totalNozzles);
      setIfNum('nozzleSpacing', m.nozzleSpacing);
      set('hubMode',            m.hubMode || vcm.mode);
      setIfNum('gatewayMount',  st.gatewayMount);

      // 3–6 folds
      setIfNum('breakaway',  fd.breakaway);
      setIfNum('outerFold',  fd.outer);
      setIfNum('innerFold',  fd.inner);
      setIfNum('primaryFold',fd.primary);

      // rebuild VCM UI for the chosen hub
      if (typeof renderVCMInputs === 'function') {
        const hubEl = get('hubMode');
        renderVCMInputs(hubEl?.value || 'lite');
      }

      // 9 VCM ports (counts + shifts)
      if (typeof window.writeVCMs === 'function') {
        window.writeVCMs(vcm.data ? vcm : vcm);
      }

      // 10 extension lengths
      if (typeof window.writeExtensions === 'function') {
        const ov = (cfg && cfg.extensions && cfg.extensions.overrides)
                || (cfg && cfg.extensionOverrides)
                || (cfg && cfg.overrides)
                || null;
        window.writeExtensions(ov);
      }
// 11 five-foot drops
      if (typeof window.writeFiveDrops === 'function') {
        window.writeFiveDrops(cfg?.extensions?.fiveFootDrops);
      }

      // redraw
      if (typeof window.extOverrides?.size === 'number' && typeof scheduleDraw === 'function') {
        scheduleDraw();
      } else if (typeof scheduleDraw === 'function') {
        scheduleDraw();
      }
      if (typeof validateDropCount === 'function') validateDropCount();

      // Sync docs + install panels with this loaded config
      if (typeof window.setDocsConfig === 'function') {
        window.setDocsConfig(cfg);
      }

    } catch (e) { DERR?.(e, 'applyConfigToUI.shim'); }
  };
}

// Approval queue modal (local-only)
{
  const overlay = el('approvalOverlay'),
        listEl  = el('approvalList'),
        emptyEl = el('approvalEmpty');

  if (overlay && listEl) {
    const show = (node) => node && node.removeAttribute('hidden');
    const hide = (node) => node && node.setAttribute('hidden', '');

    const renderQueue = () => {
      const queue = readQueue();
      listEl.innerHTML = '';

      if (!queue.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';

      queue
        .slice()
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .forEach(sub => {
          const card = document.createElement('div');
          card.className = 'browse-card';

          const name = sub.configName || '(unnamed config)';
          const status = sub.status || 'SUBMITTED';
          const when = sub.createdAt
            ? new Date(sub.createdAt).toLocaleString()
            : 'unknown time';

          card.innerHTML = `
            <div>
              <div><strong>${name}</strong></div>
              <div style="font-size:12px; color:#475569;">Status: ${status}</div>
              <div style="font-size:12px; color:#64748b;">Submitted: ${when}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="btn" data-act="open"    data-id="${sub.id}">Open</button>
              <button class="btn" data-act="approve" data-id="${sub.id}">Approve</button>
              <button class="btn" data-act="reject"  data-id="${sub.id}">Reject</button>
              <button class="btn" data-act="delete"  data-id="${sub.id}">Delete</button>
            </div>
          `;
          listEl.appendChild(card);
        });
    };

    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const act = btn.getAttribute('data-act');
      const id  = btn.getAttribute('data-id');
      if (!id) return;

      let queue = readQueue();
      const idx = queue.findIndex(q => q.id === id);
      if (idx === -1) return;

      const sub = queue[idx];

      if (act === 'open') {
        if (sub.config && typeof window.applyConfigToUI === 'function') {
          window.applyConfigToUI(sub.config);
        }
        hide(overlay);
        return;
      }

if (act === 'approve') {
  const newStatus = 'APPROVED';
  sub.status = newStatus;
  sub.metadata = sub.metadata || {};
  sub.metadata.status = newStatus;

  // Mark config as factory preset + lock it
  if (sub.config) {
    sub.config.metadata = sub.config.metadata || {};
    sub.config.metadata.status = 'APPROVED';
    sub.config.metadata.scope = 'FACTORY_PRESET';

    // Load existing factory presets from localStorage
    let factoryList = [];
    try {
      factoryList = JSON.parse(localStorage.getItem('boomcfg.factoryPresets.v1') || '[]');
    } catch {}

    // Add this approved config as a new factory preset
    factoryList.push(sub.config);
    localStorage.setItem('boomcfg.factoryPresets.v1', JSON.stringify(factoryList));

    // Also update the in-memory FACTORY_PRESETS used by Browse modal
    window.FACTORY_PRESETS = factoryList;
  }

  queue[idx] = sub;
  writeQueue(queue);
  renderQueue();
  return;
}

if (act === 'reject') {
  const newStatus = 'REJECTED';
  sub.status = newStatus;
  sub.metadata = sub.metadata || {};
  sub.metadata.status = newStatus;

  if (sub.config && sub.config.metadata) {
    sub.config.metadata.status = newStatus;
  }

  queue[idx] = sub;
  writeQueue(queue);
  renderQueue();
  return;
}


      if (act === 'delete') {
        queue.splice(idx, 1);
        writeQueue(queue);
        renderQueue();
      }
    });

    el('approvalClose')?.addEventListener('click', () => hide(overlay));

    overlay
      .querySelectorAll('[data-close="#approvalOverlay"]')
      .forEach(btn => btn.addEventListener('click', () => hide(overlay)));

    el('btnApprovalQueue')?.addEventListener('click', () => {
      renderQueue();
      show(overlay);
    });
  }
}


// Browse modal (inline, no extra DOMContentLoaded)
{
    const overlay = el('browseOverlay'),
        listEl  = el('browseList'),
        srcSel  = el('browseSource'),
        searchEl= el('browseSearch');
  if (!overlay || !listEl) {
    // If the HTML for the browse modal isn't present, do nothing.
  } else {
    const show = el => el?.removeAttribute('hidden');
    const hide = el => el?.setAttribute('hidden','');

    el('browseClose')?.addEventListener('click', ()=> hide(overlay));
	    // --- Filters: source, search, refresh --- //

    // Change All / Factory / Mine
    if (srcSel) {
      srcSel.addEventListener('change', () => {
        try { renderBrowse(); } catch (e) { DERR(e, 'browse.srcChange'); }
      });
    }

    // Typing in search box
    if (searchEl) {
      const handleSearch = () => {
        try { renderBrowse(); } catch (e) { DERR(e, 'browse.search'); }
      };

      // Live search as you type
      searchEl.addEventListener('input', handleSearch);

      // Also trigger on Enter
      searchEl.addEventListener('keypress', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          handleSearch();
        }
      });
    }

    // Refresh button: reset to defaults and re-render
    const refreshBtn = el('browseRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        try {
          if (searchEl) searchEl.value = '';
          if (srcSel)   srcSel.value   = 'all';
          renderBrowse();
        } catch (e) {
          DERR(e, 'browse.refresh');
        }
      });
    }

	    // Top-right X (or any element) with data-close="#browseOverlay"
    overlay.querySelectorAll('[data-close="#browseOverlay"]').forEach(btn => {
      btn.addEventListener('click', () => hide(overlay));
    });

    // Legacy header button (safe even if not in DOM)
    document.getElementById('btnConfigs')?.addEventListener('click', ()=>{
      try { renderBrowse(); } catch(e){ DERR(e,'browse.render'); }
      show(overlay);
    });

    // NEW: dropdown arrow on config input
    document.getElementById('btnConfigDropdown')?.addEventListener('click', ()=>{
      try { renderBrowse(); } catch(e){ DERR(e,'browse.render'); }
      show(overlay);
    });


    function getFactory(){
      return Array.isArray(window.FACTORY_PRESETS) ? window.FACTORY_PRESETS : [];
    }


    function renderBrowse(){
      try {
        const q   = (searchEl?.value || '').trim().toLowerCase();
        const src = (srcSel?.value || 'all');
        let rows  = [];
        if (src === 'all' || src === 'factory') rows = rows.concat(getFactory().map(c => ({...c,_src:'factory'})));
        if (src === 'all' || src === 'mine')    rows = rows.concat(readMy().map(c => ({...c,_src:'mine'})));
        if (q) rows = rows.filter(r => (`${r.name||''} ${JSON.stringify(r.meta||{})}`).toLowerCase().includes(q));

        listEl.innerHTML = '';
        if (!rows.length){
          const empty = document.createElement('div');
          empty.textContent = 'No configurations found.';
          empty.style.padding = '12px';
          empty.style.color   = '#52606d';
          listEl.appendChild(empty);
          return;
        }

        rows.forEach(r=>{
          const card = document.createElement('div'); card.className = 'browse-card';

          const title = document.createElement('div'); title.className = 'browse-title';
          title.textContent = (r.name || '(unnamed)') + (r.meta && r.meta.totalNozzles ? ' — ' + r.meta.totalNozzles + ' nozzles' : '');
          const left = document.createElement('div'); left.append(title);

      const actions = document.createElement('div'); 
      actions.className = 'browse-actions';

      const badge = document.createElement('span');
      badge.className = 'badge ' + (r._src === 'factory' ? 'factory' : 'mine');
      badge.textContent = r._src === 'factory' ? 'Factory' : 'Mine';

      // Status badge (Draft / Submitted / Approved / Rejected)
      const status =
        (r.metadata && r.metadata.status) ||
        (r._src === 'factory' ? 'APPROVED' : 'DRAFT');

      const statusBadge = document.createElement('span');
      statusBadge.className = 'badge';
      statusBadge.textContent = status;

      const btnOpen = document.createElement('button'); 
      btnOpen.className = 'btn'; 
      btnOpen.textContent = 'Open';
      btnOpen.addEventListener('click', ()=>{
        try {
          // Sync visible config name + current id when opening
          const nameBox = document.getElementById('configName');
          if (nameBox && typeof r.name === 'string') {
            nameBox.value = r.name;
          }
          if (r.id) {
            window.__currentConfigId = r.id;
          }
          applyConfigToUI(r);
        } catch(e){ 
          DERR(e,'applyConfigToUI'); 
        }
        hide(overlay);
      });

      actions.append(badge, statusBadge, btnOpen);
      // Allow cloning factory presets into My Configs
      if (r._src === 'factory') {
        const btnClone = document.createElement('button');
        btnClone.className = 'btn';
        btnClone.textContent = 'Clone';
        btnClone.style.marginLeft = '6px';
        btnClone.addEventListener('click', () => {
          try {
            // Deep copy without the internal _src marker
            const clone = JSON.parse(JSON.stringify(r));
            delete clone._src;

            // New id + name
            clone.id = uid();
            clone.name = (r.name || '(unnamed)') + ' (Copy)';

            // Ensure docs/metadata fields exist and mark as MY_CONFIG/DRAFT
            const cfg = ensureDocsFieldsOnConfig(clone);
            if (!cfg.metadata) cfg.metadata = {};
            cfg.metadata.scope = 'MY_CONFIG';
            cfg.metadata.status = 'DRAFT';

            // Save into My Configs
            const mine = readMy() || [];
            mine.push(cfg);
			writeMy(mine);

            // Make this the active config
            window.__currentConfigId = cfg.id;
            const nameBox = document.getElementById('configName');
            if (nameBox) nameBox.value = cfg.name || '';

            applyConfigToUI(cfg);
            hide(overlay);
            renderBrowse();
          } catch (e) {
            DERR(e, 'cloneFactoryConfig');
          }
        });
        actions.append(btnClone);
      }


          // Only "My Configs" (mine) get a Delete button
          if (r._src === 'mine') {
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn';
            btnDelete.textContent = 'Delete';
            btnDelete.style.marginLeft = '6px';
            btnDelete.addEventListener('click', ()=>{
              if (!confirm('Delete this configuration?')) return;
              try {
                const current = readMy() || [];
                const filtered = current.filter(c => c.id !== r.id);
                writeMy(filtered);

                // If the deleted config is currently active, clear the id
                if (window.__currentConfigId === r.id) {
                  window.__currentConfigId = null;
                }

                // Re-render the list after deletion
                renderBrowse();
              } catch(e){
                DERR(e, 'deleteConfig');
              }
            });
            actions.append(btnDelete);
          }

          const row = document.createElement('div'); 
          row.className = 'browse-row';

          row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center';
          row.append(left, actions);
          card.append(row);
          listEl.append(card);
        });
      } catch(e){
        DERR(e,'browse.render.outer');
        listEl.innerHTML = '<div style="padding:12px;color:#c00;">Failed to render configurations. See debug console (F9).</div>';
      }
	  // --- writeVCMs: apply counts + shifts into the UI (supports lite/standard) ---
window.writeVCMs = function writeVCMs(v){
  try{
    // Expect either { mode, data } (preferred) or flat map like { "1-1":12, "2-1":6 } or {"1-1":{nozzles,shift}}
    const applyPair = (p, seq, count, shift=0) => {
      const inp  = document.querySelector(`#vcmFields input[data-port="${p}"][data-vcm="${seq}"]`);
      const flag = document.querySelector(`#vcmFields .shift-flag[data-port="${p}"][data-vcm="${seq}"]`);
      if (inp)  inp.value = isFinite(count) ? Number(count) : 0;
      if (flag) {
        flag.textContent = String(isFinite(shift) ? Number(shift) : 0);
        flag.style.display = (shift ? 'inline' : 'none');
      }
      if (typeof updateShiftDisplay === 'function') {
        const cell = document.querySelector(
          `#vcmFields .vcm-cell[data-port="${p}"][data-vcm="${seq}"]`
        );
        if (cell) updateShiftDisplay(cell, isFinite(shift) ? Number(shift) : 0);
      }
    };

    if (v && v.data) {
      Object.entries(v.data).forEach(([p,obj])=>{
        [1,2,3].forEach(seq=>{
          const node = obj['v'+seq] || {};
          applyPair(p, seq, node.nozzles, node.shift);
        });
      });
      return;
    }

    // flat map fallback
    Object.entries(v||{}).forEach(([k,val])=>{
      const m = String(k).match(/^(\d+)[-:_](\d+)$/);
      if (!m) return;
      const p=m[1], seq=m[2];
      if (val && typeof val === 'object') applyPair(p, seq, val.nozzles ?? val.count ?? 0, val.shift ?? 0);
      else applyPair(p, seq, val ?? 0, 0);
    });
  }catch(e){ DERR?.(e,'writeVCMs'); }
};

// --- writeExtensions: { extId:string -> lengthFt:number } (preserve string keys)
window.writeExtensions = function writeExtensions(overrides){
  try{
    // Always operate on the shared Map
    const map = (window.extOverrides instanceof Map) ? window.extOverrides : extOverrides;
    window.extOverrides = map;
    // Always clear previous values, even if input is null/undefined
    map.clear();
    if (overrides && typeof overrides === 'object') {
      for (const [k, v] of Object.entries(overrides)) {
        const ft = Number(v);
        if (Number.isFinite(ft) && ft > 0) map.set(String(k), Math.round(ft));
      }
    }
    if (typeof scheduleDraw === 'function') scheduleDraw();
  } catch (e) { DERR?.(e, 'writeExtensions'); }
};


// --- writeFiveDrops: apply 5' drop flags from [nozzleIndex] list (no UI IDs assumed) ---
window.writeFiveDrops = function writeFiveDrops(list){
  try{
    if (!Array.isArray(list)) return;
    // Hook 1 (preferred): project function if you already have one
    if (typeof window.applyFiveFootDrops === 'function') { window.applyFiveFootDrops(list); return; }
    // Hook 2: generic data attribute approach (if you have per-nozzle UI cells)
    list.forEach(idx=>{
      const el = document.querySelector(`[data-nozzle="${idx}"]`);
      if (el) el.dataset.drop5 = '1';
    });
  }catch(e){ DERR?.(e,'writeFiveDrops'); }
};

    }
  }
}


  // Global Save shortcut + header buttons
  document.addEventListener('keydown', (e) => {
    const key=e.key?.toLowerCase();
    if ((e.ctrlKey||e.metaKey) && key==='s') {
      e.preventDefault(); e.stopPropagation();
      if (typeof window.launchSaveDialog==='function') window.launchSaveDialog(!!e.shiftKey);
    }
  });
  el('btnSave')?.addEventListener('click', ()=> {
  if (typeof window.launchSaveDialog==='function') {
    const b = document.getElementById('btnSave');
    const forceSaveAs = !!(b && b.dataset && b.dataset.factorySaveAs==='1');
    window.launchSaveDialog(forceSaveAs);
  }
});

  el('btnPng')?.addEventListener('click', exportPNG);
  el('btnPartsCsv')?.addEventListener('click', exportPartsCsv);

  // Input events
  hubMode?.addEventListener('change', ()=>{ DBG('hubMode change →', hubMode.value); 
  renderVCMInputs(hubMode.value); 
  applyInitialVCMDefaults(); 
  extOverrides.clear(); 
  scheduleDraw(); 
  validateDropCount();
  });
  [iTotal,iSpace,iBreak,iOuter,iInner,iPrim,iGate].forEach(inp=>{
    if (!inp) return;
    inp.addEventListener('input', ()=>{ scheduleDraw(); validateDropCount(); });
  });
  iConfigName?.addEventListener('input', ()=> updateBoomMeta(lastBoomState||buildBoom()));
  btnReset?.addEventListener('click', ()=>{ DBG('RESET clicked'); Object.entries(DEFAULTS).forEach(([k,v])=>{ const d=el(k); if (d) d.value=v; }); extOverrides.clear(); renderVCMInputs(hubMode.value||'lite'); zeroAllPorts(); scheduleDraw(); validateDropCount(); });

  // Boot
  bootstrapFactoryPresets();
  refreshFactoryPresetsFromGitHub();
  renderVCMInputs(hubMode.value || 'lite');
  applyInitialVCMDefaults();
  scheduleDraw();
  validateDropCount();

  // Expose for console
  window.__boomcfg__ = { readMy:()=>JSON.parse(localStorage.getItem('boomcfg.myConfigs.v1')||'[]') };
});

