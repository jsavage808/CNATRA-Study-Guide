// ============================================================
// CNATRA STUDY HUB — APP LOGIC (JSON-driven)
// Data source: data/{t6b,t44c,t45c}/discuss-data.json
// ============================================================

let currentAC    = 'T-6B';
let currentPanel = 'discussion';
let blockFilter  = 'ALL';
let mediaFilter  = 'ALL';
let searchTerm   = '';
let acData       = {};

const ICONS = {
  discussion: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3h12v7H9l-3 4v-4H2z"/></svg>`,
  documents:  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/><path d="M6 9h4M6 11.5h3"/></svg>`,
  boldface:   `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 2L2 14h12L8 2z"/><path d="M8 7v4"/><circle cx="8" cy="12.5" r=".5" fill="currentColor"/></svg>`,
  doc:        `<svg viewBox="0 0 16 16" fill="none" stroke="#00e5ff" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/></svg>`,
  chevron:    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M4 6l4 4 4-4"/></svg>`,
};

const PANEL_NAV = [
  { id: 'discussion', label: 'Discussion Items',    icon: ICONS.discussion },
  { id: 'documents',  label: 'Publications',         icon: ICONS.documents  },
  { id: 'boldface',   label: 'Boldface / Emergency', icon: ICONS.boldface   },
];

const BOLDFACE_DATA = {
  'T-6B': [
    { title: 'ENGINE FIRE — ON DECK', steps: ['CONDITION LEVER — FUEL OFF','FIRE PULL HANDLE — PULL','AGENT SWITCH — PUSH (if fire persists)','EVACUATE AIRCRAFT'] },
    { title: 'ENGINE FAILURE IN FLIGHT', steps: ['THROTTLE — IDLE','LANDING SPOT — SELECT','AIRSPEED — 100 KIAS (best glide)','MAYDAY — TRANSMIT (121.5 or assigned freq)','EJECT — (if unable to make suitable field)'] },
    { title: 'ENGINE FIRE IN FLIGHT', steps: ['THROTTLE — IDLE','CONDITION LEVER — FUEL OFF','FIRE PULL HANDLE — PULL','AGENT SWITCH — PUSH','AIRSPEED — AS REQUIRED FOR LANDING / EJECT'] },
    { title: 'SMOKE AND FUMES — IMMEDIATE ACTION', steps: ['OXYGEN MASK — ON, 100%','BLEED AIR — OFF','PRESSURIZATION — DUMP','VENTS — OPEN','LAND AS SOON AS POSSIBLE'] },
  ],
  'T-44C': [
    { title: 'ENGINE FAILURE IN FLIGHT', steps: ['POWER (operating engine) — MAXIMUM','MIXTURES — RICH','PROPS — HIGH RPM','IDENTIFY — failed engine (foot on the dead engine)','VERIFY — retard throttle (confirm failure)','FEATHER — propeller of failed engine','GEAR — UP (if not already)','FLAPS — RETRACT','AIRSPEED — Vyse (blue line) or best available','TRIM — relieve rudder pressure'] },
    { title: 'ENGINE FIRE IN FLIGHT', steps: ['THROTTLE (affected engine) — CLOSE','MIXTURE (affected engine) — IDLE CUTOFF','PROP (affected engine) — FEATHER','FUEL SELECTOR (affected engine) — OFF','FIRE EXTINGUISHER — ARM / DISCHARGE','CROSSFEED — OFF','LAND AS SOON AS POSSIBLE'] },
    { title: 'ELECTRICAL FIRE / SMOKE IN COCKPIT', steps: ['OXYGEN MASKS — ON, 100%','NON-ESSENTIAL ELECTRICS — OFF','IDENTIFY source and isolate','LAND AS SOON AS POSSIBLE'] },
  ],
  'T-45C': [
    { title: 'ENGINE FAILURE IN FLIGHT', steps: ['PCL — IDLE','LANDING SPOT — SELECT','AIRSPEED — BEST GLIDE','MAYDAY — TRANSMIT','EJECT (if unable to make suitable landing area)'] },
    { title: 'ENGINE FIRE IN FLIGHT', steps: ['PCL — OFF','FIRE HANDLE — PULL','AGENT SWITCH — PUSH','EJECT (if fire continues)'] },
    { title: 'HYDRAULIC SYSTEM FAILURE', steps: ['HYD PRESSURE — CONFIRM LOSS','CROSS-TRANSFER VALVE — OPEN (if applicable)','LANDING GEAR — EMERGENCY EXTEND','DIVERT to nearest suitable field','ARRESTED LANDING — PLAN'] },
    { title: 'CABIN PRESSURIZATION FAILURE', steps: ['OXYGEN MASK — ON, 100%','DESCENT — INITIATE, 6,000 ft/min or max available','LEVEL OFF at 10,000 ft MSL (or MEA if higher)','PRESSURIZATION CONTROLS — CHECK / RESET','DIVERT if unable to pressurize'] },
  ],
};

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  loadAndSwitch('T-6B');
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.slice(1);
    if (['discussion','documents','boldface'].includes(h)) switchPanel(h);
  });
});

// ── DATA LOADING ────────────────────────────────────────────
async function loadAndSwitch(ac) {
  const key = ac.toLowerCase().replace('-','');
  if (!acData[ac]) {
    showLoading(true);
    try {
      const res = await fetch(`data/${key}/discuss-data.json`);
      if (!res.ok) throw new Error(res.status);
      acData[ac] = await res.json();
    } catch(e) {
      console.error('Failed to load', ac, e);
      showLoading(false);
      document.getElementById('discussion-content').innerHTML =
        `<div class="empty-state">Could not load data for ${ac}.<br>Ensure data/${key}/discuss-data.json exists.</div>`;
      return;
    }
  }
  currentAC   = ac;
  blockFilter = 'ALL';
  mediaFilter = 'ALL';
  searchTerm  = '';
  showLoading(false);
  document.querySelectorAll('.ac-btn').forEach(b => b.classList.toggle('active', b.dataset.ac === ac));
  const statusEl = document.getElementById('header-status');
  if (statusEl) statusEl.textContent = `A/C: ${ac}`;
  renderPanel(currentPanel);
}

function showLoading(on) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = on ? 'flex' : 'none';
}

// ── NAV ─────────────────────────────────────────────────────
function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = PANEL_NAV.map(l => `
    <a class="nav-link${l.id===currentPanel?' active':''}" href="#${l.id}" id="nav-${l.id}"
       onclick="switchPanel('${l.id}'); return false;">${l.icon}${l.label}</a>
  `).join('');
}

function switchPanel(panel) {
  currentPanel = panel;
  blockFilter  = 'ALL';
  mediaFilter  = 'ALL';
  searchTerm   = '';
  document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-'+panel)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.id==='nav-'+panel));
  renderPanel(panel);
  window.location.hash = panel;
  document.getElementById('sidebar')?.classList.remove('mobile-open');
}

function renderPanel(panel) {
  const data = acData[currentAC];
  if (!data) return;
  if (panel === 'discussion') renderDiscussion(data);
  if (panel === 'documents')  renderDocuments(data);
  if (panel === 'boldface')   renderBoldface();
}

// ── DISCUSSION ───────────────────────────────────────────────
function renderDiscussion(data) {
  const el        = document.getElementById('discussion-content');
  const filterBar = document.getElementById('disc-filter-bar');
  const countEl   = document.getElementById('disc-count');
  if (!el) return;

  const items = data.discussionItems;

  // Unique blocks
  const blocksSeen = new Set();
  const blocks = [];
  items.forEach(i => {
    if (i.blockCode && !blocksSeen.has(i.blockCode)) {
      blocksSeen.add(i.blockCode);
      blocks.push({ code: i.blockCode, title: i.blockTitle || i.blockCode });
    }
  });

  // Unique media
  const mediaTypes = [...new Set(items.map(i => i.media).filter(Boolean))].sort();

  // Filter bar
  if (filterBar) {
    const searchEl = document.getElementById('disc-search');
    if (searchEl) searchEl.value = searchTerm;
    filterBar.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;margin-right:2px;">BLOCK</span>
        <button class="filter-btn${blockFilter==='ALL'?' active':''}" onclick="setBlockFilter('ALL')">ALL</button>
        ${blocks.map(b=>`<button class="filter-btn${blockFilter===b.code?' active':''}" title="${b.title}" onclick="setBlockFilter('${b.code}')">${b.code}</button>`).join('')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px;">
        <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;margin-right:2px;">MEDIA</span>
        <button class="filter-btn${mediaFilter==='ALL'?' active':''}" onclick="setMediaFilter('ALL')">ALL</button>
        ${mediaTypes.map(m=>`<button class="filter-btn${mediaFilter===m?' active':''}" onclick="setMediaFilter('${m}')">${m}</button>`).join('')}
      </div>`;
  }

  // Apply filters
  let filtered = items;
  if (blockFilter !== 'ALL') filtered = filtered.filter(i => i.blockCode === blockFilter);
  if (mediaFilter !== 'ALL') filtered = filtered.filter(i => i.media === mediaFilter);
  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    filtered = filtered.filter(i =>
      i.discussText?.toLowerCase().includes(t) ||
      i.blockTitle?.toLowerCase().includes(t) ||
      i.eventCode?.toLowerCase().includes(t) ||
      i.topics?.some(tp => tp.toLowerCase().includes(t)) ||
      i.sourceRefs?.some(r => r.location?.toLowerCase().includes(t) || r.shortName?.toLowerCase().includes(t))
    );
  }

  if (countEl) {
    const parts = [];
    if (blockFilter !== 'ALL') parts.push('Block: '+blockFilter);
    if (mediaFilter !== 'ALL') parts.push('Media: '+mediaFilter);
    if (searchTerm)            parts.push(`"${searchTerm}"`);
    countEl.textContent = `${filtered.length} item${filtered.length!==1?'s':''}${parts.length?' · '+parts.join(' · '):' total'}`;
  }

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">NO DISCUSSION ITEMS MATCH YOUR FILTER<br>Try adjusting the block, media type, or search.</div>`;
    return;
  }

  // Group by block
  const grouped = {};
  filtered.forEach(item => {
    const key = item.blockCode || 'OTHER';
    if (!grouped[key]) grouped[key] = { title: item.blockTitle || key, items: [] };
    grouped[key].items.push(item);
  });

  let globalIdx = 0;
  el.innerHTML = Object.entries(grouped).map(([blockCode, group]) => `
    <div class="phase-block">
      <div class="phase-label">${blockCode} — ${group.title}</div>
      <div class="discussion-list">
        ${group.items.map(item => renderDiscItem(item, ++globalIdx)).join('')}
      </div>
    </div>`).join('');
}

function renderDiscItem(item, idx) {
  const hasRefs = item.sourceRefs && item.sourceRefs.length > 0;
  const primaryRef = hasRefs ? item.sourceRefs[0] : null;
  const additionalRefs = hasRefs ? item.sourceRefs.slice(1) : [];
  const topicsHtml = item.topics && item.topics.length > 1
    ? `<ul class="topic-list">${item.topics.map(t=>`<li>${highlight(t.trim(),searchTerm)}</li>`).join('')}</ul>`
    : '';

  return `
  <div class="disc-item" id="disc-${item.id}">
    <div class="disc-header" onclick="toggleDisc('${item.id}')">
      <div class="disc-num">${String(idx).padStart(2,'0')}</div>
      <div class="disc-meta">
        <div class="disc-event-row">
          <span class="event-tag hud">${item.eventCode || item.blockCode}</span>
          ${item.media ? `<span class="event-tag amber">${item.media}</span>` : ''}
          ${hasRefs ? `<span class="event-tag dim">${item.sourceRefs.length} ref${item.sourceRefs.length!==1?'s':''}</span>` : ''}
        </div>
        <div class="disc-question">${highlight(item.discussText||'',searchTerm)}</div>
      </div>
      <div class="disc-chevron">${ICONS.chevron}</div>
    </div>
    <div class="disc-body">
      ${topicsHtml ? `<div class="disc-section-label">TOPICS</div>${topicsHtml}` : ''}
      ${hasRefs ? `
        <div class="disc-section-label" style="margin-top:${topicsHtml?'14px':'0'}">WHERE TO FIND THE ANSWER</div>
        <div class="source-ref-stack">
          <div class="source-ref-primary">
            <div class="source-ref-caption">PRIMARY SOURCE</div>
            ${renderSourceRef(primaryRef, true)}
          </div>
          ${additionalRefs.length ? `
            <div class="source-ref-more">
              <button class="more-sources-btn" type="button" onclick="toggleMoreSources('${item.id}')">MORE SOURCES (${additionalRefs.length})</button>
              <div class="source-ref-list source-ref-list-hidden" id="more-sources-${item.id}">
                ${additionalRefs.map(ref=>renderSourceRef(ref, false)).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : '<div class="empty-state" style="padding:0.75rem 0;font-size:10px;">No source references found for this item.</div>'}
      ${item.curriculumFile ? `<div class="curriculum-ref">SOURCE: ${item.curriculumPubNumber||'MCG'} · Syllabus p.${item.curriculumPage}</div>` : ''}
    </div>
  </div>`;
}

function renderSourceRef(ref, isPrimary = false) {
  const pdfUrl = getPdfUrl(ref.docId, ref.file, ref.pageStart);
  return `
  <div class="source-ref${isPrimary ? ' primary' : ''}">
    <div class="source-ref-header">
      <span class="source-ref-doc">${ref.shortName || ref.docId}</span>
      ${ref.score ? `<span class="source-ref-score">SCORE ${Math.round(ref.score)}</span>` : ''}
    </div>
    <div class="source-ref-location">${ref.location||ref.heading||''}</div>
    ${ref.snippet ? `<div class="source-ref-snippet">${escHtml(ref.snippet.trim().substring(0,240))}${ref.snippet.length>240?'…':''}</div>` : ''}
    ${pdfUrl ? `<a class="source-ref-link" href="${pdfUrl}" target="_blank" rel="noopener">OPEN PDF — page ${ref.pageStart} ↗</a>` : ''}
  </div>`;
}

function toggleMoreSources(id) {
  const el = document.getElementById(`more-sources-${id}`);
  if (!el) return;
  el.classList.toggle('source-ref-list-hidden');
}

function toggleDisc(id) {
  const el = document.getElementById('disc-'+id);
  if (!el) return;
  const wasOpen = el.classList.contains('expanded');
  document.querySelectorAll('.disc-item.expanded').forEach(d=>d.classList.remove('expanded'));
  if (!wasOpen) el.classList.add('expanded');
}

function setBlockFilter(code) { blockFilter=code; renderDiscussion(acData[currentAC]); }
function setMediaFilter(m)    { mediaFilter=m;    renderDiscussion(acData[currentAC]); }
function handleSearch(val)    { searchTerm=val;   renderDiscussion(acData[currentAC]); }

// ── DOCUMENTS ────────────────────────────────────────────────
function renderDocuments(data) {
  const el = document.getElementById('documents-content');
  if (!el) return;

  const refCounts = {};
  data.discussionItems.forEach(item => {
    item.sourceRefs?.forEach(ref => {
      refCounts[ref.docId] = (refCounts[ref.docId]||0)+1;
    });
  });

  const byType = {};
  data.documents.forEach(doc => {
    const t = (doc.type||'other').toLowerCase();
    if (!byType[t]) byType[t] = [];
    byType[t].push(doc);
  });

  const typeOrder = ['natops','fti','mcg','cnatrainst','checklist','supporting','other'];
  const sortedTypes = Object.keys(byType).sort((a,b) => {
    const ai = typeOrder.indexOf(a), bi = typeOrder.indexOf(b);
    return (ai<0?99:ai)-(bi<0?99:bi);
  });

  el.innerHTML = sortedTypes.map(type => `
    <div class="section-divider">${type.toUpperCase()}</div>
    <div class="docs-grid">${byType[type].map(doc => {
      const count = refCounts[doc.id]||0;
      const pdfPath = getPdfUrl(doc.id, doc.file);
      return `
      <div class="doc-row">
        <div class="doc-icon">${ICONS.doc}</div>
        <div class="doc-info">
          <div class="doc-name">${escHtml(doc.fullName||doc.shortName||doc.id)}</div>
          <div class="doc-pub">${escHtml(doc.pubNumber||doc.id)}</div>
          ${count?`<div class="doc-ref-count">Referenced in ${count} discussion item${count!==1?'s':''}</div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;align-items:flex-end;">
          ${pdfPath
            ? `<a class="doc-open-btn" href="${pdfPath}" target="_blank" rel="noopener">OPEN PDF ↗</a>`
            : `<span class="doc-open-btn disabled">NOT LINKED</span>`}
          ${count?`<button class="doc-open-btn" onclick="filterByDoc('${doc.id}')">VIEW REFS</button>`:''}
        </div>
      </div>`; }).join('')}
    </div>`).join('');
}

function getPdfUrl(docId, file, pageStart) {
  const data = acData[currentAC];
  const document = data?.documents?.find(d => d.id === docId);
  const baseUrl = document?.url || (file ? `pdfs/raw/${file}` : '');
  if (!baseUrl) return '';
  return pageStart ? `${baseUrl}#page=${pageStart}` : baseUrl;
}

function filterByDoc(docId) {
  switchPanel('discussion');
  searchTerm = docId;
  renderDiscussion(acData[currentAC]);
}

// ── BOLDFACE ─────────────────────────────────────────────────
function renderBoldface() {
  const el = document.getElementById('boldface-content');
  if (!el) return;
  const procs = BOLDFACE_DATA[currentAC]||[];
  el.innerHTML = `<div class="boldface-grid">${procs.map(proc=>`
    <div class="bf-card">
      <div class="bf-header">
        <svg viewBox="0 0 16 16" fill="none" stroke="#ff4444" stroke-width="1.3" width="16" height="16"><path d="M8 2L2 14h12L8 2z"/></svg>
        <div class="bf-title">${proc.title}</div>
      </div>
      <div class="bf-steps">${proc.steps.map((step,i)=>`
        <div class="bf-step"><div class="bf-num">${i+1}.</div><div class="bf-text">${step}</div></div>`).join('')}
      </div>
      <div class="bf-warning">⚠ Memorize verbatim. Verify against current NATOPS revision before flight.</div>
    </div>`).join('')}</div>`;
}

// ── UTILS ────────────────────────────────────────────────────
function highlight(text, term) {
  if (!term||!text) return text||'';
  const e = term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return text.replace(new RegExp(e,'gi'), m=>`<mark>${m}</mark>`);
}
function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toggleMobileMenu() { document.getElementById('sidebar')?.classList.toggle('mobile-open'); }
