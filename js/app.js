// ============================================================
// CNATRA STUDY HUB - APP LOGIC (JSON-driven)
// Data source: data/{t6b,t44c,t45c}/discuss-data.json
// ============================================================

let currentAC = 'T-6B';
let currentPanel = 'discussion';
let blockFilter = 'ALL';
let mediaFilter = 'ALL';
let searchTerm = '';
let acData = {};

const ICONS = {
  discussion: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3h12v7H9l-3 4v-4H2z"/></svg>`,
  documents: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/><path d="M6 9h4M6 11.5h3"/></svg>`,
  boldface: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 2L2 14h12L8 2z"/><path d="M8 7v4"/><circle cx="8" cy="12.5" r=".5" fill="currentColor"/></svg>`,
  doc: `<svg viewBox="0 0 16 16" fill="none" stroke="#00e5ff" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/></svg>`,
};

const PANEL_NAV = [
  { id: 'discussion', label: 'Discussion Items', icon: ICONS.discussion },
  { id: 'documents', label: 'Publications', icon: ICONS.documents },
  { id: 'boldface', label: 'Boldface / Emergency', icon: ICONS.boldface },
];

const BOLDFACE_DATA = {
  'T-6B': [
    { title: 'ENGINE FIRE - ON DECK', steps: ['CONDITION LEVER - FUEL OFF', 'FIRE PULL HANDLE - PULL', 'AGENT SWITCH - PUSH (if fire persists)', 'EVACUATE AIRCRAFT'] },
    { title: 'ENGINE FAILURE IN FLIGHT', steps: ['THROTTLE - IDLE', 'LANDING SPOT - SELECT', 'AIRSPEED - 100 KIAS (best glide)', 'MAYDAY - TRANSMIT (121.5 or assigned freq)', 'EJECT - (if unable to make suitable field)'] },
    { title: 'ENGINE FIRE IN FLIGHT', steps: ['THROTTLE - IDLE', 'CONDITION LEVER - FUEL OFF', 'FIRE PULL HANDLE - PULL', 'AGENT SWITCH - PUSH', 'AIRSPEED - AS REQUIRED FOR LANDING / EJECT'] },
    { title: 'SMOKE AND FUMES - IMMEDIATE ACTION', steps: ['OXYGEN MASK - ON, 100%', 'BLEED AIR - OFF', 'PRESSURIZATION - DUMP', 'VENTS - OPEN', 'LAND AS SOON AS POSSIBLE'] },
  ],
  'T-44C': [
    { title: 'ENGINE FAILURE IN FLIGHT', steps: ['POWER (operating engine) - MAXIMUM', 'MIXTURES - RICH', 'PROPS - HIGH RPM', 'IDENTIFY - failed engine (foot on the dead engine)', 'VERIFY - retard throttle (confirm failure)', 'FEATHER - propeller of failed engine', 'GEAR - UP (if not already)', 'FLAPS - RETRACT', 'AIRSPEED - Vyse (blue line) or best available', 'TRIM - relieve rudder pressure'] },
    { title: 'ENGINE FIRE IN FLIGHT', steps: ['THROTTLE (affected engine) - CLOSE', 'MIXTURE (affected engine) - IDLE CUTOFF', 'PROP (affected engine) - FEATHER', 'FUEL SELECTOR (affected engine) - OFF', 'FIRE EXTINGUISHER - ARM / DISCHARGE', 'CROSSFEED - OFF', 'LAND AS SOON AS POSSIBLE'] },
    { title: 'ELECTRICAL FIRE / SMOKE IN COCKPIT', steps: ['OXYGEN MASKS - ON, 100%', 'NON-ESSENTIAL ELECTRICS - OFF', 'IDENTIFY source and isolate', 'LAND AS SOON AS POSSIBLE'] },
  ],
  'T-45C': [
    { title: 'ENGINE FAILURE IN FLIGHT', steps: ['PCL - IDLE', 'LANDING SPOT - SELECT', 'AIRSPEED - BEST GLIDE', 'MAYDAY - TRANSMIT', 'EJECT (if unable to make suitable landing area)'] },
    { title: 'ENGINE FIRE IN FLIGHT', steps: ['PCL - OFF', 'FIRE HANDLE - PULL', 'AGENT SWITCH - PUSH', 'EJECT (if fire continues)'] },
    { title: 'HYDRAULIC SYSTEM FAILURE', steps: ['HYD PRESSURE - CONFIRM LOSS', 'CROSS-TRANSFER VALVE - OPEN (if applicable)', 'LANDING GEAR - EMERGENCY EXTEND', 'DIVERT to nearest suitable field', 'ARRESTED LANDING - PLAN'] },
    { title: 'CABIN PRESSURIZATION FAILURE', steps: ['OXYGEN MASK - ON, 100%', 'DESCENT - INITIATE, 6,000 ft/min or max available', 'LEVEL OFF at 10,000 ft MSL (or MEA if higher)', 'PRESSURIZATION CONTROLS - CHECK / RESET', 'DIVERT if unable to pressurize'] },
  ],
};

document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  loadAndSwitch('T-6B');
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (['discussion', 'documents', 'boldface'].includes(hash)) {
      switchPanel(hash);
    }
  });
});

async function loadAndSwitch(ac) {
  const key = ac.toLowerCase().replace('-', '');
  if (!acData[ac]) {
    showLoading(true);
    try {
      const res = await fetch(`data/${key}/discuss-data.json`);
      if (!res.ok) throw new Error(res.status);
      acData[ac] = await res.json();
    } catch (error) {
      console.error('Failed to load', ac, error);
      showLoading(false);
      document.getElementById('discussion-content').innerHTML =
        `<div class="empty-state">Could not load data for ${ac}.<br>Ensure data/${key}/discuss-data.json exists.</div>`;
      return;
    }
  }

  currentAC = ac;
  blockFilter = 'ALL';
  mediaFilter = 'ALL';
  searchTerm = '';
  showLoading(false);

  document.querySelectorAll('.ac-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.ac === ac);
  });

  const statusEl = document.getElementById('header-status');
  if (statusEl) statusEl.textContent = `A/C: ${ac}`;
  renderPanel(currentPanel);
}

function showLoading(on) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = on ? 'flex' : 'none';
}

function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = PANEL_NAV.map(link => `
    <a class="nav-link${link.id === currentPanel ? ' active' : ''}" href="#${link.id}" id="nav-${link.id}"
       onclick="switchPanel('${link.id}'); return false;">${link.icon}${link.label}</a>
  `).join('');
}

function switchPanel(panel) {
  currentPanel = panel;
  blockFilter = 'ALL';
  mediaFilter = 'ALL';
  searchTerm = '';
  document.querySelectorAll('.content-panel').forEach(node => node.classList.remove('active'));
  document.getElementById(`panel-${panel}`)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(node => node.classList.toggle('active', node.id === `nav-${panel}`));
  renderPanel(panel);
  window.location.hash = panel;
  document.getElementById('sidebar')?.classList.remove('mobile-open');
}

function renderPanel(panel) {
  const data = acData[currentAC];
  if (!data) return;
  if (panel === 'discussion') renderDiscussion(data);
  if (panel === 'documents') renderDocuments(data);
  if (panel === 'boldface') renderBoldface();
}

function renderDiscussion(data) {
  const el = document.getElementById('discussion-content');
  const filterBar = document.getElementById('disc-filter-bar');
  const countEl = document.getElementById('disc-count');
  if (!el) return;

  const items = normalizeDiscussionItems(data.discussionItems || []);
  const blocksSeen = new Set();
  const blocks = [];
  items.forEach(item => {
    if (item.blockCode && !blocksSeen.has(item.blockCode)) {
      blocksSeen.add(item.blockCode);
      blocks.push({ code: item.blockCode, title: item.blockTitle || item.blockCode });
    }
  });

  const mediaTypes = [...new Set(items.map(item => item.media).filter(Boolean))].sort();

  if (filterBar) {
    const searchEl = document.getElementById('disc-search');
    if (searchEl) searchEl.value = searchTerm;
    filterBar.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;margin-right:2px;">BLOCK</span>
        <button class="filter-btn${blockFilter === 'ALL' ? ' active' : ''}" onclick="setBlockFilter('ALL')">ALL</button>
        ${blocks.map(block => `<button class="filter-btn${blockFilter === block.code ? ' active' : ''}" title="${block.title}" onclick="setBlockFilter('${block.code}')">${block.code}</button>`).join('')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px;">
        <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;margin-right:2px;">MEDIA</span>
        <button class="filter-btn${mediaFilter === 'ALL' ? ' active' : ''}" onclick="setMediaFilter('ALL')">ALL</button>
        ${mediaTypes.map(media => `<button class="filter-btn${mediaFilter === media ? ' active' : ''}" onclick="setMediaFilter('${media}')">${media}</button>`).join('')}
      </div>`;
  }

  let filtered = items;
  if (blockFilter !== 'ALL') filtered = filtered.filter(item => item.blockCode === blockFilter);
  if (mediaFilter !== 'ALL') filtered = filtered.filter(item => item.media === mediaFilter);
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.discussText?.toLowerCase().includes(term) ||
      item.blockTitle?.toLowerCase().includes(term) ||
      item.eventCode?.toLowerCase().includes(term) ||
      item.resolvedEventCode?.toLowerCase().includes(term) ||
      item.resolvedEventTitle?.toLowerCase().includes(term) ||
      item.topics?.some(topic => topic.toLowerCase().includes(term)) ||
      item.sourceRefs?.some(ref =>
        ref.location?.toLowerCase().includes(term) ||
        ref.shortName?.toLowerCase().includes(term) ||
        ref.docId?.toLowerCase().includes(term)
      )
    );
  }

  if (countEl) {
    const parts = [];
    if (blockFilter !== 'ALL') parts.push(`Block: ${blockFilter}`);
    if (mediaFilter !== 'ALL') parts.push(`Media: ${mediaFilter}`);
    if (searchTerm) parts.push(`"${searchTerm}"`);
    countEl.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}${parts.length ? ` - ${parts.join(' - ')}` : ' total'}`;
  }

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">NO DISCUSSION ITEMS MATCH YOUR FILTER<br>Try adjusting the block, media type, or search.</div>`;
    return;
  }

  const grouped = groupDiscussionForDisplay(filtered);
  let globalIdx = 0;
  el.innerHTML = grouped.map(group => `
    <div class="phase-block">
      <div class="phase-label">${group.blockCode} - ${group.title}</div>
      <div class="discussion-list">
        ${group.events.map(eventGroup => renderEventGroup(eventGroup, () => ++globalIdx)).join('')}
      </div>
    </div>
  `).join('');
}

function renderEventGroup(eventGroup, nextIndex) {
  const mediaLabel = eventGroup.media.length === 1 ? eventGroup.media[0] : `${eventGroup.media.length} media`;
  return `
    <section class="event-group-card">
      <div class="event-group-header">
        <div class="event-group-heading">
          <div class="event-group-tags">
            <span class="event-tag hud">${eventGroup.eventCode}</span>
            ${mediaLabel ? `<span class="event-tag amber">${mediaLabel}</span>` : ''}
            <span class="event-tag dim">${eventGroup.items.length} item${eventGroup.items.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="event-group-title">${highlight(eventGroup.eventCode, searchTerm)}</div>
          <div class="event-group-subtitle">${highlight(eventGroup.eventTitle, searchTerm)}</div>
        </div>
      </div>
      <div class="event-group-body">
        <div class="event-discussion-list">
          ${eventGroup.items.map(item => renderDiscussRow(item, nextIndex())).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderDiscussRow(item, idx) {
  const hasRefs = Array.isArray(item.sourceRefs) && item.sourceRefs.length > 0;
  const primaryRef = hasRefs ? item.sourceRefs[0] : null;
  const additionalRefs = hasRefs ? item.sourceRefs.slice(1) : [];
  const displayText = getDiscussDisplayText(item);
  const itemText = highlight(displayText, searchTerm);
  const primaryUrl = primaryRef ? getPdfUrl(primaryRef.docId, primaryRef.file, primaryRef.pageStart) : '';

  return `
    <article class="discuss-list-item" id="disc-${item.id}">
      <div class="discuss-list-main">
        <div class="disc-num">${String(idx).padStart(2, '0')}</div>
        <div class="discuss-list-content">
          ${primaryUrl
            ? `<a class="discuss-item-link" href="${primaryUrl}" target="_blank" rel="noopener">${itemText}</a>`
            : `<div class="discuss-item-link missing-link">${itemText}</div>`}
          <div class="discuss-list-meta">
            ${primaryRef ? `<span class="discuss-primary-doc">${escHtml(primaryRef.shortName || primaryRef.docId)}</span>` : ''}
            ${primaryRef?.location ? `<span class="discuss-primary-location">${escHtml(primaryRef.location)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="discuss-list-actions">
        ${additionalRefs.length ? `
          <button class="more-sources-btn" type="button" onclick="toggleMoreSources('${item.id}')">MORE SOURCES (${additionalRefs.length})</button>
          <div class="source-ref-list source-ref-list-hidden more-sources-panel" id="more-sources-${item.id}">
            ${additionalRefs.map(ref => renderSourceRef(ref, false)).join('')}
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderSourceRef(ref, isPrimary = false) {
  const pdfUrl = getPdfUrl(ref.docId, ref.file, ref.pageStart);
  return `
    <div class="source-ref${isPrimary ? ' primary' : ''}">
      <div class="source-ref-header">
        <span class="source-ref-doc">${escHtml(ref.shortName || ref.docId)}</span>
        ${ref.score ? `<span class="source-ref-score">SCORE ${Math.round(ref.score)}</span>` : ''}
      </div>
      <div class="source-ref-location">${escHtml(ref.location || ref.heading || '')}</div>
      ${ref.snippet ? `<div class="source-ref-snippet">${escHtml(ref.snippet.trim().substring(0, 240))}${ref.snippet.length > 240 ? '...' : ''}</div>` : ''}
      ${pdfUrl ? `<a class="source-ref-link" href="${pdfUrl}" target="_blank" rel="noopener">OPEN PDF - page ${ref.pageStart} -></a>` : ''}
    </div>
  `;
}

function toggleMoreSources(id) {
  const el = document.getElementById(`more-sources-${id}`);
  if (!el) return;
  el.classList.toggle('source-ref-list-hidden');
}

function setBlockFilter(code) {
  blockFilter = code;
  renderDiscussion(acData[currentAC]);
}

function setMediaFilter(media) {
  mediaFilter = media;
  renderDiscussion(acData[currentAC]);
}

function handleSearch(value) {
  searchTerm = value;
  renderDiscussion(acData[currentAC]);
}

function renderDocuments(data) {
  const el = document.getElementById('documents-content');
  if (!el) return;

  const refCounts = {};
  data.discussionItems.forEach(item => {
    item.sourceRefs?.forEach(ref => {
      refCounts[ref.docId] = (refCounts[ref.docId] || 0) + 1;
    });
  });

  const byType = {};
  data.documents.forEach(doc => {
    const type = (doc.type || 'other').toLowerCase();
    if (!byType[type]) byType[type] = [];
    byType[type].push(doc);
  });

  const typeOrder = ['natops', 'fti', 'mcg', 'cnatrainst', 'checklist', 'supporting', 'other'];
  const sortedTypes = Object.keys(byType).sort((a, b) => {
    const ai = typeOrder.indexOf(a);
    const bi = typeOrder.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });

  el.innerHTML = sortedTypes.map(type => `
    <div class="section-divider">${type.toUpperCase()}</div>
    <div class="docs-grid">${byType[type].map(doc => {
      const count = refCounts[doc.id] || 0;
      const pdfPath = getPdfUrl(doc.id, doc.file);
      return `
        <div class="doc-row">
          <div class="doc-icon">${ICONS.doc}</div>
          <div class="doc-info">
            <div class="doc-name">${escHtml(doc.fullName || doc.shortName || doc.id)}</div>
            <div class="doc-pub">${escHtml(doc.pubNumber || doc.id)}</div>
            ${count ? `<div class="doc-ref-count">Referenced in ${count} discussion item${count !== 1 ? 's' : ''}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;align-items:flex-end;">
            ${pdfPath
              ? `<a class="doc-open-btn" href="${pdfPath}" target="_blank" rel="noopener">OPEN PDF -></a>`
              : `<span class="doc-open-btn disabled">NOT LINKED</span>`}
            ${count ? `<button class="doc-open-btn" onclick="filterByDoc('${doc.id}')">VIEW REFS</button>` : ''}
          </div>
        </div>
      `;
    }).join('')}</div>
  `).join('');
}

function getPdfUrl(docId, file, pageStart) {
  const data = acData[currentAC];
  const document = data?.documents?.find(doc => doc.id === docId);
  const baseUrl = document?.url || (file ? `pdfs/raw/${file}` : '');
  if (!baseUrl) return '';
  return pageStart ? `${baseUrl}#page=${pageStart}` : baseUrl;
}

function filterByDoc(docId) {
  switchPanel('discussion');
  searchTerm = docId;
  renderDiscussion(acData[currentAC]);
}

function normalizeDiscussionItems(items) {
  const currentEventByBlock = {};
  return items.map((item, index) => {
    const blockCode = item.blockCode || 'OTHER';
    const explicitCode = normalizeEventCode(item.eventCode);
    const embeddedCode = extractEventCode(item.discussText) || extractEventCodeList(item.eventRefs || []);
    const resolvedEventCode = explicitCode || embeddedCode || currentEventByBlock[blockCode] || blockCode;
    currentEventByBlock[blockCode] = resolvedEventCode;

    const resolvedEventTitle = explicitCode || embeddedCode
      ? cleanEventTitle(item.discussText, resolvedEventCode, item.blockTitle)
      : cleanEventTitle(item.discussText, null, item.blockTitle);

    return {
      ...item,
      _originalIndex: index,
      resolvedEventCode,
      resolvedEventTitle: resolvedEventTitle || resolvedEventCode,
    };
  });
}

function groupDiscussionForDisplay(items) {
  const blockMap = new Map();

  items.forEach(item => {
    const blockCode = item.blockCode || 'OTHER';
    if (!blockMap.has(blockCode)) {
      blockMap.set(blockCode, {
        blockCode,
        title: item.blockTitle || blockCode,
        order: item._originalIndex ?? 0,
        events: [],
        eventMap: new Map(),
      });
    }

    const blockGroup = blockMap.get(blockCode);
    const eventKey = item.resolvedEventCode || blockCode;
    if (!blockGroup.eventMap.has(eventKey)) {
      const eventGroup = {
        eventCode: eventKey,
        eventTitle: item.resolvedEventTitle || eventKey,
        order: item._originalIndex ?? 0,
        media: new Set(),
        items: [],
      };
      blockGroup.eventMap.set(eventKey, eventGroup);
      blockGroup.events.push(eventGroup);
    }

    const eventGroup = blockGroup.eventMap.get(eventKey);
    if ((!eventGroup.eventTitle || eventGroup.eventTitle === eventKey) && item.resolvedEventTitle) {
      eventGroup.eventTitle = item.resolvedEventTitle;
    }
    if (item.media) eventGroup.media.add(item.media);
    eventGroup.items.push(item);
  });

  return [...blockMap.values()]
    .sort((a, b) => a.order - b.order)
    .map(blockGroup => ({
      blockCode: blockGroup.blockCode,
      title: blockGroup.title,
      events: blockGroup.events
        .sort((a, b) => a.order - b.order)
        .map(eventGroup => ({
          ...eventGroup,
          media: [...eventGroup.media],
        })),
    }));
}

function getDiscussDisplayText(item) {
  const text = (item.discussText || '').trim();
  const eventCode = item.resolvedEventCode || normalizeEventCode(item.eventCode);
  if (!text) return item.resolvedEventTitle || eventCode || 'Discussion item';

  if (eventCode) {
    const leadingPattern = new RegExp(`^(?:HUD\\s+)?${escapeRegExp(eventCode)}\\b\\s*[-:]*\\s*`, 'i');
    const cleaned = text.replace(leadingPattern, '').trim();
    if (cleaned) return cleaned;
  }

  return text;
}

function normalizeEventCode(value) {
  if (!value) return '';
  const trimmed = String(value).trim().toUpperCase();
  return /^[A-Z]{1,5}[0-9]{2,}[A-Z0-9]*$/.test(trimmed) ? trimmed : '';
}

function extractEventCode(text) {
  if (!text) return '';
  const match = String(text).toUpperCase().match(/\b[A-Z]{1,5}[0-9]{2,}[A-Z0-9]*\b/);
  return match ? match[0] : '';
}

function extractEventCodeList(values) {
  for (const value of values) {
    const code = normalizeEventCode(value);
    if (code) return code;
  }
  return '';
}

function cleanEventTitle(text, eventCode, fallback) {
  const raw = (text || '').trim();
  if (!raw) return fallback || eventCode || '';
  if (!eventCode) return raw;
  const leadingPattern = new RegExp(`^(?:HUD\\s+)?${escapeRegExp(eventCode)}\\b\\s*[-:]*\\s*`, 'i');
  const cleaned = raw.replace(leadingPattern, '').trim();
  return cleaned || fallback || eventCode;
}

function renderBoldface() {
  const el = document.getElementById('boldface-content');
  if (!el) return;
  const procs = BOLDFACE_DATA[currentAC] || [];
  el.innerHTML = `<div class="boldface-grid">${procs.map(proc => `
    <div class="bf-card">
      <div class="bf-header">
        <svg viewBox="0 0 16 16" fill="none" stroke="#ff4444" stroke-width="1.3" width="16" height="16"><path d="M8 2L2 14h12L8 2z"/></svg>
        <div class="bf-title">${proc.title}</div>
      </div>
      <div class="bf-steps">${proc.steps.map((step, index) => `
        <div class="bf-step"><div class="bf-num">${index + 1}.</div><div class="bf-text">${step}</div></div>
      `).join('')}</div>
      <div class="bf-warning">Memorize verbatim. Verify against current NATOPS revision before flight.</div>
    </div>
  `).join('')}</div>`;
}

function highlight(text, term) {
  if (!term || !text) return text || '';
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'gi'), match => `<mark>${match}</mark>`);
}

function escHtml(value) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toggleMobileMenu() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
}
