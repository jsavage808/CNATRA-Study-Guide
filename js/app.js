// ============================================================
// CNATRA STUDY HUB — MAIN APP LOGIC
// ============================================================

// —— STATE ————————————————————————————————————————————————————————
let currentAC = 'T-6B';
let currentPanel = 'syllabus';
let discFilter = 'ALL';
let searchTerm = '';
let discussionMode = 'curated';

const AC_MAP = {
  'T-6B': typeof T6B !== 'undefined' ? T6B : null,
  'T-44C': typeof T44C !== 'undefined' ? T44C : null,
  'T-45C': typeof T45C !== 'undefined' ? T45C : null,
};

const GENERATED_DISCUSS_MAP = typeof GENERATED_DISCUSS !== 'undefined' ? GENERATED_DISCUSS : {};

// —— ICONS ————————————————————————————————————————————————————————
const ICONS = {
  syllabus: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 6h6M5 8.5h6M5 11h4"/></svg>`,
  documents: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/><path d="M6 9h4M6 11.5h3"/></svg>`,
  discussion: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3h12v7H9l-3 4v-4H2z"/></svg>`,
  boldface: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 2L2 14h12L8 2z"/><path d="M8 7v4"/><circle cx="8" cy="12.5" r=".5" fill="currentColor"/></svg>`,
  doc: `<svg viewBox="0 0 16 16" fill="none" stroke="#00e5ff" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/></svg>`,
  chevron: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M4 6l4 4 4-4"/></svg>`,
};

// —— INIT —————————————————————————————————————————————————————————
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  switchAC('T-6B');
  checkUrlHash();
});

window.addEventListener('hashchange', checkUrlHash);

function checkUrlHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const panels = ['syllabus', 'documents', 'discussion', 'boldface'];
  if (panels.includes(hash)) {
    switchPanel(hash);
    return;
  }
  if (hash.startsWith('disc-')) {
    switchPanel('discussion');
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        expandDisc(el);
      }
    }, 100);
  }
}

// —— NAV ——————————————————————————————————————————————————————————
function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  const links = [
    { panel: 'syllabus', label: 'Syllabus Events', icon: ICONS.syllabus },
    { panel: 'documents', label: 'Publications', icon: ICONS.documents },
    { panel: 'discussion', label: 'Discussion Items', icon: ICONS.discussion },
    { panel: 'boldface', label: 'Boldface / Emergency', icon: ICONS.boldface },
  ];
  nav.innerHTML = links.map(l => `
    <a class="nav-link${l.panel === currentPanel ? ' active' : ''}"
       href="#${l.panel}"
       id="nav-${l.panel}"
       onclick="switchPanel('${l.panel}'); return false;">
      ${l.icon}${l.label}
    </a>
  `).join('');
}

// —— AIRCRAFT SWITCH ——————————————————————————————————————————————
function switchAC(ac) {
  currentAC = ac;
  discFilter = 'ALL';
  searchTerm = '';
  if (discussionMode === 'generated' && !hasGeneratedDiscuss(ac)) {
    discussionMode = 'curated';
  }

  document.querySelectorAll('.ac-btn').forEach(b => b.classList.toggle('active', b.dataset.ac === ac));
  const statusEl = document.getElementById('header-status');
  if (statusEl) statusEl.textContent = `A/C: ${ac}`;
  renderPanel(currentPanel);
}

// —— PANEL SWITCH ————————————————————————————————————————————————
function switchPanel(panel) {
  currentPanel = panel;
  discFilter = 'ALL';
  searchTerm = '';
  document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`panel-${panel}`);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.id === `nav-${panel}`);
  });
  renderPanel(panel);
  window.location.hash = panel;
  document.getElementById('sidebar')?.classList.remove('mobile-open');
}

function renderPanel(panel) {
  const data = AC_MAP[currentAC];
  if (!data) return;
  if (panel === 'syllabus') renderSyllabus(data);
  if (panel === 'documents') renderDocuments(data);
  if (panel === 'discussion') renderDiscussion(data);
  if (panel === 'boldface') renderBoldface(data);
}

// —— SYLLABUS ——————————————————————————————————————————————————————
function renderSyllabus(data) {
  const el = document.getElementById('syllabus-content');
  if (!el) return;
  el.innerHTML = data.syllabusPhases.map(phase => `
    <div class="phase-block">
      <div class="phase-label">${phase.phase}</div>
      <div class="events-grid">
        ${phase.events.map(ev => {
          const discCount = data.discussionItems.filter(d => d.syllabusEvents.includes(ev.code)).length;
          return `
          <div class="event-card" onclick="viewEventDiscussion('${ev.code}')">
            <div class="event-code">${ev.code}</div>
            <div class="event-name">${ev.name}</div>
            <div class="event-desc">${ev.description}</div>
            <div class="event-meta">
              <span class="badge badge-hud">${ev.type}</span>
              <span class="badge badge-amber">${ev.hours} HRS</span>
              ${discCount ? `<span class="badge">${discCount} Discussion Item${discCount !== 1 ? 's' : ''}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function viewEventDiscussion(code) {
  discFilter = code;
  searchTerm = '';
  switchPanel('discussion');
}

// —— DOCUMENTS —————————————————————————————————————————————————————
function renderDocuments(data) {
  const el = document.getElementById('documents-content');
  if (!el) return;

  const byType = {};
  data.docs.forEach(doc => {
    if (!byType[doc.type]) byType[doc.type] = [];
    byType[doc.type].push(doc);
  });

  el.innerHTML = Object.entries(byType).map(([type, docs]) => `
    <div class="section-divider">${type}</div>
    <div class="docs-grid">
      ${docs.map(doc => {
        const usageCount = data.discussionItems.filter(d => d.sourceRefs.some(r => r.docId === doc.id)).length;
        return `
        <div class="doc-row">
          <div class="doc-icon">${ICONS.doc}</div>
          <div class="doc-info">
            <div class="doc-name">${doc.fullName}</div>
            <div class="doc-pub">${doc.pubNumber}</div>
            <div class="doc-desc">${doc.description}</div>
            ${usageCount ? `<div style="margin-top:5px;font-family:var(--mono);font-size:9px;color:var(--text-dim);">Referenced in ${usageCount} discussion item${usageCount !== 1 ? 's' : ''}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">
            ${doc.url
              ? `<a class="doc-open-btn" href="${doc.url}" target="_blank" rel="noopener">OPEN PDF</a>`
              : `<span class="doc-open-btn disabled">NOT LINKED</span>`
            }
            <button class="doc-open-btn" onclick="filterByDoc('${doc.id}')">VIEW REFS</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  `).join('');
}

function filterByDoc(docId) {
  discFilter = `doc:${docId}`;
  searchTerm = '';
  switchPanel('discussion');
}

// —— DISCUSSION ————————————————————————————————————————————————————
function renderDiscussion(data) {
  const el = document.getElementById('discussion-content');
  const filterBar = document.getElementById('disc-filter-bar');
  const modeBar = document.getElementById('disc-mode-bar');
  const countEl = document.getElementById('disc-count');
  if (!el) return;

  const generatedAvailable = hasGeneratedDiscuss(currentAC);
  if (discussionMode === 'generated' && !generatedAvailable) discussionMode = 'curated';

  const allItems = discussionMode === 'generated'
    ? getGeneratedDiscussItems(currentAC)
    : data.discussionItems.map(item => ({ ...item, generated: false }));

  const categories = ['ALL', ...new Set(allItems.map(d => d.category))];
  const searchInput = document.getElementById('disc-search');
  if (searchInput) searchInput.value = searchTerm;

  if (modeBar) {
    modeBar.innerHTML = `
      <button class="filter-btn${discussionMode === 'curated' ? ' active' : ''}"
        onclick="setDiscussionMode('curated')">Curated</button>
      ${generatedAvailable ? `
        <button class="filter-btn${discussionMode === 'generated' ? ' active' : ''}"
          onclick="setDiscussionMode('generated')">Generated Sim/Flight</button>
      ` : ''}
      ${discussionMode === 'generated'
        ? `<div class="discussion-mode-note">Extracted from curriculum-guide discuss items and matched to publications/pages in your local PDF folders.</div>`
        : `<div class="discussion-mode-note">Hand-curated cross-references from the aircraft data files.</div>`
      }
    `;
  }

  if (filterBar) {
    const isCodeFilter = discFilter !== 'ALL' && !categories.includes(discFilter);
    filterBar.innerHTML = `
      ${categories.map(cat => `
        <button class="filter-btn${discFilter === cat ? ' active' : ''}"
          onclick="setDiscFilter('${escapeSingleQuotes(cat)}')">${cat}</button>
      `).join('')}
      ${isCodeFilter ? `<button class="filter-btn active" onclick="setDiscFilter('ALL')">× CLEAR FILTER</button>` : ''}
    `;
  }

  let items = allItems;

  if (discFilter.startsWith('doc:')) {
    const docId = discFilter.slice(4);
    items = items.filter(d => d.sourceRefs.some(r => r.docId === docId));
  } else if (discFilter !== 'ALL') {
    const isCat = categories.includes(discFilter);
    if (isCat) {
      items = items.filter(d => d.category === discFilter);
    } else {
      items = items.filter(d => (d.syllabusEvents || []).includes(discFilter));
    }
  }

  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    items = items.filter(d =>
      (d.question || '').toLowerCase().includes(t) ||
      (d.category || '').toLowerCase().includes(t) ||
      (d.blockTitle || '').toLowerCase().includes(t) ||
      (d.metaSummary || '').toLowerCase().includes(t) ||
      (d.syllabusEvents || []).some(code => (code || '').toLowerCase().includes(t)) ||
      d.sourceRefs.some(r =>
        (r.location || '').toLowerCase().includes(t) ||
        (r.note || '').toLowerCase().includes(t) ||
        (r.docLabel || '').toLowerCase().includes(t) ||
        (r.fullName || '').toLowerCase().includes(t)
      )
    );
  }

  if (countEl) {
    const filterLabel = discFilter !== 'ALL'
      ? (discFilter.startsWith('doc:') ? 'Filtered by document' : `Filtered: ${discFilter}`)
      : '';
    const modeLabel = discussionMode === 'generated' ? 'Generated sim/flight discuss items' : 'Curated discussion items';
    countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''} · ${modeLabel}${filterLabel ? ' · ' + filterLabel : ''}`;
  }

  if (items.length === 0) {
    el.innerHTML = `<div class="empty-state">NO DISCUSSION ITEMS MATCH YOUR FILTER<br>Adjust the category or clear the search.</div>`;
    return;
  }

  const docMap = {};
  data.docs.forEach(d => { docMap[d.id] = d; });

  el.innerHTML = items.map((item, idx) => {
    const highlightQ = highlight(item.question, searchTerm);
    const metaLine = item.generated && item.metaSummary
      ? `<div class="disc-submeta">${highlight(item.metaSummary, searchTerm)}</div>`
      : '';
    const originLine = item.generated && item.origin
      ? `<div class="disc-origin">${item.origin}</div>`
      : '';

    return `
    <div class="disc-item" id="disc-${item.id}" data-id="${item.id}">
      <div class="disc-header" onclick="toggleDisc('${item.id}')">
        <div class="disc-num">${String(idx + 1).padStart(2, '0')}</div>
        <div class="disc-meta">
          <div class="disc-category">${item.category}</div>
          ${metaLine}
          <div class="disc-question">${highlightQ}</div>
          <div class="disc-events">
            ${(item.syllabusEvents || []).map(code => `
              <span class="event-tag" onclick="event.stopPropagation(); viewEventDiscussion('${escapeSingleQuotes(code)}')" title="View all items for ${code}" style="cursor:pointer;">${code}</span>
            `).join('')}
          </div>
        </div>
        <div class="disc-chevron">${ICONS.chevron}</div>
      </div>
      <div class="disc-body">
        ${originLine}
        <div style="font-family:var(--mono);font-size:9px;color:var(--text-dim);letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;">Where to Find the Answer</div>
        <div class="source-ref-list">
          ${item.sourceRefs.map(ref => {
            const doc = docMap[ref.docId];
            const docLabel = ref.docLabel || `${doc ? doc.shortName : ref.docId} · ${doc ? doc.pubNumber : ''}`;
            const docUrl = ref.url || doc?.url || '';
            return `
            <div class="source-ref">
              <div class="source-ref-doc">${highlight(docLabel, searchTerm)}</div>
              <div class="source-ref-location">${highlight(ref.location || '', searchTerm)}</div>
              ${ref.note ? `<div class="source-ref-note">${highlight(ref.note, searchTerm)}</div>` : ''}
              ${docUrl ? `<a class="source-ref-link" href="${docUrl}" target="_blank" rel="noopener">OPEN DOCUMENT ↗</a>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleDisc(id) {
  const el = document.getElementById(`disc-${id}`);
  if (!el) return;
  const wasOpen = el.classList.contains('expanded');
  document.querySelectorAll('.disc-item.expanded').forEach(d => d.classList.remove('expanded'));
  if (!wasOpen) expandDisc(el);
}

function expandDisc(el) {
  el.classList.add('expanded');
}

function setDiscFilter(cat) {
  discFilter = cat;
  const data = AC_MAP[currentAC];
  if (data) renderDiscussion(data);
}

function setDiscussionMode(mode) {
  discussionMode = mode;
  discFilter = 'ALL';
  searchTerm = '';
  const data = AC_MAP[currentAC];
  if (data) renderDiscussion(data);
}

function handleSearch(val) {
  searchTerm = val;
  const data = AC_MAP[currentAC];
  if (data) renderDiscussion(data);
}

// —— BOLDFACE —————————————————————————————————————————————————————
function renderBoldface(data) {
  const el = document.getElementById('boldface-content');
  if (!el) return;
  el.innerHTML = `
    <div class="boldface-grid">
      ${data.boldface.map(proc => `
        <div class="bf-card">
          <div class="bf-header">
            <svg viewBox="0 0 16 16" fill="none" stroke="#ff4444" stroke-width="1.3" width="16" height="16"><path d="M8 2L2 14h12L8 2z"/></svg>
            <div class="bf-title">${proc.title}</div>
          </div>
          <div class="bf-steps">
            ${proc.steps.map((step, i) => `
              <div class="bf-step">
                <div class="bf-num">${i + 1}.</div>
                <div class="bf-text">${step}</div>
              </div>
            `).join('')}
          </div>
          <div class="bf-warning">⚠ ${proc.warning}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// —— GENERATED DISCUSS HELPERS ————————————————————————————————————
function hasGeneratedDiscuss(ac) {
  return Boolean(GENERATED_DISCUSS_MAP?.[ac]?.items?.length);
}

function getGeneratedDiscussItems(ac) {
  const payload = GENERATED_DISCUSS_MAP?.[ac];
  if (!payload?.items?.length) return [];

  return payload.items.map((item, idx) => {
    const blockStage = (item.blockCode || 'GEN').replace(/[0-9].*$/, '') || 'GEN';
    const syllabusEvents = item.eventCode
      ? [item.eventCode]
      : (item.eventRefs || []).filter(code => /^[A-Z]/.test(code || ''));

    return {
      id: `gen-${slugify(`${item.blockCode || 'block'}-${item.eventCode || idx}`)}`,
      category: blockStage,
      question: item.discussText,
      syllabusEvents,
      blockTitle: item.blockTitle || '',
      metaSummary: `${item.blockCode || 'BLOCK'} · ${item.blockTitle || 'Discuss Items'} · ${item.media || item.mediaClass || 'Generated'}`,
      origin: `Extracted from ${item.curriculumPublicationNumber || item.curriculumTitle} · ${item.blockCode || 'Block'} · curriculum pages ${item.pageStart}${item.pageEnd && item.pageEnd !== item.pageStart ? `-${item.pageEnd}` : ''}`,
      generated: true,
      sourceRefs: (item.suggestedLocations || []).map(loc => ({
        docId: loc.docId,
        docLabel: `${loc.shortName || 'DOC'} · ${loc.publicationNumber || loc.title}`,
        fullName: loc.title || '',
        location: loc.location || `Page ${loc.pageStart}`,
        note: [loc.title, loc.docType ? loc.docType.toUpperCase() : ''].filter(Boolean).join(' · '),
        url: '',
      })),
    };
  });
}

// —— UTILITIES —————————————————————————————————————————————————————
function highlight(text, term) {
  const safeText = String(text ?? '');
  if (!term) return safeText;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safeText.replace(new RegExp(escaped, 'gi'), m => `<mark>${m}</mark>`);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeSingleQuotes(value) {
  return String(value || '').replace(/'/g, "\\'");
}

// Mobile menu toggle
function toggleMobileMenu() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
}
