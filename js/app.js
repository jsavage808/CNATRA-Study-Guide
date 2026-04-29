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
let studyData = {};
let studyTab = 'procedures';
let quizState = {
  mode: 'procedure',
  question: null,
  revealed: false,
  checked: false,
};

const ICONS = {
  discussion: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3h12v7H9l-3 4v-4H2z"/></svg>`,
  documents: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/><path d="M6 9h4M6 11.5h3"/></svg>`,
  boldface: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3.5h12M2 8h12M2 12.5h12"/><path d="M12.5 2.5v11"/></svg>`,
  doc: `<svg viewBox="0 0 16 16" fill="none" stroke="#00e5ff" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/></svg>`,
};

const PANEL_NAV = [
  { id: 'discussion', label: 'Discussion Items', icon: ICONS.discussion },
  { id: 'documents', label: 'Publications', icon: ICONS.documents },
  { id: 'boldface', label: 'EPs / Limits / Quiz', icon: ICONS.boldface },
];

document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  initializeApp();
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (['discussion', 'documents', 'boldface'].includes(hash)) {
      switchPanel(hash);
    }
  });
});

async function initializeApp() {
  await loadStudyData();
  loadAndSwitch('T-6B');
}

async function loadStudyData() {
  try {
    const res = await fetch('data/study-data.json?v=20260429b', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    studyData = await res.json();
  } catch (error) {
    console.error('Failed to load study data', error);
    studyData = {};
  }
}

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
  quizState = {
    mode: 'procedure',
    question: null,
    revealed: false,
    checked: false,
  };
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
  if (panel === 'boldface') renderStudyPanel();
}

function renderDiscussion(data) {
  const el = document.getElementById('discussion-content');
  const filterBar = document.getElementById('disc-filter-bar');
  const countEl = document.getElementById('disc-count');
  if (!el) return;

  const items = normalizeDiscussionItems(preprocessDiscussionItems(data.discussionItems || []));
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
  const eventId = slugifyEventId(eventGroup.eventCode);
  const previewText = eventGroup.items
    .map(item => getDiscussDisplayText(item))
    .filter(Boolean)
    .join(', ');
  return `
    <section class="event-section" id="event-${eventId}">
      <button class="event-section-header" type="button" onclick="toggleEventSection('${eventId}')">
        <div class="event-section-code">${highlight(eventGroup.eventCode, searchTerm)}</div>
        <div class="event-section-title">${highlight(previewText || eventGroup.eventTitle, searchTerm)}</div>
        <div class="event-section-chevron" aria-hidden="true"></div>
      </button>
      <ul class="event-bullet-list event-bullet-list-hidden" id="event-list-${eventId}">
        ${eventGroup.items.map(item => renderDiscussRow(item, nextIndex())).join('')}
      </ul>
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
    <li class="discuss-bullet-item" id="disc-${item.id}">
      <div class="discuss-list-main">
        <div class="discuss-list-content">
          ${primaryUrl
            ? `<a class="discuss-item-link" href="${primaryUrl}" target="_blank" rel="noopener">${itemText}</a>`
            : `<div class="discuss-item-link missing-link">${itemText}</div>`}
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
    </li>
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

function toggleEventSection(eventId) {
  const section = document.getElementById(`event-${eventId}`);
  const list = document.getElementById(`event-list-${eventId}`);
  if (!section || !list) return;
  const isOpen = section.classList.contains('open');
  section.classList.toggle('open', !isOpen);
  list.classList.toggle('event-bullet-list-hidden', isOpen);
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
    const textCode = extractEventCode(item.discussText);
    const refCode = extractEventCodeList(item.eventRefs || [], blockCode, currentEventByBlock[blockCode]);
    const resolvedEventCode = explicitCode || textCode || refCode || currentEventByBlock[blockCode] || blockCode;
    currentEventByBlock[blockCode] = resolvedEventCode;

    const resolvedEventTitle = explicitCode || textCode
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

function preprocessDiscussionItems(items) {
  const expanded = [];

  items.forEach((item, index) => {
    const split = splitEmbeddedEventTransition(item);
    if (!split) {
      expanded.push({ ...item, _sourceIndex: index });
      return;
    }

    if (split.currentText) {
      expanded.push({
        ...item,
        discussText: split.currentText,
        _sourceIndex: index,
      });
    }

    expanded.push({
      ...item,
      id: `${item.id || `item-${index}`}-split-${split.nextCode.toLowerCase()}`,
      discussText: `${split.nextCode} ${split.nextText}`.trim(),
      eventCode: split.nextCode,
      topics: split.nextText ? [split.nextText] : item.topics,
      _sourceIndex: index + 0.1,
      _syntheticSplit: true,
    });
  });

  return expanded;
}

function splitEmbeddedEventTransition(item) {
  const text = String(item.discussText || '').trim();
  if (!text) return null;

  const matches = [...text.toUpperCase().matchAll(/\b([A-Z]{1,5}[0-9]{2,}[A-Z0-9]*)\b/g)];
  if (!matches.length) return null;

  const first = matches[0];
  if (first.index === 0) return null;

  const nextCode = first[1];
  const currentText = text.slice(0, first.index).trim().replace(/[;,:-]\s*$/, '').trim();
  const nextText = text.slice(first.index + nextCode.length).trim();

  if (!currentText || !nextText) return null;
  return { currentText, nextCode, nextText };
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

function extractEventCodeList(values, blockCode = '', activeCode = '') {
  const codes = values
    .map(value => normalizeEventCode(value))
    .filter(Boolean);

  const normalizedBlock = normalizeEventCode(blockCode);
  const normalizedActive = normalizeEventCode(activeCode);

  if (normalizedActive && codes.includes(normalizedActive)) {
    return normalizedActive;
  }

  const specificCandidates = codes.filter(code => code !== normalizedBlock && code.length > normalizedBlock.length);
  if (specificCandidates.length) {
    return specificCandidates[0];
  }

  return codes.find(code => code !== normalizedBlock) || normalizedBlock || '';
}

function cleanEventTitle(text, eventCode, fallback) {
  const raw = (text || '').trim();
  if (!raw) return fallback || eventCode || '';
  if (!eventCode) return raw;
  const leadingPattern = new RegExp(`^(?:HUD\\s+)?${escapeRegExp(eventCode)}\\b\\s*[-:]*\\s*`, 'i');
  const cleaned = raw.replace(leadingPattern, '').trim();
  return cleaned || fallback || eventCode;
}

function renderStudyPanel() {
  const el = document.getElementById('boldface-content');
  if (!el) return;

  const study = studyData[currentAC];
  if (!study) {
    el.innerHTML = `<div class="empty-state">No study data found for ${currentAC}.<br>Refresh the page once to pick up the new study assets, then verify <code>data/study-data.json</code> is being served.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="study-shell">
      <div class="study-tab-row">
        <button class="study-tab${studyTab === 'procedures' ? ' active' : ''}" type="button" onclick="setStudyTab('procedures')">EPs</button>
        <button class="study-tab${studyTab === 'limits' ? ' active' : ''}" type="button" onclick="setStudyTab('limits')">Limits</button>
        <button class="study-tab${studyTab === 'quiz' ? ' active' : ''}" type="button" onclick="setStudyTab('quiz')">Quiz</button>
      </div>
      <div class="study-pane">
        ${studyTab === 'procedures' ? renderStudyProcedures(study) : ''}
        ${studyTab === 'limits' ? renderStudyLimits(study) : ''}
        ${studyTab === 'quiz' ? renderStudyQuiz(study) : ''}
      </div>
    </div>
  `;
}

function setStudyTab(tab) {
  studyTab = tab;
  if (tab === 'quiz' && !quizState.question) {
    buildQuizQuestion('procedure');
  }
  renderStudyPanel();
}

function renderStudyProcedures(study) {
  return `
    <div class="study-summary">
      <div class="study-summary-copy">
        <div class="study-summary-title">${study.title} emergency procedures</div>
        <div class="study-summary-text">Memorize from the cited NATOPS or checklist page. Use the quiz tab to practice the sequence from memory.</div>
      </div>
      <div class="study-summary-badge">${study.emergencyProcedures.length} procedures</div>
    </div>
    <div class="study-card-grid">
      ${study.emergencyProcedures.map(proc => renderProcedureCard(proc)).join('')}
    </div>
  `;
}

function renderProcedureCard(proc) {
  const sourceLink = getStudySourceUrl(proc.source);
  return `
    <article class="study-card">
      <div class="study-card-head">
        <div>
          <div class="study-card-kicker">${escHtml(proc.category || 'Emergency Procedure')}</div>
          <h3 class="study-card-title">${escHtml(proc.title)}</h3>
        </div>
        ${sourceLink ? `<a class="study-source-link" href="${sourceLink}" target="_blank" rel="noopener">${escHtml(proc.source.label || 'Source')} p.${proc.source.page}</a>` : ''}
      </div>
      <ol class="study-steps">
        ${proc.steps.map(step => `<li>${escHtml(step)}</li>`).join('')}
      </ol>
      ${proc.note ? `<div class="study-note">${escHtml(proc.note)}</div>` : ''}
      ${proc.source?.location ? `<div class="study-source-meta">${escHtml(proc.source.location)}</div>` : ''}
    </article>
  `;
}

function renderStudyLimits(study) {
  return `
    <div class="study-summary">
      <div class="study-summary-copy">
        <div class="study-summary-title">${study.title} operating limits</div>
        <div class="study-summary-text">Compact NATOPS-backed reference for high-frequency numbers and configuration limits.</div>
      </div>
      <div class="study-summary-badge">${study.limits.length} limit items</div>
    </div>
    <div class="limits-grid">
      ${study.limits.map(limit => renderLimitCard(limit)).join('')}
    </div>
  `;
}

function renderLimitCard(limit) {
  const sourceLink = getStudySourceUrl(limit.source);
  return `
    <article class="limit-card">
      <div class="limit-label">${escHtml(limit.label)}</div>
      <div class="limit-value">${escHtml(limit.value)}</div>
      <div class="limit-footer">
        ${limit.source?.location ? `<span>${escHtml(limit.source.location)}</span>` : '<span></span>'}
        ${sourceLink ? `<a class="study-source-link" href="${sourceLink}" target="_blank" rel="noopener">${escHtml(limit.source.label || 'Source')} p.${limit.source.page}</a>` : ''}
      </div>
    </article>
  `;
}

function renderStudyQuiz(study) {
  const question = quizState.question;
  const isProcedure = quizState.mode === 'procedure';
  return `
    <div class="quiz-toolbar">
      <div class="quiz-toggle">
        <button class="study-tab${quizState.mode === 'procedure' ? ' active' : ''}" type="button" onclick="buildQuizQuestion('procedure')">EP Quiz</button>
        <button class="study-tab${quizState.mode === 'limit' ? ' active' : ''}" type="button" onclick="buildQuizQuestion('limit')">Limits Quiz</button>
      </div>
      <button class="doc-open-btn" type="button" onclick="buildQuizQuestion('${quizState.mode}')">Next Question</button>
    </div>
    ${question ? `
      <div class="quiz-card">
        <div class="quiz-card-head">
          <div class="quiz-kicker">${isProcedure ? 'Procedure Sequence' : 'Limits Recall'}</div>
          <h3 class="quiz-title">${escHtml(question.title)}</h3>
          ${question.prompt ? `<div class="quiz-prompt">${escHtml(question.prompt)}</div>` : ''}
        </div>
        ${isProcedure ? renderProcedureQuizBody(question) : renderLimitQuizBody(question)}
        <div class="quiz-actions">
          <button class="doc-open-btn" type="button" onclick="checkQuizAnswers()">Check Answers</button>
          <button class="doc-open-btn" type="button" onclick="revealQuizAnswers()">Reveal Answers</button>
          ${question.source ? `<a class="doc-open-btn" href="${getStudySourceUrl(question.source)}" target="_blank" rel="noopener">Open Source</a>` : ''}
        </div>
      </div>
    ` : `<div class="empty-state">No quiz items available for ${currentAC}.</div>`}
  `;
}

function renderProcedureQuizBody(question) {
  return `
    <div class="quiz-answer-list">
      ${question.steps.map((step, index) => `
        <div class="quiz-row">
          <label class="quiz-row-label">${index + 1}.</label>
          <div class="quiz-row-main">
            <input class="quiz-input" type="text" id="quiz-procedure-${index}" placeholder="Type step ${index + 1}">
            <div class="quiz-feedback" id="quiz-feedback-${index}">${quizState.revealed ? escHtml(step) : ''}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLimitQuizBody(question) {
  return `
    <div class="quiz-answer-list">
      <div class="quiz-row">
        <label class="quiz-row-label">A.</label>
        <div class="quiz-row-main">
          <input class="quiz-input" type="text" id="quiz-limit-answer" placeholder="Type the limit or value">
          <div class="quiz-feedback" id="quiz-feedback-limit">${quizState.revealed ? escHtml(question.answer) : ''}</div>
        </div>
      </div>
    </div>
  `;
}

function buildQuizQuestion(mode = 'procedure') {
  const study = studyData[currentAC];
  if (!study) return;
  const bank = mode === 'procedure' ? study.emergencyProcedures : study.limits;
  if (!bank.length) return;

  const picked = bank[Math.floor(Math.random() * bank.length)];
  quizState = {
    mode,
    revealed: false,
    checked: false,
    question: mode === 'procedure'
      ? { ...picked }
      : {
          title: picked.label,
          prompt: 'State the limit as published.',
          answer: picked.value,
          source: picked.source,
        },
  };
  renderStudyPanel();
}

function revealQuizAnswers() {
  quizState.revealed = true;
  renderStudyPanel();
}

function checkQuizAnswers() {
  if (!quizState.question) return;
  quizState.checked = true;

  if (quizState.mode === 'procedure') {
    quizState.question.steps.forEach((step, index) => {
      const input = document.getElementById(`quiz-procedure-${index}`);
      const feedback = document.getElementById(`quiz-feedback-${index}`);
      if (!input || !feedback) return;
      const result = gradeAnswer(step, input.value);
      feedback.textContent = `${result.label}: ${step}`;
      feedback.className = `quiz-feedback ${result.className}`;
    });
    return;
  }

  const input = document.getElementById('quiz-limit-answer');
  const feedback = document.getElementById('quiz-feedback-limit');
  if (!input || !feedback) return;
  const result = gradeAnswer(quizState.question.answer, input.value);
  feedback.textContent = `${result.label}: ${quizState.question.answer}`;
  feedback.className = `quiz-feedback ${result.className}`;
}

function gradeAnswer(expected, actual) {
  const normalizedExpected = normalizeQuizText(expected);
  const normalizedActual = normalizeQuizText(actual);

  if (!normalizedActual) {
    return { label: 'No answer', className: 'quiz-feedback-miss' };
  }
  if (normalizedActual === normalizedExpected) {
    return { label: 'Correct', className: 'quiz-feedback-correct' };
  }

  const expectedTokens = normalizedExpected.split(' ').filter(Boolean);
  const actualTokens = normalizedActual.split(' ').filter(Boolean);
  const overlap = expectedTokens.filter(token => actualTokens.includes(token)).length;
  const ratio = expectedTokens.length ? overlap / expectedTokens.length : 0;

  if (ratio >= 0.65) {
    return { label: 'Close', className: 'quiz-feedback-close' };
  }
  return { label: 'Incorrect', className: 'quiz-feedback-miss' };
}

function normalizeQuizText(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function getStudySourceUrl(source) {
  if (!source) return '';
  if (source.url) return source.url;
  const baseUrl = source.file ? `pdfs/raw/${source.file}` : '';
  return source.page ? `${baseUrl}#page=${source.page}` : baseUrl;
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

function slugifyEventId(value) {
  return String(value || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function toggleMobileMenu() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
}
