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

    extensions: {
      overrides: {},
      fiveFootDrops: [],
      dropExt5ftQty: 0
    },

    harnesses: {
      version: 1,
      recipes: {},
      overrides: {},
      extOverrides: {},
      autoSpacingIn: null,
      autoMode: "auto"
    },


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

  // Shallow merge top-level overrides last, with deep merge for persisted state buckets
  return {
    ...base,
    ...overrides,
    machine: { ...base.machine, ...(overrides.machine || {}) },
    extensions: { ...base.extensions, ...(overrides.extensions || {}) },
    harnesses: { ...base.harnesses, ...(overrides.harnesses || {}) },
    installSteps: { ...base.installSteps, ...(overrides.installSteps || {}) },
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
const LS_CURRENT = 'boomcfg.currentConfig.v1';
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

function compareSemverStrings(a, b) {
  const pa = String(a || '').split('.').map(x => parseInt(x, 10) || 0);
  const pb = String(b || '').split('.').map(x => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

// LEGACY PROFILE DETECTION
// This must run against the RAW loaded config before normalization.
// normalizeConfig() fills missing schema buckets (including harnesses.version = 1),
// which would otherwise make older files look modern.
// __legacyImported is the persisted marker that survives normalization and forces
// true legacy rendering behavior on old approved JSON profiles.
function isLegacyHarnessProfile(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;

  // Explicit marker set during load BEFORE normalization.
  if (cfg.__legacyImported === true) return true;

  const hasHarnessVersion = !!(cfg.harnesses && Number(cfg.harnesses.version) >= 1);

  // True legacy files had no harness schema at all.
  if (!hasHarnessVersion) return true;

  const ver = String(cfg.version || '');
  if (!ver) return false;

  return compareSemverStrings(ver, '3.8.0') < 0;
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

// CONFIG MODE ACTIVATION
// This is the single place where load-time rendering mode is established.
// It sets:
//   __currentIsFactory   -> read-only factory behavior
//   __legacyHarnessMode  -> old JSON render behavior
// applyConfigToUI() must call this BEFORE scheduleDraw(), or the boom will render
// once in the wrong mode on load.
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

  window.__legacyHarnessMode = isLegacyHarnessProfile(cfg);

  renderRelatedDocsPanel();
  renderInstallPanelFromConfig();
  applyFactoryLocking();

  if (typeof window.syncAutoFitStateFromLoadedConfig === 'function') {
    window.syncAutoFitStateFromLoadedConfig();
  }
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

  // Lock AutoFit + Ignore Breakaway in factory mode
  const btnAuto = document.getElementById('btnAutoFit');
  if (btnAuto) {
    btnAuto.disabled = isFactory;

    if (isFactory) {
      btnAuto.classList.remove('autofit-needs', 'autofit-auto', 'autofit-manual');
      btnAuto.classList.add('autofit-factory');
      btnAuto.textContent = 'Factory Approved';
    } else {
      btnAuto.classList.remove('autofit-factory');
    }
  }

  const ignoreBreakaway = document.getElementById('ignoreBreakaway');
  if (ignoreBreakaway) ignoreBreakaway.disabled = isFactory;

  // Lock on-boom clickable labels too (they are not native form controls)
  document.querySelectorAll('.harness-label, .ext-label').forEach(el => {
    el.style.pointerEvents = isFactory ? 'none' : '';
    el.style.cursor = isFactory ? 'default' : 'pointer';
    el.title = isFactory
      ? 'Factory configuration is read-only. Clone to edit.'
      : (el.classList.contains('harness-label')
          ? 'Click to override harness'
          : 'Click to override VCM extension');

    if (isFactory) {
      el.style.background = '#fff';
      el.style.borderColor = '#777';
      el.style.color = '#111';
    }
  });

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
  const iHub   = document.getElementById("hubMode");

  function readInstallVCMsFromUI() {
    const mode = String(iHub?.value || vcm.mode || "lite").toLowerCase();
    const max = mode === "lite" ? 4 : 8;
    const data = {};
    let any = false;

    for (let p = 1; p <= max; p++) {
      data[p] = { v1: { nozzles: 0, shift: 0 }, v2: { nozzles: 0, shift: 0 }, v3: { nozzles: 0, shift: 0 } };

      [1, 2, 3].forEach(seq => {
        const inp = document.querySelector(`#vcmFields input[data-port="${p}"][data-vcm="${seq}"]`);
        const sh  = document.querySelector(`#vcmFields .shift-flag[data-port="${p}"][data-vcm="${seq}"]`);

        const nozzles = Number(inp?.value || 0) || 0;
        const shift = Number(sh?.textContent || 0) || 0;

        data[p]["v" + seq] = { nozzles, shift };
        if (nozzles > 0) any = true;
      });
    }

    return any ? { mode, data } : (currentConfig.vcm || { mode, data: {} });
  }

  const liveVcm = readInstallVCMsFromUI();

  const totalNozzles = Number(iTotal?.value ?? meta.totalNozzles ?? 0) || 0;
  const spacingIn    = Number(iSpace?.value ?? meta.nozzleSpacing ?? 0) || 0;
  const hubModeVal   = String(liveVcm.mode || iHub?.value || meta.hubMode || vcm.mode || "").toLowerCase() || "standard";
  const gatewayMount = Number(iGate?.value ?? structure.gatewayMount ?? 0) || 0;

  const breakaway   = Number(document.getElementById("breakaway")?.value ?? foldsObj.breakaway ?? 0) || 0;
  const outerFold   = Number(document.getElementById("outerFold")?.value ?? foldsObj.outer ?? 0) || 0;
  const innerFold   = Number(document.getElementById("innerFold")?.value ?? foldsObj.inner ?? 0) || 0;
  const primaryFold = Number(document.getElementById("primaryFold")?.value ?? foldsObj.primary ?? 0) || 0;

  if (!totalNozzles || !spacingIn) {
    alert("Install instructions require Total Nozzles and Nozzle Spacing.");
    return;
  }

  // hub nozzle position (matches drawing logic)
  const hubNozzle = gatewayMount > 0 ? gatewayMount : (totalNozzles / 2 + 0.5);
  
    function decodeInstallHarnessSplit(nozzleCount, shiftValue, onLeftSide) {
    const size = Number(nozzleCount) || 0;
    const shift = Number(shiftValue) || 0;

    if (size <= 0) return { leftCount: 0, rightCount: 0 };

    // Legacy visual compatibility
    if (window.__legacyHarnessMode) {
      if (size <= 6) {
        return onLeftSide
          ? { leftCount: size, rightCount: 0 }
          : { leftCount: 0, rightCount: size };
      }

      return onLeftSide
        ? { leftCount: 6, rightCount: size - 6 }
        : { leftCount: size - 6, rightCount: 6 };
    }

    // single-sided
    if (size <= 6) {
      if (shift < 0) return { leftCount: size, rightCount: 0 };
      if (shift > 0) return { leftCount: 0, rightCount: size };

      return onLeftSide
        ? { leftCount: size, rightCount: 0 }
        : { leftCount: 0, rightCount: size };
    }

    // full VCM
    if (size === 12) return { leftCount: 6, rightCount: 6 };

    if (shift !== 0) {
      const leftCount = Math.round((size + shift) / 2);
      const rightCount = size - leftCount;

      if (
        leftCount >= 0 && rightCount >= 0 &&
        leftCount <= 6 && rightCount <= 6 &&
        leftCount + rightCount === size
      ) {
        return { leftCount, rightCount };
      }
    }

    return { leftCount: 6, rightCount: size - 6 };
  }

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

  const extOverrides =
    (window.extOverrides instanceof Map)
      ? new Map(window.extOverrides)
      : new Map(
          Object.entries((currentConfig.extensions && currentConfig.extensions.overrides) || {})
        );

  // Use the same resolved VCM state as the boom drawing
  const renderedBoomState = window.__lastBoomState;
  const renderedVCMGroups = window.__lastVCMModel;

  if (!renderedBoomState || !Array.isArray(renderedVCMGroups)) {
    alert("Boom must be rendered before generating install instructions.");
    return;
  }

  const installNozzleToX = (no, offsetX) => offsetX + (no - 0.5) * 26;

  const model = renderedVCMGroups
    .flatMap(group => (group || []).map(v => ({
      ...v,
      label: `${v.port}-${v.seq}`,
      x: installNozzleToX(v.mountNozzle, renderedBoomState.offsetX)
    })));

  const vcmOrdered = model
    .slice()
    .sort((a, b) => (a.mountNozzle - b.mountNozzle));

  // VCM Map rows + dust plugs (6-drop harness only; locked)
  const harnessCount = (n) => (n <= 6 ? 1 : 2);
  const harnessCapacity = (n) => (harnessCount(n) * 6);
  const dustPlugs = (n) => Math.max(0, harnessCapacity(n) - n);
  
  // Build rendered port chains exactly from the drawn VCM positions
  const portChains = {};
  const EPS = 0.001;

  model.forEach(v => {
    if (!portChains[v.port]) portChains[v.port] = { left: [], right: [] };

    if (v.x > renderedBoomState.hubX + EPS) {
      portChains[v.port].right.push(v);
    } else {
      // centerline VCMs belong to the left chain, same as drawVCMs()
      portChains[v.port].left.push(v);
    }
  });

  Object.values(portChains).forEach(chains => {
    chains.left.sort((a, b) => b.x - a.x);   // nearest hub -> outward on left
    chains.right.sort((a, b) => a.x - b.x);  // nearest hub -> outward on right
  });

  const terminatorSet = new Set();
  Object.values(portChains).forEach(chains => {
    if (chains.left.length) {
      terminatorSet.add(chains.left[chains.left.length - 1].label);
    }
    if (chains.right.length) {
      terminatorSet.add(chains.right[chains.right.length - 1].label);
    }
  });


  const harnessTypeNames = {
    '6D': '6 Drop Nozzle Harness',
    '2+4G': '2 Drop, Fold Gap, 4 Drop Harness',
    '3+3G': '3 Drop, Fold Gap, 3 Drop Harness',
    '4+2G': '4 Drop, Fold Gap, 2 Drop Harness'
  };

  const harnessRecipes = (currentConfig?.harnesses?.recipes && typeof currentConfig.harnesses.recipes === 'object')
    ? currentConfig.harnesses.recipes
    : {};

  function buildInstallHarnessName(recipe) {
    if (!recipe) return 'Not Used';
    const type = String(recipe.harnessType || '').trim();
    return harnessTypeNames[type] || 'Not Used';
  }

  function buildSideValveRange(v, sideName) {
    const sideCount = sideName === 'left'
      ? Number(v.leftCount || 0)
      : Number(v.rightCount || 0);

    if (sideCount <= 0) return '—';

    if (sideName === 'left') {
      const end = v.nozzleStart + sideCount - 1;
      return `${v.nozzleStart}–${end}`;
    }

    const start = v.nozzleEnd - sideCount + 1;
    return `${start}–${v.nozzleEnd}`;
  }

  function buildSideRow(v, sideName) {
    const sideCount = sideName === 'left'
      ? Number(v.leftCount || 0)
      : Number(v.rightCount || 0);

    if (sideCount <= 0) return '';

    const recipeKey = `vcm${v.port}_${v.seq}_${sideName}`;
    const recipe = harnessRecipes[recipeKey] || null;
    const harnessName = buildInstallHarnessName(recipe);
    const extQty = Number(recipe?.extensionQty || 0);
    const plugs = Math.max(0, 6 - sideCount);
        const leftUsed = Number(v.leftCount || 0) > 0;
    const rightUsed = Number(v.rightCount || 0) > 0;

    const showTerminator =
      terminatorSet.has(v.label) &&
      (
        (sideName === 'left' && leftUsed) ||
        (sideName === 'right' && !leftUsed && rightUsed)
      );

    const terminator = showTerminator ? 'Terminate VCM' : '';

    return `
      <tr>
        <td><strong>${v.label}</strong></td>
        <td>${v.port}</td>
        <td>${sideName === 'left' ? 'Left' : 'Right'}</td>
        <td>${buildSideValveRange(v, sideName)}</td>
        <td>${harnessName}</td>
        <td>${extQty}</td>
        <td>${plugs}</td>
        <td>${terminator}</td>
      </tr>
    `;
  }

  const legacyVcmMapRows = vcmOrdered.map(v => {
    const h = harnessCount(v.nozzleCount);
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

const currentVcmMapRows = vcmOrdered
  .filter(v => Number(v.leftCount || 0) > 0 || Number(v.rightCount || 0) > 0)
  .map(v => {
    return buildSideRow(v, 'left') + buildSideRow(v, 'right');
  })
  .join("");

  const vcmMapRows = window.__legacyHarnessMode ? legacyVcmMapRows : currentVcmMapRows;

  const sectionVcmMap = window.__legacyHarnessMode ? `
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
        ${vcmMapRows || `<tr><td colspan="7">No VCMs defined.</td></tr>`}
      </tbody>
    </table>
    <ul>
      <li><strong>Mounting:</strong> Mount each VCM at the labeled position shown in the Boom Graphic.</li>
      <li><strong>Nozzle Drop Harness Installation Rules:</strong> If a nozzle drop harness runs to the left of a VCM mounting position, plug it into the VCM 12-pin connector labeled <strong>Left 1-6</strong>. If it runs to the right of a VCM mounting position, plug it into the VCM 12-pin connector labeled <strong>Right 7-12</strong>.</li>
      <li><strong>Nozzle Drop Harnesses Note:</strong> During installation of nozzle drop harnesses, drops may be skipped to go around obstacles and fold joints.</li>
      <li><strong>Dust plugs:</strong> Install 2-pin Weatherpack dust plugs on all nozzle harness drops not plugged into a valve (see Dust Plugs column).</li>
    </ul>
  ` : `
    <h2>Section 2 – VCM Map (Mount + Harness Installation)</h2>
    <p>Mount each VCM at the labeled position shown in the Boom Graphic.</p>
    <table class="install-table">
      <thead>
        <tr>
          <th>VCM</th>
          <th>Port</th>
          <th>Side</th>
          <th>Valve Range</th>
          <th>Harness Type</th>
          <th>5' Extensions</th>
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
      <li><strong>5' Nozzle Extensions:</strong> Install 5' nozzle extensions at the outer end of the harness where specified.</li>
      <li><strong>Dust plugs:</strong> Install 2-pin Weatherpack dust plugs on all unused or unplugged nozzle harness drops (see Dust Plugs column).</li>
    </ul>
  `;

  // Extension table (From → To → Length), still presented Left→Right by midpoint nozzle
// Extension table uses the exact extension edges rendered on the boom graphic.
// This avoids duplicate extension math and guarantees Section 3 matches the drawing.
const extEdges = Array.isArray(window.__lastExtensionEdges)
  ? window.__lastExtensionEdges.slice()
  : [];

  extEdges.sort((a, b) => (a.mid - b.mid));

  const extRows = extEdges.map(e => `
    <tr>
      <td>${e.fromLabel}</td>
      <td>${e.toLabel}</td>
      <td><strong>${e.feet}'</strong></td>
    </tr>
  `).join("");

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
  let iSpace = el('nozzleSpacing');
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
  window.extOverrides = extOverrides;  // same Map used by label-click overrides + save/export
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

  const SUPPORTED_NOZZLE_SPACINGS = [2, 4, 10, 15, 20, 30];
  const AUTOFIT_NOZZLE_SPACINGS = new Set([10, 15, 20]);

  function upgradeNozzleSpacingToSelect() {
    if (!iSpace) return;
    if ((iSpace.tagName || '').toUpperCase() === 'SELECT') return;

    const sel = document.createElement('select');
    sel.id = iSpace.id;
    sel.name = iSpace.name || '';
sel.className = iSpace.className || '';
sel.style.cssText = iSpace.style.cssText || '';
sel.style.height = '28px';
sel.style.width = '80px';
    if (iSpace.getAttribute('title')) sel.setAttribute('title', iSpace.getAttribute('title'));
    if (iSpace.getAttribute('aria-label')) sel.setAttribute('aria-label', iSpace.getAttribute('aria-label'));

    sel.innerHTML = SUPPORTED_NOZZLE_SPACINGS
      .map(v => `<option value="${v}">${v}</option>`)
      .join('');

    const current = Number(iSpace.value || 20);
    sel.value = SUPPORTED_NOZZLE_SPACINGS.includes(current) ? String(current) : '20';

    iSpace.parentNode.replaceChild(sel, iSpace);
    iSpace = sel;
  }

  upgradeNozzleSpacingToSelect();

  // ----- scheduling -----

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

  L.classList.remove('has-shift');
  R.classList.remove('has-shift');
  L.dataset.shift = "";
  R.dataset.shift = "";

  if (shiftVal > 0) {
    R.classList.add('has-shift');
    R.dataset.shift = String(shiftVal);
  } else if (shiftVal < 0) {
    L.classList.add('has-shift');
    L.dataset.shift = String(Math.abs(shiftVal));
  }
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
        clearHarnessOverrideState();
        extOverrides.clear();
        scheduleDraw(); validateDropCount(); markAutoFitDirty();
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
        clearHarnessOverrideState();
        extOverrides.clear();
        scheduleDraw(); markAutoFitDirty();
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

        const mid = (start + end) / 2;
        const xCenter = nozzleToX(mid, boomState.offsetX);
        const onLeft = xCenter < hubX;

        const split = decodeHarnessSplit(count, cfg.shift || 0, onLeft);

                // LEGACY MOUNT RULES
        // Old approved JSON profiles did NOT use modern split-based mounting.
        // Preserve original visual behavior:
        //   <=6 nozzles  -> one-sided mount toward hub
        //   >6 nozzles   -> centered mount
        // Modern profiles continue to use split-driven mounting.
		let mount;
        if (window.__legacyHarnessMode) {
          if (count <= 6) {
            mount = onLeft ? end : start;
          } else {
            mount = mid;
          }
        } else if (count <= 6) {
          mount = onLeft ? end : start;
        } else {
          mount = start + split.leftCount - 0.5;
        }

        portVCMs.push({
          port:p,
          seq:i+1,
          nozzleStart:start,
          nozzleEnd:end,
          nozzleCount:count,
          mountNozzle:mount,
          leftCount: split.leftCount,
          rightCount: split.rightCount
        });
        cursor = end + 1;
      }
      if (portVCMs.length) results.push(portVCMs);
    }
    return results;
  }

  // ----- VCM drawing -----
  function clearVCMs(){ vcmLayer.innerHTML = ''; }

  function drawVCMRect(x,label){
    const d=document.createElement('div');
    d.className='vcm';
    d.style.left=(x-13)+'px';
    d.style.top=(VCM_Y-7)+'px';
    d.textContent=label;
    vcmLayer.appendChild(d);
  }

  function getHarnessRecipeKey(v, sideName) {
    return `vcm${v.port}_${v.seq}_${sideName}`;
  }

  function getHarnessLabelRecipe(harnessState, v, sideName) {
    const key = getHarnessRecipeKey(v, sideName);
    return harnessState?.recipes?.[key] || null;
  }
  
    let harnessDialogState = null;
    let extensionDialogState = null;

  function ensureHarnessOverrideStore() {
    if (!currentConfig) currentConfig = createEmptyBoomConfig();
    if (!currentConfig.harnesses) {
      currentConfig.harnesses = {
        version: 1,
        recipes: {},
        overrides: {},
        extOverrides: {}
      };
    }
    if (!currentConfig.harnesses.overrides) currentConfig.harnesses.overrides = {};
    if (!currentConfig.harnesses.extOverrides) currentConfig.harnesses.extOverrides = {};
    if (currentConfig.harnesses.autoSpacingIn == null) currentConfig.harnesses.autoSpacingIn = null;
    if (!currentConfig.harnesses.autoMode) currentConfig.harnesses.autoMode = 'auto';
  }

  function ensureHarnessOverrideDialog() {
    let overlay = document.getElementById('harnessOverrideOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'harnessOverrideOverlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.25)';
    overlay.style.zIndex = '5000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    overlay.innerHTML = `
      <div id="harnessOverrideCard" style="width:360px; max-width:92vw; background:#fff; border:1px solid #aaa; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.25); padding:16px; font:13px Arial,sans-serif;">
        <div id="harnessOverrideTitle" style="font-size:16px; font-weight:700; margin-bottom:4px;"></div>
        <div id="harnessOverrideMeta" style="font-size:12px; color:#555; margin-bottom:14px;"></div>

        <div id="harnessOverrideDirection" style="font-size:12px; color:#444; margin-bottom:6px;"></div>

        <div id="harnessOverrideDirection" style="font-size:12px; color:#444; margin-bottom:6px;"></div>
        <div id="harnessOverrideDotPreview" style="font-size:12px; line-height:13px; letter-spacing:1.5px; text-align:center; margin-bottom:10px;"></div>

        <label style="display:block; margin-bottom:10px;">
          <div style="font-weight:600; margin-bottom:4px;">Harness Type</div>
          <select id="harnessOverrideType" style="width:100%; height:32px;"></select>
        </label>

        <label style="display:block; margin-bottom:10px;">
          <div style="font-weight:600; margin-bottom:4px;">Extension Quantity</div>
          <input id="harnessOverrideExtQty" type="number" min="0" step="1" style="width:100%; height:32px; box-sizing:border-box;" />
        </label>

        <div style="margin-bottom:14px;">
          <div style="font-weight:600; margin-bottom:4px;">Current Result</div>
          <div id="harnessOverrideSummary" style="padding:8px 10px; border:1px solid #ccc; border-radius:4px; background:#fafafa;"></div>
        </div>

        <div style="display:flex; justify-content:space-between; gap:8px;">
          <button id="harnessOverrideReset" type="button">Reset to Auto</button>
          <div style="display:flex; gap:8px;">
            <button id="harnessOverrideCancel" type="button">Cancel</button>
            <button id="harnessOverrideApply" type="button">Apply</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeHarnessOverrideDialog();
        return;
      }

      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.id === 'harnessOverrideCancel') {
        closeHarnessOverrideDialog();
        return;
      }

      if (btn.id === 'harnessOverrideReset') {
        if (!harnessDialogState) return;
        ensureHarnessOverrideStore();

        const key = harnessDialogState.key;
        delete currentConfig.harnesses.overrides[key];
        delete currentConfig.harnesses.extOverrides[key];

        closeHarnessOverrideDialog();
        scheduleDraw();
        setAutoFitState('manual');
        return;
      }

      if (btn.id === 'harnessOverrideApply') {
        if (!harnessDialogState) return;
        ensureHarnessOverrideStore();

        const key = harnessDialogState.key;
        const recipe = harnessDialogState.recipe;
        const typeEl = document.getElementById('harnessOverrideType');
        const extEl = document.getElementById('harnessOverrideExtQty');

      const chosenType = String(typeEl.value || '6D');
      const chosenExt = Math.max(0, Math.round(Number(extEl.value || 0)));

        const autoType = recipe.autoHarnessType || recipe.harnessType;
        const autoExt = Number(
          recipe.autoExtensionQty !== undefined
            ? recipe.autoExtensionQty
            : (recipe.extensionQty || 0)
        );

        if (chosenType === autoType) delete currentConfig.harnesses.overrides[key];
        else currentConfig.harnesses.overrides[key] = chosenType;

      if (chosenExt !== autoExt) {
        currentConfig.harnesses.extOverrides[key] = chosenExt;
      } else {
        delete currentConfig.harnesses.extOverrides[key];
      }

        closeHarnessOverrideDialog();
        scheduleDraw();
        setAutoFitState('manual');
        return;
      }
    });

    document.getElementById('harnessOverrideType').addEventListener('change', () => {
      refreshHarnessOverrideDialogSummary();
    });

    document.getElementById('harnessOverrideExtQty').addEventListener('input', () => {
      refreshHarnessOverrideDialogSummary();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        closeHarnessOverrideDialog();
      }
    });

    return overlay;
  }

  function closeHarnessOverrideDialog() {
    const overlay = document.getElementById('harnessOverrideOverlay');
    if (overlay) overlay.style.display = 'none';
    harnessDialogState = null;
  }

  function ensureExtensionOverrideDialog() {
    let overlay = document.getElementById('extensionOverrideOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'extensionOverrideOverlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.25)';
    overlay.style.zIndex = '5000';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    overlay.innerHTML = `
      <div style="width:360px; max-width:92vw; background:#fff; border:1px solid #aaa; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.25); padding:16px; font:13px Arial,sans-serif;">
        <div id="extensionOverrideTitle" style="font-size:16px; font-weight:700; margin-bottom:4px;">VCM Extension Length</div>
        <div id="extensionOverrideMeta" style="font-size:12px; color:#555; margin-bottom:14px;"></div>

        <label style="display:block; margin-bottom:12px;">
          <div style="font-weight:600; margin-bottom:4px;">Extension Length (ft)</div>
          <input id="extensionOverrideFeet" type="number" min="5" step="5" style="width:100%; height:32px; box-sizing:border-box;" />
        </label>

        <div style="margin-bottom:14px;">
          <div style="font-weight:600; margin-bottom:4px;">Auto Value</div>
          <div id="extensionOverrideAutoValue" style="padding:8px 10px; border:1px solid #ccc; border-radius:4px; background:#fafafa;"></div>
        </div>

        <div style="display:flex; justify-content:space-between; gap:8px;">
          <button id="extensionOverrideReset" type="button">Reset to Auto</button>
          <div style="display:flex; gap:8px;">
            <button id="extensionOverrideCancel" type="button">Cancel</button>
            <button id="extensionOverrideApply" type="button">Apply</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeExtensionOverrideDialog();
        return;
      }

      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.id === 'extensionOverrideCancel') {
        closeExtensionOverrideDialog();
        return;
      }

      if (btn.id === 'extensionOverrideReset') {
        if (!extensionDialogState) return;
        extOverrides.delete(extensionDialogState.id);
        closeExtensionOverrideDialog();
        scheduleDraw();
        setAutoFitState('manual');
        return;
      }

      if (btn.id === 'extensionOverrideApply') {
        if (!extensionDialogState) return;

        const feetEl = document.getElementById('extensionOverrideFeet');
        let val = Math.round(Number(feetEl.value || 0));
        if (!isFinite(val) || val <= 0) return;

        val = Math.max(5, Math.round(val / 5) * 5);

        if (val === extensionDialogState.autoFeet) {
          extOverrides.delete(extensionDialogState.id);
        } else {
          extOverrides.set(extensionDialogState.id, val);
        }

        closeExtensionOverrideDialog();
        scheduleDraw();
        setAutoFitState('manual');
        return;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        closeExtensionOverrideDialog();
      }
    });

    return overlay;
  }

  function openExtensionOverrideDialog(id, autoFeet, currentFeet) {
    if (window.__currentIsFactory) return;
    extensionDialogState = { id, autoFeet, currentFeet };

    const overlay = ensureExtensionOverrideDialog();
    const metaEl = document.getElementById('extensionOverrideMeta');
    const feetEl = document.getElementById('extensionOverrideFeet');
    const autoEl = document.getElementById('extensionOverrideAutoValue');

    metaEl.textContent = `Manual values must be entered in 5 ft increments.`;
    feetEl.value = currentFeet;
    autoEl.textContent = `${autoFeet}'`;

    overlay.style.display = 'flex';
  }

  function closeExtensionOverrideDialog() {
    const overlay = document.getElementById('extensionOverrideOverlay');
    if (overlay) overlay.style.display = 'none';
    extensionDialogState = null;
  }
  

  function refreshHarnessOverrideDialogSummary() {
    if (!harnessDialogState) return;

    const typeEl = document.getElementById('harnessOverrideType');
    const extEl = document.getElementById('harnessOverrideExtQty');
    const summaryEl = document.getElementById('harnessOverrideSummary');

    const chosenType = String(typeEl.value || '6D');
    const chosenExt = Math.max(0, Math.round(Number(extEl.value || 0)));

    extEl.disabled = false;
    summaryEl.textContent = buildHarnessLabel(chosenType, chosenExt);
  }

  function openHarnessOverrideDialog(v, sideName, boomState, harnessState) {
    if (window.__currentIsFactory) return;
    const recipe = getHarnessLabelRecipe(harnessState, v, sideName);
    if (!recipe) return;

    ensureHarnessOverrideStore();
    const overlay = ensureHarnessOverrideDialog();

    const key = getHarnessRecipeKey(v, sideName);
    const spacingIn = getEffectiveHarnessSpacingIn();
    const allowed = getAllowedHarnessTypes(spacingIn);

    harnessDialogState = {
      key,
      v,
      sideName,
      recipe
    };

    const titleEl = document.getElementById('harnessOverrideTitle');
    const metaEl = document.getElementById('harnessOverrideMeta');
    const dirEl = document.getElementById('harnessOverrideDirection');
    const typeEl = document.getElementById('harnessOverrideType');
    const extEl = document.getElementById('harnessOverrideExtQty');

    titleEl.textContent = `VCM ${v.port}-${v.seq} ${sideName.toUpperCase()} SIDE`;
    metaEl.textContent = `Auto recipe: ${recipe.autoLabel || recipe.label}`;

    if (dirEl) {
      dirEl.textContent = sideName === 'left'
        ? 'Harness runs from VCM to leftmost nozzle'
        : 'Harness runs from VCM to rightmost nozzle';
    }

const harnessTypeNames = {
  '6D': '6 Drop Nozzle Harness',
  '2+4G': '2 Drop, Fold Gap, 4 Drop Harness',
  '3+3G': '3 Drop, Fold Gap, 3 Drop Harness',
  '4+2G': '4 Drop, Fold Gap, 2 Drop Harness'
};

const harnessTypeDots = {
  '6D': '••••••',
  '2+4G': '••|••••',
  '3+3G': '•••|•••',
  '4+2G': '••••|••'
};

typeEl.innerHTML = '';
allowed.forEach(type => {
  const opt = document.createElement('option');
  opt.value = type;
  opt.textContent = `${harnessTypeNames[type] || type}   ${harnessTypeDots[type] || ''}`;
  typeEl.appendChild(opt);
});

    const currentType = recipe.harnessType || recipe.autoHarnessType || '6D';
    const currentExt = Number(recipe.extensionQty || 0);

    typeEl.value = allowed.includes(currentType) ? currentType : '6D';
    extEl.value = currentExt;

    refreshHarnessOverrideDialogSummary();
    overlay.style.display = 'flex';
  }

  function renderHarnessLabelForSide(v, sideName, boomState, harnessState) {
    const recipe = getHarnessLabelRecipe(harnessState, v, sideName);
    if (!recipe || !recipe.label) return;

    const sideCount = sideName === 'left'
      ? Number(v.leftCount || 0)
      : Number(v.rightCount || 0);

    if (sideCount <= 0) return;

    const vcmEdgeX = sideName === 'left' ? (v.x - 13) : (v.x + 13);
const harnessDockX = sideName === 'left'
  ? nozzleToX(v.nozzleStart, boomState.offsetX)
  : nozzleToX(v.nozzleEnd, boomState.offsetX);

const harnessDockY = VCM_Y - 10;

    const outerNozzle = sideName === 'left' ? v.nozzleStart : v.nozzleEnd;
    const outerNozzleX = nozzleToX(outerNozzle, boomState.offsetX);

    const labelCenterX = (vcmEdgeX + outerNozzleX) / 2;
    const labelY = VCM_Y;

    const lbl = document.createElement('div');
    lbl.className = 'harness-label';
    lbl.style.left = labelCenterX + 'px';
    lbl.style.top = labelY + 'px';
    lbl.style.position = 'absolute';
    lbl.style.transform = 'translate(-50%, -50%)';
    lbl.style.padding = '1px 6px';
    lbl.style.border = '1px solid #777';
    lbl.style.borderRadius = '4px';
    lbl.style.background = recipe.auto === false ? '#f59e0b' : '#fff';
    lbl.style.borderColor = recipe.auto === false ? '#b45309' : '#777';
    lbl.style.color = '#111';
    lbl.style.fontSize = '11px';
    lbl.style.fontWeight = '600';
    lbl.style.lineHeight = '14px';
    lbl.style.whiteSpace = 'nowrap';
    lbl.style.zIndex = '6';
    lbl.style.cursor = 'pointer';
    lbl.title = 'Click to override harness';

    const previewHtml = getHarnessLabelPreviewHtml(recipe, sideName);
    if (!previewHtml) return;

    lbl.style.whiteSpace = 'normal';
    lbl.style.lineHeight = '13px';
    lbl.style.padding = '2px 6px';
    lbl.innerHTML = previewHtml;

    lbl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.__currentIsFactory) return;
      if (window.__legacyHarnessMode) return;
      openHarnessOverrideDialog(v, sideName, boomState, harnessState);
    });
    vcmLayer.appendChild(lbl);

const harnessLineY = VCM_Y - 13;   // adjust only if needed later

const lblRect = lbl.getBoundingClientRect();
const layerRect = vcmLayer.getBoundingClientRect();
const labelTopY = lblRect.top - layerRect.top;

const leader = document.createElement('div');
leader.className = 'vline';
leader.style.left = labelCenterX + 'px';
leader.style.top = harnessLineY + 'px';
leader.style.height = Math.max(0, labelTopY - harnessLineY) + 'px';
leader.style.zIndex = '5';
vcmLayer.appendChild(leader);
  }

function drawDropLines(vcmX, vcm, boomState){
  const nozzleBottomY = BOOM_Y + 5 + 18;
  const harnessY = nozzleBottomY + 12;
  const vcmTopY = VCM_Y - 7;
  const bundleL = vcmX - 12;
  const bundleR = vcmX + 12;
  let usedL = false, usedR = false;

  for (let n = vcm.nozzleStart; n <= vcm.nozzleEnd; n++) {
    const nx = nozzleToX(n, boomState.offsetX);
    let targetX;

    if (vcm.nozzleCount <= 6) {
      targetX = (vcm.leftCount > 0) ? bundleL : bundleR;
    } else {
      const leftCount = Number(vcm.leftCount || 0);
      const goesLeft = (n - vcm.nozzleStart) < leftCount;
      targetX = goesLeft ? bundleL : bundleR;
    }

    const v1 = document.createElement('div');
    v1.className = 'vline';
    v1.style.left = nx + 'px';
    v1.style.top = nozzleBottomY + 'px';
    v1.style.height = (harnessY - nozzleBottomY) + 'px';
    vcmLayer.appendChild(v1);

    const h1 = document.createElement('div');
    h1.className = 'hline';
    h1.style.left = Math.min(nx, targetX) + 'px';
    h1.style.top = harnessY + 'px';
    h1.style.width = Math.abs(nx - targetX) + 'px';
    vcmLayer.appendChild(h1);

    if (targetX === bundleL) usedL = true;
    if (targetX === bundleR) usedR = true;
  }

  if (usedL) {
    const up = document.createElement('div');
    up.className = 'vline';
    up.style.left = bundleL + 'px';
    up.style.top = harnessY + 'px';
    up.style.height = (vcmTopY - harnessY) + 'px';
    vcmLayer.appendChild(up);
  }

  if (usedR) {
    const up = document.createElement('div');
    up.className = 'vline';
    up.style.left = bundleR + 'px';
    up.style.top = harnessY + 'px';
    up.style.height = (vcmTopY - harnessY) + 'px';
    vcmLayer.appendChild(up);
  }
}

// HARNESS LABEL RENDERING
// Legacy profiles intentionally render with NO on-boom harness labels.
// The old production configurator did not have the modern dot-matrix / per-side
// harness label system, and showing them on legacy JSON creates false modernized
// visuals. Modern profiles still render normal left/right harness labels.
function renderHarnessLabelsForVCM(v, boomState, harnessState) {
  if (window.__legacyHarnessMode) {
    return;
  }

  renderHarnessLabelForSide(v, 'left', boomState, harnessState);
  renderHarnessLabelForSide(v, 'right', boomState, harnessState);
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
    const autoFeet = calcExtensionFeet(fromNode,toNode,boomState);
	const isManual = extOverrides.has(id);
	let feet = isManual ? extOverrides.get(id) : autoFeet;
	feet = Math.max(1, Math.round(feet));
	EXT_COUNTS[feet]=(EXT_COUNTS[feet]||0)+1;

	if (!Array.isArray(window.__lastExtensionEdges)) {
	window.__lastExtensionEdges = [];
	}

window.__lastExtensionEdges.push({
  fromLabel: fromNode.type === 'hub'
    ? `Hub (Port ${toNode.ref?.port})`
    : `VCM ${fromNode.ref?.port}-${fromNode.ref?.seq}`,
  toLabel: toNode.type === 'hub'
    ? `Hub`
    : `VCM ${toNode.ref?.port}-${toNode.ref?.seq}`,
  feet,
  mid: (fromX + toX) / 2
});
    const midX=(ax+bx)/2, labelY=railY+5;
    const leader=document.createElement('div'); leader.className='vline'; leader.style.left=midX+'px'; leader.style.top=railY+'px'; leader.style.height=(labelY-railY-6)+'px'; vcmLayer.appendChild(leader);
    const lbl=document.createElement('div');
    lbl.className='ext-label';
    lbl.dataset.extId=id;
    lbl.dataset.autoFeet=String(autoFeet);
    lbl.dataset.currentFeet=String(feet);
    lbl.style.left=midX+'px';
    lbl.style.top=labelY+'px';
    lbl.textContent=feet+"'";
    if (isManual) {
      lbl.style.background = '#f59e0b';
      lbl.style.borderColor = '#b45309';
      lbl.style.color = '#111';
    }
    vcmLayer.appendChild(lbl);
  }

  function drawVCMs(boomState, vcmModel){
	EXT_COUNTS = Object.create(null);
	window.__lastExtensionEdges = [];
	clearVCMs();

    const harnessState = buildHarnessRecipes(boomState, vcmModel);

    const baseY = VCM_Y + 20, stepY = 22, hubX = boomState.hubX;
    const left = [], right = [];

    // Draw-once guard: a center-mounted VCM can appear in both chains,
    // but we must only draw its rectangle + nozzle drops once.
    const drawnVCMs = new Set(); // key = `${port}-${seq}`

    vcmModel.forEach(portVCMs => {
      const all = portVCMs
        .map(v => ({ ...v, x: nozzleToX(v.mountNozzle, boomState.offsetX) }));

const EPS = 0.001; // pixels; tiny on purpose

const leftList  = all.filter(v => v.x < hubX - EPS);
const rightList = all.filter(v => v.x > hubX + EPS);

// VCMs exactly (or extremely near) the hub line: assign to ONE side only
const centerList = all.filter(v => Math.abs(v.x - hubX) <= EPS);
if (centerList.length) leftList.push(...centerList);

      if (leftList.length) {
        const xs = leftList.map(v => v.x);
        left.push({
          side: 'L',
          list: leftList,
          minX: Math.min(...xs),
          maxX: Math.max(...xs)
        });
      }

      if (rightList.length) {
        const xs = rightList.map(v => v.x);
        right.push({
          side: 'R',
          list: rightList,
          minX: Math.min(...xs),
          maxX: Math.max(...xs)
        });
      }
    });

    // keep your existing stack ordering
    left.sort((a,b)=>a.minX-b.minX);
    right.sort((a,b)=>b.maxX-a.maxX);


    // LEFT
    left.forEach((p,i)=>{
      const railY = baseY + (left.length-1-i)*stepY;
            const list = p.list.slice().sort((a,b)=>b.x-a.x);

      list.forEach(v=>{
        v.usedL=false; v.usedR=false;

        const key = `${v.port}-${v.seq}`;
        if (!drawnVCMs.has(key)) {
          drawVCMRect(v.x, v.port+'-'+v.seq);
          drawDropLines(v.x, v, boomState);
          renderHarnessLabelsForVCM(v, boomState, harnessState);
          drawnVCMs.add(key);
        }
      });

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
            const list = p.list.slice().sort((a,b)=>a.x-b.x);

      list.forEach(v=>{
        v.usedL=false; v.usedR=false;

        const key = `${v.port}-${v.seq}`;
        if (!drawnVCMs.has(key)) {
          drawVCMRect(v.x, v.port+'-'+v.seq);
          drawDropLines(v.x, v, boomState);
          renderHarnessLabelsForVCM(v, boomState, harnessState);
          drawnVCMs.add(key);
        }
      });

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
    if (window.__currentIsFactory) return;

    const id = lbl.dataset.extId;
    const autoFeet = Math.max(5, Math.round(Number(lbl.dataset.autoFeet || 0)));
    const currentFeet = Math.max(5, Math.round(Number(lbl.dataset.currentFeet || autoFeet || 0)));

    openExtensionOverrideDialog(id, autoFeet, currentFeet);
  });
  
    // ----- Harness Recipe Engine (Phase 1) -----
  function isAutoHarnessSpacing(spacingIn) {
    return spacingIn === 10 || spacingIn === 15 || spacingIn === 20;
  }

  function isExactStraightHarnessSpacing(spacingIn) {
    return spacingIn === 2 || spacingIn === 4 || spacingIn === 30;
  }

  function getEffectiveHarnessSpacingIn() {
    ensureHarnessOverrideStore();

    const requested = +iSpace.value || 0;

    if (isAutoHarnessSpacing(requested)) {
      currentConfig.harnesses.autoMode = 'auto';
      currentConfig.harnesses.autoSpacingIn = requested;
      return requested;
    }

    if (isExactStraightHarnessSpacing(requested)) {
      currentConfig.harnesses.autoMode = 'manual';
      currentConfig.harnesses.autoSpacingIn = null;
      return requested;
    }

    const chosen = Number(currentConfig?.harnesses?.autoSpacingIn || 0);
    if (currentConfig?.harnesses?.autoMode === 'auto' && isAutoHarnessSpacing(chosen)) {
      return chosen;
    }

    return 0;
  }

  function promptForHarnessSpacingMode() {
    ensureHarnessOverrideStore();

    const requested = +iSpace.value || 0;
    if (!requested) return;

    if (isAutoHarnessSpacing(requested)) {
      currentConfig.harnesses.autoMode = 'auto';
      currentConfig.harnesses.autoSpacingIn = requested;
      return;
    }

    if (isExactStraightHarnessSpacing(requested)) {
      currentConfig.harnesses.autoMode = 'manual';
      currentConfig.harnesses.autoSpacingIn = null;
      setAutoFitState('manual');
      return;
    }

    const msg =
      `Nozzle spacing entered: ${requested}"\n\n` +
      `For Auto Configuration, nozzle drop harnesses come in 10", 15", and 20" spacing.\n` +
      `Choose one of those values for Auto Configuration, or choose Manual Mode to lay out the boom yourself.\n\n` +
      `Type: 10, 15, 20, or MANUAL`;

    const raw = window.prompt(msg, '20');
    if (raw == null) return;

    const val = String(raw).trim().toUpperCase();

    if (val === 'MANUAL') {
      currentConfig.harnesses.autoMode = 'manual';
      currentConfig.harnesses.autoSpacingIn = null;
      clearVCMInputsOnly();
      validateDropCount();
      scheduleDraw();
      setAutoFitState('manual');
      return;
    }

    const chosen = Number(val);
    if (isAutoHarnessSpacing(chosen)) {
      currentConfig.harnesses.autoMode = 'auto';
      currentConfig.harnesses.autoSpacingIn = chosen;
      validateDropCount();
      scheduleDraw();
      setAutoFitState('needs');
      return;
    }

    alert('Enter 10, 15, 20, or MANUAL.');
    promptForHarnessSpacingMode();
  }

  function getHarnessSpacingChoice(spacingIn) {
    const standardPnMap = {
      2:  '118200-202',
      4:  '118200-208',
      10: '118200-203',
      15: '118200-201',
      20: '118200-200',
      30: '118200-205'
    };

    if (!spacingIn || !Object.prototype.hasOwnProperty.call(standardPnMap, String(spacingIn))) {
      return {
        requested: spacingIn,
        chosen: null,
        straightPn: null,
        straightDesc: '',
        gapAllowed: false,
        exactStandard: false
      };
    }

    return {
      requested: spacingIn,
      chosen: spacingIn,
      straightPn: standardPnMap[spacingIn],
      straightDesc: `6 Drop x ${spacingIn}" Nozz Harn`,
      gapAllowed: AUTOFIT_NOZZLE_SPACINGS.has(spacingIn),
      exactStandard: true
    };
  }

function getGapHarnessPart(pattern, spacingIn) {
  const gapMap = {
    10: {
      '2+4G': { pn: '118200-214', desc: '2 Drop, Fold Gap, 4 Drop x 10" Nozz Harn' },
      '3+3G': { pn: '118200-215', desc: '3 Drop, Fold Gap, 3 Drop x 10" Nozz Harn' },
      '4+2G': { pn: '118200-216', desc: '4 Drop, Fold Gap, 2 Drop x 10" Nozz Harn' }
    },
    15: {
      '2+4G': { pn: '118200-217', desc: '2 Drop, Fold Gap, 4 Drop x 15" Nozz Harn' },
      '3+3G': { pn: '118200-218', desc: '3 Drop, Fold Gap, 3 Drop x 15" Nozz Harn' },
      '4+2G': { pn: '118200-219', desc: '4 Drop, Fold Gap, 2 Drop x 15" Nozz Harn' }
    },
    20: {
      '2+4G': { pn: '118200-220', desc: '2 Drop, Fold Gap, 4 Drop x 20" Nozz Harn' },
      '3+3G': { pn: '118200-221', desc: '3 Drop, Fold Gap, 3 Drop x 20" Nozz Harn' },
      '4+2G': { pn: '118200-222', desc: '4 Drop, Fold Gap, 2 Drop x 20" Nozz Harn' }
    }
  };

  return gapMap[spacingIn]?.[pattern] || null;
}

const PREVIEW_DOT_MATRIX_LABELS = true;

  function buildHarnessLabel(harnessType, extensionQty) {
    if (harnessType === '6D') {
      if (extensionQty <= 0) return '6D';
      if (extensionQty === 1) return '6D+Ext';
      return `6D+${extensionQty}Ext`;
    }
    return harnessType;
  }

function getHarnessLabelPreviewHtml(recipe, sideName) {
  if (!PREVIEW_DOT_MATRIX_LABELS) return null;

  const label = recipe?.label || '';
  const extQty = window.__legacyHarnessMode ? 0 : Number(recipe?.extensionQty || 0);

  let left = 0;
  let right = 0;

  if (window.__legacyHarnessMode) {
    left = 6;
    right = 0;
  } else if (label.startsWith('2+4G')) { left = 2; right = 4; }
  else if (label.startsWith('3+3G')) { left = 3; right = 3; }
  else if (label.startsWith('4+2G')) { left = 4; right = 2; }
  else if (label.startsWith('6D')) { left = 6; right = 0; }
  else return null;

  let dots =
    right === 0
      ? '•'.repeat(left)
      : `${'•'.repeat(left)}|${'•'.repeat(right)}`;

  if (sideName === 'left' && right > 0) {
    dots = `${'•'.repeat(right)}|${'•'.repeat(left)}`;
  }

  const extLine = extQty > 0 ? `<div style="font-size:9px; line-height:10px; margin-top:1px;">x${extQty} Ext</div>` : '';

  return `
<div style="text-align:center; font-size:12px; line-height:13px; letter-spacing:1.5px;">
      ${dots}
      ${extLine}
    </div>
  `;
}
  
    function getAllowedHarnessTypes(spacingIn) {
    const spacingChoice = getHarnessSpacingChoice(spacingIn);
    const out = ['6D'];
    if (spacingChoice.gapAllowed) out.push('2+4G', '3+3G', '4+2G');
    return out;
  }

  function buildPartsForHarnessSelection(harnessType, extensionQty, spacingIn) {
    const spacingChoice = getHarnessSpacingChoice(spacingIn);
    let finalType = harnessType;
    let finalExtQty = Math.max(0, Math.round(Number(extensionQty || 0)));
    const parts = [];

    if (finalType === '6D') {
      if (spacingChoice.straightPn) {
        parts.push({
          pn: spacingChoice.straightPn,
          part: '6D Harness',
          desc: spacingChoice.straightDesc,
          qty: 1
        });
      }
    } else {
      const gapPart = getGapHarnessPart(finalType, spacingIn);
      if (gapPart) {
        parts.push({
          pn: gapPart.pn,
          part: finalType,
          desc: gapPart.desc,
          qty: 1
        });
      } else {
        if (spacingChoice.straightPn) {
          parts.push({
            pn: spacingChoice.straightPn,
            part: '6D Harness',
            desc: spacingChoice.straightDesc,
            qty: 1
          });
        }
        finalType = '6D';
      }
    }

    if (finalExtQty > 0) {
      parts.push({
        pn: '118673-001',
        part: '5\' Extension',
        desc: '5\' Nozzle Drop Extension',
        qty: finalExtQty
      });
    }

    return {
      harnessType: finalType,
      extensionQty: finalExtQty,
      label: buildHarnessLabel(finalType, finalExtQty),
      parts
    };
  }

  function applyHarnessOverridesToRecipe(baseRecipe, spacingIn, overrideType, overrideExtQty) {
    if (!baseRecipe) return null;

    const out = {
      ...baseRecipe,
      autoHarnessType: baseRecipe.harnessType,
      autoExtensionQty: Number(baseRecipe.extensionQty || 0),
      autoLabel: baseRecipe.label,
      parts: Array.isArray(baseRecipe.parts) ? [...baseRecipe.parts] : []
    };

    const hasTypeOverride = typeof overrideType === 'string' && overrideType.trim() !== '';
    const hasExtOverride =
      overrideExtQty !== undefined &&
      overrideExtQty !== null &&
      overrideExtQty !== '' &&
      isFinite(Number(overrideExtQty));

    if (!hasTypeOverride && !hasExtOverride) {
      out.auto = true;
      out.overrideAsterisk = false;
      return out;
    }

    const allowed = getAllowedHarnessTypes(spacingIn);
    let harnessType = hasTypeOverride ? String(overrideType).trim() : out.autoHarnessType;
    if (!allowed.includes(harnessType)) harnessType = '6D';

    let extensionQty = hasExtOverride
      ? Math.max(0, Math.round(Number(overrideExtQty || 0)))
      : out.autoExtensionQty;

    const built = buildPartsForHarnessSelection(harnessType, extensionQty, spacingIn);

    out.harnessType = built.harnessType;
    out.extensionQty = built.extensionQty;
    out.label = built.label;
    out.parts = built.parts;
    out.auto = false;
    out.overrideAsterisk = true;

    return out;
  }

  function getBoundaryTypeForPair(a, b, totalNozzles, ignoreBreakaway) {
    const pos = Math.min(a, b);

    const breakaway = +iBreak.value || 0;
    const outer = +iOuter.value || 0;
    const inner = +iInner.value || 0;
    const primary = +iPrim.value || 0;

    const breakawaySet = new Set();
    const majorSet = new Set();

    if (breakaway > 0 && breakaway < totalNozzles) {
      breakawaySet.add(breakaway);
      breakawaySet.add(totalNozzles - breakaway);
    }
    [outer, inner, primary].forEach(v => {
      if (v > 0 && v < totalNozzles) {
        majorSet.add(v);
        majorSet.add(totalNozzles - v);
      }
    });

    if (majorSet.has(pos)) return 'major';
    if (!ignoreBreakaway && breakawaySet.has(pos)) return 'breakaway';
    return null;
  }

  function getSideRunPattern(vcm, sideName, totalNozzles, ignoreBreakaway) {
    const count = sideName === 'left' ? Number(vcm.leftCount || 0) : Number(vcm.rightCount || 0);
    if (count <= 0) return null;

    let run = [];
    if (sideName === 'left') {
      for (let n = vcm.nozzleStart + count - 1; n >= vcm.nozzleStart; n--) run.push(n);
    } else {
      for (let n = vcm.nozzleStart + vcm.leftCount; n <= vcm.nozzleEnd; n++) run.push(n);
    }

    let crossing = null;

    for (let i = 0; i < run.length - 1; i++) {
      const a = run[i];
      const b = run[i + 1];
      const type = getBoundaryTypeForPair(a, b, totalNozzles, ignoreBreakaway);
      if (!type) continue;

      const before = i + 1;
      const after = run.length - before;
      crossing = { type, before, after };
      break;
    }

    if (!crossing) {
      return {
        count,
        pattern: `${count}|0`,
        obstacleType: null,
        before: count,
        after: 0
      };
    }

    return {
      count,
      pattern: `${crossing.before}|${crossing.after}`,
      obstacleType: crossing.type,
      before: crossing.before,
      after: crossing.after
    };
  }

  function buildHarnessRecipeForSide(vcm, sideName, totalNozzles, spacingIn, ignoreBreakaway) {
    const sideCount = sideName === 'left' ? Number(vcm.leftCount || 0) : Number(vcm.rightCount || 0);
    if (sideCount <= 0) return null;

    const key = `vcm${vcm.port}_${vcm.seq}_${sideName}`;
    const runInfo = getSideRunPattern(vcm, sideName, totalNozzles, ignoreBreakaway);
    const spacingChoice = getHarnessSpacingChoice(spacingIn);

    let harnessType = '6D';
    let gapPattern = null;
    let extensionQty = 0;

if (runInfo.obstacleType === 'major') {
  if (runInfo.pattern === '2|4') {
    harnessType = '2+4G';
    gapPattern = '2|4';
  } else if (runInfo.pattern === '3|3' || runInfo.pattern === '3|2' || runInfo.pattern === '2|3') {
    harnessType = '3+3G';
    gapPattern = runInfo.pattern;
  } else if (runInfo.pattern === '4|2') {
    harnessType = '4+2G';
    gapPattern = '4|2';
  } else if (runInfo.pattern === '2|2') {
    harnessType = '3+3G';
    gapPattern = '2|2';
  }
} else if (runInfo.obstacleType === 'breakaway') {
      if (runInfo.pattern === '5|1') {
        harnessType = '6D';
        extensionQty = 1;
      } else if (runInfo.pattern === '2|4') {
        harnessType = '2+4G';
        gapPattern = '2|4';
      } else if (runInfo.pattern === '3|3') {
        harnessType = '3+3G';
        gapPattern = '3|3';
      } else if (runInfo.pattern === '4|2') {
        harnessType = '4+2G';
        gapPattern = '4|2';
      } else if (runInfo.pattern === '1|3') {
        harnessType = '6D';
      } else if (runInfo.pattern === '1|4' || runInfo.pattern === '1|5') {
        harnessType = 'ILLEGAL';
        gapPattern = null;
        extensionQty = 0;
      } else {
        harnessType = '6D';
      }
    }

    if ((harnessType === '2+4G' || harnessType === '3+3G' || harnessType === '4+2G') && !spacingChoice.gapAllowed) {
      harnessType = '6D';
      gapPattern = null;
      extensionQty = 0;
    }

    const label = buildHarnessLabel(harnessType, extensionQty);

    let parts = [];

    if (harnessType === 'ILLEGAL') {
      return {
        key,
        vcm: `${vcm.port}-${vcm.seq}`,
        port: vcm.port,
        seq: vcm.seq,
        side: sideName,
        harnessType: 'ILLEGAL',
        gapPattern: null,
        extensionQty: 0,
        auto: true,
        label: 'ILLEGAL',
        sideCount,
        pattern: runInfo.pattern,
        obstacleType: runInfo.obstacleType,
        parts: []
      };
    }

    if (harnessType === '6D') {
      parts.push({
        pn: spacingChoice.straightPn,
        part: '6D Harness',
        desc: spacingChoice.straightDesc,
        qty: 1
      });
    } else {
      const gapPart = getGapHarnessPart(harnessType, spacingIn);
      if (gapPart) {
        parts.push({
          pn: gapPart.pn,
          part: harnessType,
          desc: gapPart.desc,
          qty: 1
        });
      } else {
        parts.push({
          pn: spacingChoice.straightPn,
          part: '6D Harness',
          desc: spacingChoice.straightDesc,
          qty: 1
        });
        harnessType = '6D';
        gapPattern = null;
      }
    }

    if (extensionQty > 0) {
      parts.push({
        pn: '118673-001',
        part: '5\' Extension',
        desc: '5\' Nozzle Drop Extension',
        qty: extensionQty
      });
    }

	return {
		key,
		vcm: `${vcm.port}-${vcm.seq}`,
		port: vcm.port,
		seq: vcm.seq,
		side: sideName,
      harnessType,
      gapPattern,
      extensionQty,
      auto: true,
      label,
      sideCount,
      pattern: runInfo.pattern,
      obstacleType: runInfo.obstacleType,
      parts
    };
  }

  function buildHarnessRecipes(boomState, vcmModel) {
    const totalNozzles = Number(boomState?.totalNozzles || 0);
    const spacingIn = getEffectiveHarnessSpacingIn();
    const ignoreBreakaway = !!chkIgnoreBreakaway?.checked;

    const flatVcMs = (vcmModel || []).flatMap(group => group || []);

    const overrides = currentConfig?.harnesses?.overrides || {};
    const extOverrides = currentConfig?.harnesses?.extOverrides || {};

    const recipes = {};

    if (window.__legacyHarnessMode) {
      flatVcMs.forEach(vcm => {
        const makeLegacyRecipe = (sideName, sideCount) => {
          if (!sideCount || sideCount <= 0) return null;

          const key = `vcm${vcm.port}_${vcm.seq}_${sideName}`;
          return {
            key,
            vcm: `${vcm.port}-${vcm.seq}`,
            port: vcm.port,
            seq: vcm.seq,
            side: sideName,
            harnessType: '6D',
            autoHarnessType: '6D',
            extensionQty: 0,
            autoExtensionQty: 0,
            auto: true,
            label: '6D',
            autoLabel: '6D',
            sideCount,
            pattern: `${sideCount}|0`,
            obstacleType: null,
            parts: [{
              pn: getHarnessSpacingChoice(spacingIn).straightPn,
              part: '6D Harness',
              desc: getHarnessSpacingChoice(spacingIn).straightDesc,
              qty: 1
            }]
          };
        };

        const leftRecipe = makeLegacyRecipe('left', Number(vcm.leftCount || 0));
        const rightRecipe = makeLegacyRecipe('right', Number(vcm.rightCount || 0));

        if (leftRecipe) recipes[leftRecipe.key] = leftRecipe;
        if (rightRecipe) recipes[rightRecipe.key] = rightRecipe;
      });

      return {
        version: 1,
        recipes,
        overrides: {},
        extOverrides: {}
      };
    }

    flatVcMs.forEach(vcm => {
      let leftRecipe = buildHarnessRecipeForSide(vcm, 'left', totalNozzles, spacingIn, ignoreBreakaway);
      let rightRecipe = buildHarnessRecipeForSide(vcm, 'right', totalNozzles, spacingIn, ignoreBreakaway);

      if (leftRecipe) {
        leftRecipe = applyHarnessOverridesToRecipe(
          leftRecipe,
          spacingIn,
          overrides[leftRecipe.key],
          extOverrides[leftRecipe.key]
        );
        recipes[leftRecipe.key] = leftRecipe;
      }

      if (rightRecipe) {
        rightRecipe = applyHarnessOverridesToRecipe(
          rightRecipe,
          spacingIn,
          overrides[rightRecipe.key],
          extOverrides[rightRecipe.key]
        );
        recipes[rightRecipe.key] = rightRecipe;
      }
    });

    return {
      version: 1,
      recipes,
      overrides: { ...overrides },
      extOverrides: { ...extOverrides }
    };
  }

  function buildPartsFromHarnessRecipes(harnessState) {
    const rows = new Map();

    const add = (pn, desc, qty) => {
      if (!pn || !qty) return;
      const prev = rows.get(pn);
      if (prev) prev.qty += qty;
      else rows.set(pn, { pn, desc, qty });
    };

    Object.values(harnessState?.recipes || {}).forEach(recipe => {
      (recipe.parts || []).forEach(part => {
        add(part.pn, part.desc, Number(part.qty || 0));
      });
    });

    return Array.from(rows.values());
  }

  function countDustPlugsFromHarnessRecipes(harnessState) {
    let plugs = 0;
    Object.values(harnessState?.recipes || {}).forEach(recipe => {
      const usedPhysical = Number(recipe.sideCount || 0);
      plugs += Math.max(0, 6 - usedPhysical);
    });
    return plugs;
  }

  // ----- Parts list -----
  function renderPartsList(boomState, vcmModel){
    const tbody = document.querySelector('#partsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const hubType = hubMode.value;
    const { mode, data } = readVCMs();
    const max = mode === 'lite' ? 4 : 8;

    let portsUsed = 0;
    let vcmCount = 0;

    for (let p = 1; p <= max; p++) {
      const row = data[p];
      if (!row) continue;

      const used = (row.v1.nozzles || 0) + (row.v2.nozzles || 0) + (row.v3.nozzles || 0);
      if (used > 0) {
        portsUsed++;
        if (row.v1.nozzles > 0) vcmCount++;
        if (row.v2.nozzles > 0) vcmCount++;
        if (row.v3.nozzles > 0) vcmCount++;
      }
    }

    const harnessState = buildHarnessRecipes(boomState, vcmModel);

    if (currentConfig) {
      currentConfig.harnesses = {
        version: 1,
        recipes: harnessState.recipes,
        overrides: harnessState.overrides || {},
        extOverrides: harnessState.extOverrides || {},
        autoSpacingIn: currentConfig?.harnesses?.autoSpacingIn ?? null,
        autoMode: currentConfig?.harnesses?.autoMode || 'auto'
      };
    }

    const harnessRows = buildPartsFromHarnessRecipes(harnessState);
    const unusedDrops = countDustPlugsFromHarnessRecipes(harnessState);

    const autoDropExtQty = harnessRows
      .filter(r => r.pn === '118673-001')
      .reduce((sum, r) => sum + Number(r.qty || 0), 0);

    const legacyDropExtQty = window.__legacyHarnessMode
      ? Math.max(0, Number(currentConfig?.extensions?.dropExt5ftQty || 0))
      : 0;

    const effectiveDropExtQty = window.__legacyHarnessMode ? legacyDropExtQty : autoDropExtQty;

    const filteredHarnessRows = harnessRows.filter(r => r.pn !== '118673-001');

    const extRows = Object.entries(EXT_COUNTS)
      .map(([feetStr, qty]) => {
        const f = Math.max(1, parseInt(feetStr, 10) || 0);
        const code = String(f).padStart(3, '0');
        return { pn:`150004-${code}`, desc:`${f}' Extension Harness`, qty };
      })
      .sort((a,b)=> parseInt(a.pn.slice(-3), 10) - parseInt(b.pn.slice(-3), 10));

    function addRow(pn, desc, qty){
      if (!qty || qty <= 0) return;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${pn}</td><td>${desc}</td><td>${qty}</td>`;
      tbody.appendChild(tr);
    }

    addRow(
      hubType === 'lite' ? '123000-130' : '123000-150',
      hubType === 'lite' ? 'Lite Hub' : 'Standard Hub',
      1
    );

    addRow('123300-001', 'LeapStart VCM', vcmCount);

    filteredHarnessRows.forEach(r => addRow(r.pn, r.desc, r.qty));

    if (effectiveDropExtQty > 0) {
      addRow('118673-001', '5\' Nozzle Drop Extension', effectiveDropExtQty);
    }

    extRows.forEach(r => addRow(r.pn, r.desc, r.qty));

    addRow('116200-045', '2-Pin Dust Plug (cap unused drops)', unusedDrops);
    addRow('150003-005', 'VCM Terminator', portsUsed);

    const sixPinQty = (hubType === 'lite' ? 4 : 8) - portsUsed;
    addRow('706530-348', 'Dust Plug 6-Pin DT', Math.max(0, sixPinQty));
    addRow('706530-352', 'Dust Plug 4-Pin DT', 2);
  }

  partsTableRoot?.addEventListener('input', (e) => {
    const inp = e.target;
if (inp && inp.id === 'user-ext-input') {
      window.USER_DROP_EXT_QTY = Math.max(0, Math.floor(+inp.value || 0));

      if (currentConfig) {
        currentConfig.extensions = currentConfig.extensions || {};
        currentConfig.extensions.dropExt5ftQty = window.USER_DROP_EXT_QTY;
      }

      saveCurrentConfigToStorage();
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
    try {
      lastBoomState = boomState;
      lastVCMModel = vcmModel;
      window.__lastBoomState = boomState;
      window.__lastVCMModel = vcmModel;
      renderPartsList(boomState, vcmModel);
    }
    catch(e){ return DERR(e,'renderPartsList'); }
    try { updateBoomMeta(boomState); }
    catch(e){ return DERR(e,'updateBoomMeta'); }
    try { applyFactoryLocking(); }
    catch(e){ return DERR(e,'applyFactoryLocking'); }
    DBG('drawAllNow end');
  }
  window.drawAllNow = _drawAllNowImpl;


  // ----- AutoFit -----
  const btnAutoFit = el('btnAutoFit');
  const chkIgnoreBreakaway = el('ignoreBreakaway');
  let autoFitState = 'needs';

  function setAutoFitState(state) {
    autoFitState = state;
    if (!btnAutoFit) return;

    btnAutoFit.classList.remove('autofit-needs', 'autofit-auto', 'autofit-manual', 'autofit-factory');

    if (state === 'factory') {
      btnAutoFit.classList.add('autofit-factory');
      btnAutoFit.textContent = 'Factory Approved';
      return;
    }

    if (state === 'auto') {
      btnAutoFit.classList.add('autofit-auto');
      btnAutoFit.textContent = 'AutoFit: Best Fit';
      return;
    }

    if (state === 'manual') {
      btnAutoFit.classList.add('autofit-manual');
      btnAutoFit.textContent = 'AutoFit: Manual';
      return;
    }

    btnAutoFit.classList.add('autofit-needs');
    btnAutoFit.textContent = 'Click Here to AutoFit VCMs';
  }

  function markAutoFitDirty() {
    if (window.__currentIsFactory) return;
    setAutoFitState('needs');
  }
  window.setAutoFitState = setAutoFitState;

  function loadedConfigHasManualState() {
    const harnessOverrides = currentConfig?.harnesses?.overrides || {};
    const harnessExtOverrides = currentConfig?.harnesses?.extOverrides || {};

    const hasHarnessOverride = Object.keys(harnessOverrides).length > 0;
    const hasHarnessExtOverride = Object.keys(harnessExtOverrides).length > 0;
    const hasVcmExtOverride = !!(window.extOverrides && window.extOverrides.size > 0);

    return hasHarnessOverride || hasHarnessExtOverride || hasVcmExtOverride;
  }

  function syncAutoFitStateFromLoadedConfig() {
    if (window.__currentIsFactory) {
      setAutoFitState('factory');
      return;
    }

    if (window.__legacyHarnessMode) {
      setAutoFitState('needs');
      return;
    }

    if (loadedConfigHasManualState()) {
      setAutoFitState('manual');
      return;
    }

    setAutoFitState('needs');
  }

  window.syncAutoFitStateFromLoadedConfig = syncAutoFitStateFromLoadedConfig;
  window.__markAutoFitDirty = markAutoFitDirty;

  function clearVCMInputsOnly() {
    vcmFields.querySelectorAll('.vcm-cell input[type="number"]').forEach(inp => { inp.value = 0; });
    vcmFields.querySelectorAll('.shift-flag').forEach(f => { f.textContent = '0'; f.style.display = 'none'; });
    vcmFields.querySelectorAll('.vcm-cell').forEach(cell => updateShiftDisplay(cell, 0));
  }

  function clearHarnessOverrideState() {
    ensureHarnessOverrideStore();
    currentConfig.harnesses.overrides = {};
    currentConfig.harnesses.extOverrides = {};
  }
  
    const ALLOWED_BREAKAWAY_PATTERNS = new Set([
    '1|3',
    '2|4',
    '3|3',
    '4|2',
    '5|1'
  ]);

  const ALLOWED_MAJOR_PATTERNS = new Set([
    '2|2',
    '2|3',
    '3|2',
    '2|4',
    '3|3',
    '4|2'
  ]);

  function getBoundaryMap(totalNozzles) {
    const map = new Map();
    const add = (pos, type) => {
      if (!Number.isFinite(pos) || pos <= 0 || pos >= totalNozzles) return;
      map.set(pos, type);
    };
    const br = +iBreak.value || 0;
    const ot = +iOuter.value || 0;
    const inn = +iInner.value || 0;
    const pri = +iPrim.value || 0;
    add(br, 'breakaway'); add(totalNozzles - br, 'breakaway');
    add(ot, 'major'); add(totalNozzles - ot, 'major');
    add(inn, 'major'); add(totalNozzles - inn, 'major');
    add(pri, 'major'); add(totalNozzles - pri, 'major');
    return map;
  }

  function runInfo(runNozzles, boundaryMap, ignoreBreakaway) {
    const len = runNozzles.length;
    if (len < 1 || len > 6) return null;

    const relevant = [];

    for (let i = 0; i < len - 1; i++) {
      const a = runNozzles[i];
      const b = runNozzles[i + 1];
      const pos = Math.min(a, b); // boundary between pos and pos+1
      const type = boundaryMap.get(pos);
      if (!type) continue;
      if (type === 'breakaway' && ignoreBreakaway) continue;

      const before = i + 1;
      const after = len - before;
      relevant.push({ type, before, after, pos, pattern: `${before}|${after}` });
    }

    if (!relevant.length) return { ok: true, crosses: 0, majorCross: 0, primarySpan: 0 };
    if (relevant.length > 1) return null;

    const b = relevant[0];

    if (b.type === 'major') {
      if (!ALLOWED_MAJOR_PATTERNS.has(b.pattern)) return null;
      return { ok: true, crosses: 1, majorCross: 1, primarySpan: 0 };
    }

    if (b.type === 'breakaway') {
      if (!ALLOWED_BREAKAWAY_PATTERNS.has(b.pattern)) return null;
      return { ok: true, crosses: 1, majorCross: 0, primarySpan: 0 };
    }

    return null;
  }


  function validGroup(start, size, totalNozzles, boundaryMap, ignoreBreakaway) {
    const end = start + size - 1;
    if (end > totalNozzles) return null;

    const centerIndex = (totalNozzles + 1) / 2;
    const groupMid = (start + end) / 2;

    const isLeftWing = groupMid < centerIndex;
    const isRightWing = groupMid > centerIndex;
    const isCenterGroup = !isLeftWing && !isRightWing;

    let allowedSplits = [];

    if (size <= 6) {
      // Contract rule:
      // Single-harness VCMs (<=6) do not use shift.
      // Therefore wing groups have only one physical orientation:
      // left wing runs left, right wing runs right.
      if (isLeftWing) {
        allowedSplits = [[size, 0]];
      } else if (isRightWing) {
        allowedSplits = [[0, size]];
      } else {
        // Rare center-straddling single-harness case:
        // allow either one-sided orientation and let legality/scoring decide.
        allowedSplits = [[size, 0], [0, size]];
      }
    } else {
      allowedSplits = {
        8: [[6,2],[2,6]],
        9: [[6,3],[3,6]],
        10:[[6,4],[4,6]],
        11:[[6,5],[5,6]],
        12:[[6,6]]
      }[size] || [];
    }

    if (!allowedSplits.length) return null;

    const primaryL = +iPrim.value || 0;
    const primaryR = totalNozzles - primaryL;
    let best = null;

    for (const [leftCount, rightCount] of allowedSplits) {
      const leftRun = [];
      const rightRun = [];

      for (let i = 0; i < leftCount; i++) {
        leftRun.push(start + leftCount - 1 - i); // from VCM outward left
      }
      for (let i = 0; i < rightCount; i++) {
        rightRun.push(start + leftCount + i); // from VCM outward right
      }

      let left = { ok: true, crosses: 0, majorCross: 0 };
      let right = { ok: true, crosses: 0, majorCross: 0 };

      // Fast pre-prune: reject obvious illegal side patterns before deeper scoring
      const leftLen = leftRun.length;
      const rightLen = rightRun.length;

      if (leftLen === 6 && rightLen === 0) {
        // no-op, straight full side
      }
      if (rightLen === 6 && leftLen === 0) {
        // no-op, straight full side
      }

      if (leftRun.length) {
        left = runInfo(leftRun, boundaryMap, ignoreBreakaway);
        if (!left) continue;
      }

      if (rightRun.length) {
        right = runInfo(rightRun, boundaryMap, ignoreBreakaway);
        if (!right) continue;
      }

      const crosses = (left.crosses || 0) + (right.crosses || 0);
      const majorCross = (left.majorCross || 0) + (right.majorCross || 0);

      const centerIndex = (totalNozzles + 1) / 2;
      const mountCenter = start + leftCount - 0.5;
      const spansCenter = Math.abs(mountCenter - centerIndex) < 0.500001;

      const spansPrimary =
        (primaryL > 0 && start <= primaryL && end >= primaryL + 1) ||
        (primaryR > 0 && start <= primaryR && end >= primaryR + 1);

      const info = {
        start,
        end,
        size,
        leftCount,
        rightCount,
        crosses,
        majorCross,
        spansCenter: spansCenter ? 1 : 0,
        spansPrimary: spansPrimary ? 1 : 0
      };

      if (!best) {
        best = info;
        continue;
      }

      const a = [
        info.crosses,
        info.majorCross * 10 - info.spansPrimary,
        Math.abs(info.leftCount - info.rightCount)
      ];
      const b = [
        best.crosses,
        best.majorCross * 10 - best.spansPrimary,
        Math.abs(best.leftCount - best.rightCount)
      ];

      if (
        a[0] < b[0] ||
        (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])))
      ) {
        best = info;
      }
    }

    return best;
  }
  
function encodeAutoShift(size, leftCount, rightCount) {
  if (size <= 0) return 0;

  // single-sided VCM: no stored side override
  if (size <= 6) return 0;

  // split VCM: store left-right difference
  return leftCount - rightCount;
}

// HARNESS SIDE DECODER
// Modern mode:
//   - <=6 can be one-sided and may be manually shifted
//   - >6 uses split logic / AutoFit logic
//
// Legacy mode:
//   - reproduce original renderer behavior only
//   - <=6 stays one-sided by wing
//   - >6 uses old 6-then-remainder behavior
// This is for backward visual compatibility with old approved JSON,
// not for modern physical-side solver logic.
function decodeHarnessSplit(nozzleCount, shiftValue, onLeftSide) {
  const size = Number(nozzleCount) || 0;
  const shift = Number(shiftValue) || 0;

  if (size <= 0) return { leftCount: 0, rightCount: 0 };

  // Legacy visual compatibility:
  // Reproduce the original renderer behavior.
  // <=6  : one-sided by wing
  // >6   : old 6-then-remainder behavior
  if (window.__legacyHarnessMode) {
    if (size <= 6) {
      return onLeftSide
        ? { leftCount: size, rightCount: 0 }
        : { leftCount: 0, rightCount: size };
    }

    return onLeftSide
      ? { leftCount: 6, rightCount: size - 6 }
      : { leftCount: size - 6, rightCount: 6 };
  }

  // single-sided
  if (size <= 6) {
    if (shift < 0) return { leftCount: size, rightCount: 0 };
    if (shift > 0) return { leftCount: 0, rightCount: size };

    return onLeftSide
      ? { leftCount: size, rightCount: 0 }
      : { leftCount: 0, rightCount: size };
  }

  // full VCM
  if (size === 12) return { leftCount: 6, rightCount: 6 };

  if (shift !== 0) {
    const leftCount = Math.round((size + shift) / 2);
    const rightCount = size - leftCount;

    if (
      leftCount >= 0 && rightCount >= 0 &&
      leftCount <= 6 && rightCount <= 6 &&
      leftCount + rightCount === size
    ) {
      return { leftCount, rightCount };
    }
  }

  return { leftCount: 6, rightCount: size - 6 };
}

  function setPortShift(port, seq, shiftVal) {
    const flag = vcmFields.querySelector(`.shift-flag[data-port="${port}"][data-vcm="${seq}"]`);
    if (flag) {
      flag.textContent = String(shiftVal || 0);
      flag.style.display = 'none';
    }
    const cell = vcmFields.querySelector(`.vcm-cell[data-port="${port}"][data-vcm="${seq}"]`);
    if (cell) updateShiftDisplay(cell, shiftVal || 0);
  }

  function buildGroupsFromSizes(sizes) {
    const groups = [];
    let cursor = 1;
    sizes.forEach(sz => {
      groups.push({ start: cursor, end: cursor + sz - 1, size: sz });
      cursor += sz;
    });
    return groups;
  }

  function getPrimaryLayoutInfo(groups, totalNozzles) {
    const primary = +iPrim.value || 0;
    if (!primary || primary >= totalNozzles / 2) {
      return {
        hasPrimary: false,
        leftWingCenterOut: [],
        rightWingCenterOut: [],
        centerGroups: [],
        centerStart: 0,
        centerEnd: 0,
        centerSize: 0,
        primaryCrossings: 0
      };
    }

    const centerStart = primary + 1;
    const centerEnd = totalNozzles - primary;
    const rightWingStart = centerEnd + 1;

    const leftWing = [];
    const rightWing = [];
    const centerGroups = [];
    let primaryCrossings = 0;

    groups.forEach(g => {
      const crossesLeftPrimary = g.start <= primary && g.end >= centerStart;
      const crossesRightPrimary = g.start <= centerEnd && g.end >= rightWingStart;
      const overlapsCenter = g.start <= centerEnd && g.end >= centerStart;

      if (crossesLeftPrimary) primaryCrossings += 1;
      if (crossesRightPrimary) primaryCrossings += 1;
      if (overlapsCenter) centerGroups.push(g);

      if (g.end <= primary) leftWing.push(g.size);
      if (g.start >= rightWingStart) rightWing.push(g.size);
    });

    return {
      hasPrimary: true,
      leftWingCenterOut: leftWing.slice().reverse(),
      rightWingCenterOut: rightWing.slice(),
      centerGroups,
      centerStart,
      centerEnd,
      centerSize: centerEnd - centerStart + 1,
      primaryCrossings
    };
  }

  function avoidablePrimaryFoldPenalty(groups, totalNozzles) {
    const info = getPrimaryLayoutInfo(groups, totalNozzles);
    if (!info.hasPrimary) return 0;
    if (info.primaryCrossings === 0) return 0;

    // Standalone center must itself be a legal VCM size.
    const legalStandaloneCenterSizes = new Set([4, 5, 6, 8, 9, 10, 11, 12]);
    if (!legalStandaloneCenterSizes.has(info.centerSize)) return 0;

    const leftWingGroups = info.leftWingCenterOut.length;
    const rightWingGroups = info.rightWingCenterOut.length;
    const currentGroupCount = groups.length;

    // If the center stands alone, total VCM count would be:
    // left wing groups + 1 center group + right wing groups
    const isolatedCenterGroupCount = leftWingGroups + 1 + rightWingGroups;

    // Only penalize when isolating center does NOT require another VCM.
    if (isolatedCenterGroupCount !== currentGroupCount) return 0;

    // Current candidate is crossing at least one primary fold even though
    // the center could stand alone with the same VCM count.
    return 1;
  }

  function symmetryDelta(groups, totalNozzles) {
    const primaryInfo = getPrimaryLayoutInfo(groups, totalNozzles);

    if (primaryInfo.hasPrimary) {
      const left = primaryInfo.leftWingCenterOut;
      const right = primaryInfo.rightWingCenterOut;
      const n = Math.max(left.length, right.length);

      let delta = Math.abs(left.length - right.length) * 50;

      for (let i = 0; i < n; i++) {
        const diff = Math.abs((left[i] || 0) - (right[i] || 0));
        delta += Math.max(0, diff - 1);
      }

      return delta;
    }

    const mid = (totalNozzles + 1) / 2;
    const left = groups.filter(g => g.end < mid).map(g => g.size);
    const right = groups.filter(g => g.start > mid).map(g => g.size).reverse();
    const n = Math.max(left.length, right.length);
    let delta = Math.abs(left.length - right.length) * 50;
    for (let i = 0; i < n; i++) delta += Math.abs((left[i] || 0) - (right[i] || 0));
    return delta;
  }

  function getPrimaryFoldValue(totalNozzles) {
    const raw = Number(document.getElementById('primaryFold')?.value || 0) || 0;
    if (raw <= 0) return 0;
    if (raw >= totalNozzles / 2) return 0;
    return raw;
  }

  function getPrimaryLayoutInfo(groups, totalNozzles) {
    const primary = getPrimaryFoldValue(totalNozzles);
    if (!primary) {
      return {
        hasPrimary: false,
        primary: 0,
        centerStart: 0,
        centerEnd: 0,
        centerSize: 0,
        leftWingCenterOut: [],
        rightWingCenterOut: [],
        centerGroups: [],
        leftPrimaryCrossings: 0,
        rightPrimaryCrossings: 0,
        primaryCrossings: 0
      };
    }

    const centerStart = primary + 1;
    const centerEnd = totalNozzles - primary;
    const rightWingStart = centerEnd + 1;

    const leftWing = [];
    const rightWing = [];
    const centerGroups = [];

    let leftPrimaryCrossings = 0;
    let rightPrimaryCrossings = 0;

    groups.forEach(g => {
      const crossesLeftPrimary =
        g.start <= primary && g.end >= centerStart;

      const crossesRightPrimary =
        g.start <= centerEnd && g.end >= rightWingStart;

      const overlapsCenter =
        g.start <= centerEnd && g.end >= centerStart;

      if (crossesLeftPrimary) leftPrimaryCrossings += 1;
      if (crossesRightPrimary) rightPrimaryCrossings += 1;
      if (overlapsCenter) centerGroups.push(g);

      if (g.end <= primary) leftWing.push(g.size);
      if (g.start >= rightWingStart) rightWing.push(g.size);
    });

    return {
      hasPrimary: true,
      primary,
      centerStart,
      centerEnd,
      centerSize: centerEnd - centerStart + 1,
      leftWingCenterOut: leftWing.slice().reverse(),
      rightWingCenterOut: rightWing.slice(),
      centerGroups,
      leftPrimaryCrossings,
      rightPrimaryCrossings,
      primaryCrossings: leftPrimaryCrossings + rightPrimaryCrossings
    };
  }

  function symmetryDelta(groups, totalNozzles) {
    const primaryInfo = getPrimaryLayoutInfo(groups, totalNozzles);

    // Preferred symmetry model:
    // compare left/right wings from the PRIMARY folds outward.
    // center may be different and absorb odd nozzles.
    if (primaryInfo.hasPrimary) {
      const left = primaryInfo.leftWingCenterOut;
      const right = primaryInfo.rightWingCenterOut;
      const n = Math.max(left.length, right.length);

      let delta = Math.abs(left.length - right.length) * 50;

      for (let i = 0; i < n; i++) {
        const diff = Math.abs((left[i] || 0) - (right[i] || 0));
        // +/- 1 nozzle on paired wing VCMs is treated as symmetric
        delta += Math.max(0, diff - 1);
      }

      return delta;
    }

    // Fallback for booms with no usable primary folds
    const mid = (totalNozzles + 1) / 2;
    const left = groups.filter(g => g.end < mid).map(g => g.size);
    const right = groups.filter(g => g.start > mid).map(g => g.size).reverse();
    const n = Math.max(left.length, right.length);
    let delta = Math.abs(left.length - right.length) * 50;
    for (let i = 0; i < n; i++) delta += Math.abs((left[i] || 0) - (right[i] || 0));
    return delta;
  }

  function avoidablePrimaryFoldPenalty(groups, totalNozzles) {
    const info = getPrimaryLayoutInfo(groups, totalNozzles);
    if (!info.hasPrimary) return 0;
    if (info.primaryCrossings === 0) return 0;

    const legalStandaloneCenterSizes = new Set([4, 5, 6, 8, 9, 10, 11, 12]);
    if (!legalStandaloneCenterSizes.has(info.centerSize)) return 0;

    const leftWingGroups = info.leftWingCenterOut.length;
    const rightWingGroups = info.rightWingCenterOut.length;
    const currentGroupCount = groups.length;

    const isolatedCenterGroupCount = leftWingGroups + 1 + rightWingGroups;

    if (isolatedCenterGroupCount !== currentGroupCount) return 0;

    return 1;
  }
  
    function countHarnessesFromSizes(sizes) {
    return sizes.reduce((sum, sz) => sum + (sz <= 6 ? 1 : 2), 0);
  }

  function countSmallVCMs(sizes) {
    return sizes.reduce((n, sz) => n + (sz <= 6 ? 1 : 0), 0);
  }

  function countAdjacentSmallPairs(sizes) {
    let pairs = 0;
    for (let i = 0; i < sizes.length - 1; i++) {
      if (sizes[i] <= 6 && sizes[i + 1] <= 6) pairs++;
    }
    return pairs;
  }

  function centerAndWingPenalty(groups, totalNozzles) {
    const wings = getWingSizeLists(groups, totalNozzles);
    const left = wings.left;
    const right = wings.right;
    const center = wings.center;

    const leftSmallCount = countSmallVCMs(left);
    const rightSmallCount = countSmallVCMs(right);
    const totalSmallWingCount = leftSmallCount + rightSmallCount;

    const leftAdjacent = countAdjacentSmallPairs(left);
    const rightAdjacent = countAdjacentSmallPairs(right);
    const adjacentSmallPairs = leftAdjacent + rightAdjacent;

    const wingsWithMultipleSmall = (leftSmallCount > 1 ? 1 : 0) + (rightSmallCount > 1 ? 1 : 0);

    const leftTip = left.length ? left[0] : 0;
    const rightTip = right.length ? right[0] : 0;
    const leftTipSmall = leftTip > 0 && leftTip <= 6;
    const rightTipSmall = rightTip > 0 && rightTip <= 6;

    const oneSidedSmallTip = leftTipSmall !== rightTipSmall ? 1 : 0;
    const mismatchedSmallTips = (leftTipSmall && rightTipSmall && leftTip !== rightTip) ? 1 : 0;

    const hasIndependentCenterSection = center.length === 1 ? 1 : 0;
    const centerSmallSection = (center.length === 1 && center[0] <= 6) ? 1 : 0;

    return {
      totalSmallWingCount,
      adjacentSmallPairs,
      wingsWithMultipleSmall,
      oneSidedSmallTip,
      mismatchedSmallTips,
      hasIndependentCenterSection,
      centerSmallSection
    };
  }

  function getWingSizeLists(groups, totalNozzles) {
    const mid = (totalNozzles + 1) / 2;
    return {
      left: groups.filter(g => g.end < mid).map(g => g.size),
      right: groups.filter(g => g.start > mid).map(g => g.size).reverse(),
      center: groups.filter(g => !(g.end < mid || g.start > mid)).map(g => g.size)
    };
  }

  function countSmallWingVCMs(sizes) {
    return sizes.reduce((n, sz) => n + (sz <= 6 ? 1 : 0), 0);
  }

  function wingQualityPenalty(groups, totalNozzles) {
    const wings = getWingSizeLists(groups, totalNozzles);
    const left = wings.left;
    const right = wings.right;

    const leftSmallCount = countSmallWingVCMs(left);
    const rightSmallCount = countSmallWingVCMs(right);
    const totalSmallCount = leftSmallCount + rightSmallCount;

    const leftAdjacent = countAdjacentSmallPairs(left);
    const rightAdjacent = countAdjacentSmallPairs(right);
    const adjacentPairs = leftAdjacent + rightAdjacent;

    const leftTip = left.length ? left[0] : 0;
    const rightTip = right.length ? right[0] : 0;

    const leftTipSmall = leftTip > 0 && leftTip <= 6;
    const rightTipSmall = rightTip > 0 && rightTip <= 6;

    let oneSidedSmallTip = 0;
    let mismatchedSmallTips = 0;

    if (leftTipSmall !== rightTipSmall) {
      oneSidedSmallTip = 1;
    } else if (leftTipSmall && rightTipSmall && leftTip !== rightTip) {
      mismatchedSmallTips = 1;
    }

    return {
      totalSmallCount,
      adjacentPairs,
      oneSidedSmallTip,
      mismatchedSmallTips
    };
  }

  function secondVcmOrder(portCount) {
    if (portCount === 4) return [1, 2, 4, 3];
    const left = [];
    const right = [];
    for (let p = 1; p <= portCount; p++) {
      if (p <= Math.floor(portCount / 2)) left.push(p);
      else right.push(p);
    }
    return left.concat(right.reverse());
  }

  function thirdVcmOrder(portCount) {
    if (portCount === 4) return [2, 3, 1, 4];
    if (portCount === 8) return [4, 5, 3, 6, 2, 7, 1, 8];
    const order = [];
    let l = Math.floor((portCount + 1) / 2);
    let r = l + 1;
    while (l >= 1 || r <= portCount) {
      if (l >= 1) order.push(l--);
      if (r <= portCount) order.push(r++);
    }
    return order;
  }

  function portCountsForGroups(groupCount, portLimit) {
    if (groupCount < 1) return [];
    if (groupCount > portLimit * 3) return null;
    const used = Math.min(groupCount, portLimit);
    const counts = Array(used).fill(1);
    let remaining = groupCount - used;
    const secondOrder = secondVcmOrder(used).filter(p => p <= used);
    for (const p of secondOrder) {
      if (remaining <= 0) break;
      counts[p - 1] += 1;
      remaining -= 1;
    }
    if (remaining > 0) {
      if (counts.some(c => c < 2)) return null;
      const thirdOrder = thirdVcmOrder(used).filter(p => p <= used);
      for (const p of thirdOrder) {
        if (remaining <= 0) break;
        counts[p - 1] += 1;
        remaining -= 1;
      }
    }
    return remaining === 0 ? counts : null;
  }

  function scoreCandidate(candidate, totalNozzles, portLimit, minGroups) {
    const portCounts = portCountsForGroups(candidate.groups.length, portLimit);
    if (!portCounts) return null;

    const maxPerPort = Math.max(...portCounts);
    const thirdUsed = maxPerPort >= 3 ? 1 : 0;
    const groups = buildGroupsFromSizes(candidate.groups);
    const symmetry = symmetryDelta(groups, totalNozzles);
    const foldPenalty = candidate.foldPenalty || 0;
    const harnessCount = countHarnessesFromSizes(candidate.groups);
    const wingCenterPenalty = centerAndWingPenalty(groups, totalNozzles);
    const avoidablePrimaryPenalty = avoidablePrimaryFoldPenalty(groups, totalNozzles);

    // Make avoidable primary-fold crossing a REAL preference, not a weak tie-breaker.
    // If it is avoidable, treat it as much worse than adding one extra harness.
    const practicalPrimaryPenalty =
      avoidablePrimaryPenalty
        ? 100
            + (wingCenterPenalty.oneSidedSmallTip * 20)
            + (wingCenterPenalty.wingsWithMultipleSmall * 10)
            + (wingCenterPenalty.adjacentSmallPairs * 5)
        : 0;

    return {
      portCounts,
      key: [
        candidate.groups.length,                          // fewest VCMs first
        practicalPrimaryPenalty,                          // strongly prefer isolated center over avoidable primary crossings
        harnessCount,                                     // one extra harness is acceptable after that
        wingCenterPenalty.oneSidedSmallTip,               // then avoid one-sided small wing tips
        wingCenterPenalty.wingsWithMultipleSmall,         // then avoid wings with multiple small VCMs
        wingCenterPenalty.adjacentSmallPairs,             // then avoid 4,4,9 style fragmentation
        wingCenterPenalty.totalSmallWingCount,            // penalize wing 4/5/6 in general
        wingCenterPenalty.centerSmallSection ? 0 : 1,     // prefer clean independent center 6 over wing 6
        wingCenterPenalty.hasIndependentCenterSection ? 0 : 1, // prefer an independent center section when available
        symmetry,                                         // wing symmetry from primary folds outward
        maxPerPort,                                       // then port loading quality
        thirdUsed ? 1 : 0,                                // third VCM only after all used ports already have 2
        foldPenalty                                       // generic fold crossing penalty last
      ],
      symmetry
    };
  }

  function compareKeys(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const av = a[i] || 0;
      const bv = b[i] || 0;
      if (av < bv) return -1;
      if (av > bv) return 1;
    }
    return 0;
  }

  function findAutoFitSolution() {
    const totalNozzles = +iTotal.value || 0;
    const hub = hubMode.value || 'lite';
    const portLimit = hub === 'lite' ? 4 : 8;
    const slotLimit = portLimit * 3;
    const ignoreBreakaway = !!chkIgnoreBreakaway?.checked;

    if (hub === 'lite' && totalNozzles > 144) {
      alert('Total Nozzles exceeds Lite Hub capacity → switch to standard hub.');
      return null;
    }
    if (totalNozzles > 288) {
      alert('Too many nozzles — boom not compatible.');
      return null;
    }

    const boundaryMap = getBoundaryMap(totalNozzles);
    const allowedSizes = [12, 11, 10, 9, 8, 6, 5, 4];

    function minNeeded(rem) {
      return Math.ceil(rem / 12);
    }

    let best = null;
    let bestScore = null;
    let minGroupsFound = Infinity;

    function dfs(pos, groups, infos, foldPenalty, centerSpan) {
      if (groups.length > slotLimit) return;

      if (pos > totalNozzles) {
        minGroupsFound = Math.min(minGroupsFound, groups.length);

        const candidate = {
          groups: groups.slice(),
          infos: infos.slice(),
          foldPenalty,
          centerSpan
        };

        const scored = scoreCandidate(candidate, totalNozzles, portLimit, minGroupsFound);
        if (!scored) return;

        if (!best || compareKeys(scored.key, bestScore.key) < 0) {
          best = {
            groups: candidate.groups.slice(),
            infos: candidate.infos.slice(),
            portCounts: scored.portCounts
          };
          bestScore = scored;
        }
        return;
      }

      const rem = totalNozzles - pos + 1;

      if (groups.length + minNeeded(rem) > slotLimit) return;

      // hard prune: once we already have a best solution, do not explore
      // branches that must use more VCMs than that best solution
      if (best && groups.length + minNeeded(rem) > best.groups.length) return;

      for (const size of allowedSizes) {
        if (size > rem) continue;

        const info = validGroup(pos, size, totalNozzles, boundaryMap, ignoreBreakaway);
        if (!info) continue;

        groups.push(size);
        infos.push(info);
        dfs(
          pos + size,
          groups,
          infos,
          foldPenalty + (info.crosses || 0) + (info.majorCross || 0),
          centerSpan + (info.spansCenter || 0) + (info.spansPrimary || 0)
        );
        infos.pop();
        groups.pop();
      }
    }

    dfs(1, [], [], 0, 0);

    if (!best) {
      if (hub === 'lite') {
        alert('User must use manual mode to layout boom or switch to standard hub.');
      } else {
        alert('No legal AutoFit layout found. Use manual mode to layout boom.');
      }
      return null;
    }

    return best;
  }

  function applyAutoFitSolution(solution) {
    if (!solution) return false;

    clearVCMInputsOnly();

    const groups = solution.groups.slice();
    const infos = Array.isArray(solution.infos) ? solution.infos.slice() : [];
    const portCounts = solution.portCounts.slice();

    let idx = 0;

    for (let port = 1; port <= portCounts.length; port++) {
      const count = portCounts[port - 1];

      for (let seq = 1; seq <= count; seq++) {
        const size = groups[idx] || 0;
        const info = infos[idx] || null;

        setPortValue(port, seq, size);

        if (info) {
          const shiftVal = encodeAutoShift(size, info.leftCount, info.rightCount);
          setPortShift(port, seq, shiftVal);
        } else {
          setPortShift(port, seq, 0);
        }

        idx++;
      }
    }

    validateDropCount();
    scheduleDraw();
    setAutoFitState('auto');
    return true;
  }

  function handleAutoFitClick() {
    if (window.__currentIsFactory) return;

    const spacing = +iSpace.value || 0;
    if (!AUTOFIT_NOZZLE_SPACINGS.has(spacing)) {
      alert('AutoFit only supports 10", 15", or 20" nozzle spacing.\n\nPlease change Nozzle Spacing to 10, 15, or 20 to use AutoFit.');
      return;
    }

    if (autoFitState === 'auto') {
      clearVCMInputsOnly();
      clearHarnessOverrideState();
      extOverrides.clear();
      validateDropCount();
      scheduleDraw();
      setAutoFitState('manual');
      return;
    }

    window.__legacyHarnessMode = false;
    clearHarnessOverrideState();
    extOverrides.clear();
    const solution = findAutoFitSolution();
    if (solution) applyAutoFitSolution(solution);
  }

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
    const seeded = []; // disable baked-in sample presets

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
    // 1) Load folder index
    const idxRes = await fetch(FACTORY_PRESETS_URL, { cache: "no-store" });
    if (!idxRes.ok) throw new Error(`Factory preset index fetch failed: ${idxRes.status}`);

    const indexArr = await idxRes.json();
    if (!Array.isArray(indexArr)) throw new Error("factory_presets/index.json must be an array");

    // 2) Fetch each preset JSON
    const fetches = indexArr
      .filter(x => x && typeof x === "object" && typeof x.file === "string" && x.file.trim())
      .map(async (row) => {
        const file = row.file.trim();
// Encode spaces/special chars; keep any slashes if you later use subfolders
const safeFile = encodeURIComponent(file).replace(/%2F/g, '/');
const url = FACTORY_PRESETS_DIR + safeFile;
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`Preset fetch failed (${row.file}): ${r.status}`);
        const cfg = await r.json();

        // normalize id + metadata defaults (keeps Browse/locking stable)
        const meta = cfg?.metadata || {};
        const id = cfg?.id || cfg?.configId || row.id || row.file;

        return {
          ...cfg,
          id,
metadata: {
  ...meta,
  scope: "FACTORY_PRESET",
  status: "APPROVED"
}
        };
      });

    const loaded = (await Promise.all(fetches)).filter(Boolean);

    window.FACTORY_PRESETS = loaded;
    localStorage.setItem(LS_FACTORY, JSON.stringify(loaded));
  } catch (e) {
    // fallback to cached presets
    try {
      const cached = JSON.parse(localStorage.getItem(LS_FACTORY) || "[]");
      if (Array.isArray(cached) && cached.length) window.FACTORY_PRESETS = cached;
    } catch {}
    DERR?.(e, "refreshFactoryPresetsFromGitHub");
  }
}




const LS_MY='boomcfg.myConfigs.v1';

// ---- Factory presets source (GitHub) ----
// Factory presets (GitHub Pages): /data/factory_presets/index.json + individual preset files
const FACTORY_PRESETS_URL = "./data/factory_presets/index.json";
const FACTORY_PRESETS_DIR = "./data/factory_presets/";
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
      overrides,
      fiveFootDrops,
      dropExt5ftQty: (Number(window.USER_DROP_EXT_QTY) || 0)
    },

    harnesses: {
      version: 1,
      recipes: currentConfig?.harnesses?.recipes || {},
      overrides: currentConfig?.harnesses?.overrides || {},
      extOverrides: currentConfig?.harnesses?.extOverrides || {},
      autoSpacingIn: currentConfig?.harnesses?.autoSpacingIn ?? null,
      autoMode: currentConfig?.harnesses?.autoMode || 'auto'
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

        // Make the newly saved config the active config immediately
        currentConfig = normalizeConfig(cfg);
        if (typeof window.setDocsConfig === 'function') {
          window.setDocsConfig(currentConfig);
        } else {
          currentConfig = normalizeConfig(cfg);
        }

        if (iConfigName) iConfigName.value = currentConfig.name || cfg.name || '';
// Save (overwrite) is ONLY allowed for Draft "My Configs".
// Factory, Submitted, or Approved must create a new Draft instead.
if (!forceNewId) {
  const curStatus = (currentConfig?.metadata?.status || '').toUpperCase();
  const isDraft = (curStatus === 'DRAFT' || curStatus === '');
  if (window.__currentIsFactory || !isDraft) {
    forceNewId = true;
    // Rebuild cfg as a new draft ID + name
    const cfg2 = serializeCurrentToConfig(meta, true);

    cfg.id = cfg2.id;
    cfg.name = cfg2.name;
    cfg.meta = cfg2.meta;
    cfg.structure = cfg2.structure;
    cfg.vcm = cfg2.vcm;
    cfg.extensions = cfg2.extensions;
    cfg.harnesses = cfg2.harnesses;
    cfg.machine = cfg2.machine;
    cfg.installSteps = cfg2.installSteps;
    cfg.metadata = cfg2.metadata;

    currentConfig = normalizeConfig(cfg);
    if (typeof window.setDocsConfig === 'function') {
      window.setDocsConfig(currentConfig);
    }

    if (iConfigName) iConfigName.value = currentConfig.name || cfg.name || '';
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
		
		        if (typeof updateBoomMeta === 'function') {
          updateBoomMeta(lastBoomState || (typeof buildBoom === 'function' ? buildBoom() : null));
        }
        if (typeof scheduleDraw === 'function') {
          scheduleDraw();
        }

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
		      // IMPORTANT:
      // Detect legacy BEFORE normalization.
      // normalizeConfig() fills modern schema buckets and can mask a truly old file.
      // If raw input is legacy, stamp __legacyImported so the flag survives normalization
      // and the renderer can enter legacy mode correctly.
      const rawCfg = cfg || {};
      const rawWasLegacy = isLegacyHarnessProfile(rawCfg);

      cfg = normalizeConfig(rawCfg);

      if (rawWasLegacy) {
        cfg.__legacyImported = true;
      }

      currentConfig = cfg;

      const nameEl = document.getElementById('configName');
      if (nameEl) nameEl.value = cfg?.name || '';

      const get = id => document.getElementById(id);
      const setIfNum = (id, v) => { if (isFinite(v)) { const el=get(id); if (el) el.value=Number(v); } };
      const set = (id, v) => { if (v!=null) { const el=get(id); if (el) el.value=v; } };

      const m  = cfg?.meta || {};
      const st = cfg?.structure || {};
      const fd = (st.folds && !Array.isArray(st.folds)) ? st.folds : {};
      const vcm = cfg?.vcm || {};

      // 1,2,7,8
      setIfNum('totalNozzles',  m.totalNozzles);
      {
        const spacingEl = get('nozzleSpacing');
        const spacingVal = Number(m.nozzleSpacing);
        if (spacingEl) {
          spacingEl.value = [2, 4, 10, 15, 20, 30].includes(spacingVal) ? String(spacingVal) : '20';
        }
      }
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

	window.USER_DROP_EXT_QTY = Number(cfg?.extensions?.dropExt5ftQty) || 0;
      currentConfig.harnesses = {
        version: 1,
        recipes: cfg?.harnesses?.recipes || {},
        overrides: { ...(cfg?.harnesses?.overrides || {}) },
        extOverrides: { ...(cfg?.harnesses?.extOverrides || {}) },
        autoSpacingIn: cfg?.harnesses?.autoSpacingIn ?? null,
        autoMode: cfg?.harnesses?.autoMode || 'auto'
      };

      saveCurrentConfigToStorage();

      // Sync docs + install panels with this loaded config FIRST.
      // This is where __legacyHarnessMode gets set.
      if (typeof window.setDocsConfig === 'function') {
        window.setDocsConfig(cfg);
      } else if (typeof window.syncAutoFitStateFromLoadedConfig === 'function') {
        window.syncAutoFitStateFromLoadedConfig();
      }

      // NOW redraw, after legacy/factory mode has been established.
      if (typeof scheduleDraw === 'function') {
        scheduleDraw();
      }
      if (typeof validateDropCount === 'function') validateDropCount();
      if (typeof updateBoomMeta === 'function') updateBoomMeta(lastBoomState || buildBoom());

    } catch (e) { DERR?.(e, 'applyConfigToUI.shim'); }
  };
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
    if (typeof window.__markAutoFitDirty === 'function') window.__markAutoFitDirty();
  }catch(e){ DERR?.(e,'writeVCMs'); }
};

window.writeExtensions = function writeExtensions(overrides){
  try{
    const map = window.extOverrides;
    if (!map || typeof map.clear !== 'function' || typeof map.set !== 'function') return;

    map.clear();

    if (overrides instanceof Map) {
      overrides.forEach((v, k) => {
        const ft = Number(v);
        if (Number.isFinite(ft) && ft > 0) map.set(String(k), Math.round(ft));
      });
    } else if (overrides && typeof overrides === 'object') {
      for (const [k, v] of Object.entries(overrides)) {
        const ft = Number(v);
        if (Number.isFinite(ft) && ft > 0) map.set(String(k), Math.round(ft));
      }
    }

    if (typeof scheduleDraw === 'function') scheduleDraw();
  } catch (e) { DERR?.(e, 'writeExtensions'); }
};

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
  clearVCMInputsOnly(); 
  clearHarnessOverrideState();
  extOverrides.clear(); 
  scheduleDraw(); 
  validateDropCount();
  markAutoFitDirty();
  });
[iTotal,iSpace,iBreak,iOuter,iInner,iPrim,iGate].forEach(inp=>{
  if (!inp) return;
  inp.addEventListener('input', ()=>{
    clearVCMInputsOnly();
    clearHarnessOverrideState();
    scheduleDraw();
    validateDropCount();
    markAutoFitDirty();
  });
});

  iSpace?.addEventListener('change', ()=>{
    clearVCMInputsOnly();
    clearHarnessOverrideState();
    promptForHarnessSpacingMode();
    scheduleDraw();
    validateDropCount();
    markAutoFitDirty();
  });
  chkIgnoreBreakaway?.addEventListener('change', ()=>{
    clearVCMInputsOnly();
    clearHarnessOverrideState();
    extOverrides.clear();
    scheduleDraw();
    validateDropCount();
    markAutoFitDirty();
  });
  btnAutoFit?.addEventListener('click', handleAutoFitClick);
  iConfigName?.addEventListener('input', ()=> updateBoomMeta(lastBoomState||buildBoom()));
    btnReset?.addEventListener('click', ()=>{ DBG('RESET clicked'); Object.entries(DEFAULTS).forEach(([k,v])=>{ const d=el(k); if (d) d.value=v; }); clearHarnessOverrideState(); extOverrides.clear(); renderVCMInputs(hubMode.value||'lite'); clearVCMInputsOnly(); scheduleDraw(); validateDropCount(); setAutoFitState('needs'); });

  // Boot
  bootstrapFactoryPresets();
  refreshFactoryPresetsFromGitHub();
  renderVCMInputs(hubMode.value || 'lite');
  clearVCMInputsOnly();
  scheduleDraw();
  validateDropCount();
  setAutoFitState('needs');

  // Expose for console
  window.__boomcfg__ = { readMy:()=>JSON.parse(localStorage.getItem('boomcfg.myConfigs.v1')||'[]') };
});

