# CNATRA Study Hub

Naval aviation training reference for **T-6B**, **T-44C**, and **T-45C** — cross-referencing syllabus discussion items to their source documents (NATOPS, FTI, and supporting publications).

> **FOR STUDY USE ONLY.** Always verify all information against current-revision official publications before any flight. Boldface procedures must be memorized from current NATOPS.

---

## What This Site Does

- **Syllabus Panel** — displays all training events by phase. Click any event to filter discussion items linked to it.
- **Documents Panel** — lists all publications. Clicking "VIEW REFS" filters discussion items sourced from that document. If you add a PDF URL, an "OPEN PDF" button appears.
- **Discussion Items Panel** — the core feature. Every item shows:
  - The question (as it appears in the syllabus)
  - Which syllabus events it applies to
  - Which documents contain the answer, with the exact chapter/section to look in
  - An optional note hinting at what to focus on
- **Boldface Panel** — emergency procedure steps for quick review (must be memorized from current NATOPS).

---

## File Structure

```
cnatra-study-hub/
├── index.html              ← single-page app shell (do not edit layout)
├── css/
│   └── style.css           ← all styling (edit only if customizing appearance)
├── js/
│   └── app.js              ← all rendering logic (do not edit unless adding features)
├── data/
│   ├── t6b/
│   │   └── data.js         ← ✏️  ALL T-6B content lives here
│   ├── t44c/
│   │   └── data.js         ← ✏️  ALL T-44C content lives here
│   └── t45c/
│       └── data.js         ← ✏️  ALL T-45C content lives here
└── README.md
```

**You will spend nearly all your time editing the three `data/*.js` files.** The HTML, CSS, and JS are the engine — the data files are the content.

---

## Deploying to GitHub Pages (Free Hosting)

### First time setup

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Create a new repository — call it `cnatra-study-hub` (or any name you want).
3. Upload all the files from this project, maintaining the folder structure.
4. Go to your repo → **Settings** → **Pages**.
5. Under **Source**, select **Deploy from a branch**, choose `main`, folder `/root`.
6. Click **Save**. GitHub will give you a URL like `https://yourusername.github.io/cnatra-study-hub/`.

### Updating content

Every time you edit a data file:
1. Edit `data/t6b/data.js`, `data/t44c/data.js`, or `data/t45c/data.js` on your computer.
2. Go to your GitHub repo in the browser, click the file, click the pencil ✏️ icon, paste your changes, and click **Commit changes**.
3. The site updates within ~60 seconds.

Or use the GitHub Desktop app / VS Code for a more comfortable editing experience.

---

## How to Edit the Data Files

Each data file has four sections. Here is what to edit and how.

### 1. Linking a PDF document

Find the doc entry and add the URL:

```js
{
  id: "natops-t6b",
  shortName: "NATOPS",
  fullName: "NATOPS Flight Manual — T-6B Texan II",
  pubNumber: "A1-T6BAA-NFM-000",
  type: "NATOPS",
  url: "https://your-server.com/natops-t6b.pdf",   // ← add this
  description: "..."
}
```

Good places to host PDFs:
- **GitHub itself** — add the PDF to your repo. If it's under 25MB, it just works. Link: `https://raw.githubusercontent.com/yourusername/cnatra-study-hub/main/data/t6b/natops-t6b.pdf`
- **Google Drive** — upload, set to "Anyone with link can view", use a direct link generator to get a raw URL.
- **Dropbox** — share link, change `?dl=0` to `?raw=1`.

### 2. Adding a discussion item

Copy this template and add it to the `discussionItems` array in the correct aircraft's data file:

```js
{
  id: "t6b-sys-999",             // unique ID — use aircraft prefix + category + number
  category: "Systems",           // used for the filter buttons (must match other items of same type)
  question: "Your discussion item question exactly as written in the syllabus.",
  syllabusEvents: ["C-2001"],    // one or more event codes from syllabusPhases above
  sourceRefs: [
    {
      docId: "natops-t6b",       // must match a doc `id` in the docs array
      location: "Chapter 2 — Fuel System",   // chapter, section, page, or table name
      note: "Optional hint about what to look for."  // or remove this line
    },
    // add more refs if the answer spans multiple documents:
    {
      docId: "fti-contact",
      location: "Emergency Procedures section"
    }
  ]
}
```

**Rules:**
- `id` must be unique across the entire file.
- `syllabusEvents` values must match codes defined in `syllabusPhases`.
- `docId` values must match `id` values defined in the `docs` array.
- `category` is free text — whatever you use becomes a filter button. Be consistent (e.g. always "Systems", not sometimes "System").

### 3. Adding a syllabus event

Add to the correct phase in `syllabusPhases`:

```js
{ code: "C-2099", name: "My New Event", type: "Dual", hours: "1.2",
  description: "Brief description of what happens in this event." }
```

Then reference the code in discussion items' `syllabusEvents` arrays.

### 4. Adding a boldface procedure

```js
{
  id: "t6b-bf-999",
  title: "PROCEDURE NAME — ALL CAPS",
  warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
  steps: [
    "ITEM — ACTION",
    "ITEM — ACTION",
    "ITEM — ACTION"
  ]
}
```

### 5. Adding a new document type / publication

Add to the `docs` array:

```js
{
  id: "my-doc-id",          // lowercase, no spaces, unique within this file
  shortName: "Short Name",  // appears in source references
  fullName: "Full Publication Name",
  pubNumber: "CNATRA X-000",
  type: "Supporting",       // "NATOPS", "FTI", or "Supporting"
  url: "",                  // add URL when you have it hosted
  description: "What this publication covers."
}
```

---

## Adding a New Category of Discussion Items

The filter buttons on the Discussion panel are automatically generated from unique `category` values in the data. To add a new category, just use a new category name in a discussion item — the button appears automatically.

---

## Frequently Asked Questions

**Can I add a fourth aircraft?**
Yes. Create `data/t-xx/data.js` with the same structure, add a `<script src="data/t-xx/data.js"></script>` to `index.html`, add the aircraft to `AC_MAP` in `app.js`, and add an `<button>` to the `ac-switcher` in `index.html`.

**The PDF link shows "NOT LINKED" — how do I fix it?**
Add a URL to the `url` field of that document in the data file. See "Linking a PDF document" above.

**How do I make the site private?**
GitHub Pages is public. For a private site, use a private GitHub repo with GitHub Pages (requires GitHub Pro/Team) or deploy to Netlify with password protection. Alternatively, just share the URL only with your squadron — it won't be indexed by search engines without a sitemap.

**How do I add a note that a NATOPS revision changed a procedure?**
Update the `steps` array in the boldface section and/or update the `location` and `note` fields in the relevant `sourceRefs`. You can also add a `note` to a discussion item pointing to the revised section.

---

## PDF Pipeline

This repo now includes an offline PDF pipeline that:

1. auto-discovers every PDF under `pdfs/raw/t6b`, `pdfs/raw/t44c`, and `pdfs/raw/t45c`
2. indexes all publications so they are searchable by topic
3. extracts `Discuss Items` directly from the curriculum-guide PDFs
4. filters those extracted discuss items to simulator and flight events by default
5. suggests the publication and page where each discuss item is likely answered

### Files

- `tools/pdf_pipeline.py` â€” main pipeline script
- `pdfs/raw/` â€” place PDFs here, grouped by aircraft folder
- `generated/` â€” created automatically for indexes, extracted discuss items, and match results

### Folder layout

```text
pdfs/
  raw/
    t6b/
      *.pdf
    t44c/
      *.pdf
    t45c/
      *.pdf
```

PDF filenames do **not** need to match a strict naming convention. The script scans all `.pdf` files recursively and infers publication metadata from the file contents when possible.

### WSL workflow

From WSL:

```bash
cd /mnt/c/Users/bassg/linux/CNATRA-Study-Guide
source .venv/bin/activate   # if you created a virtualenv
```

Build a searchable index for every PDF:

```bash
python3 tools/pdf_pipeline.py index --output generated/all-index.json
```

Extract discuss items from curriculum guides only, limited to sim/flight events:

```bash
python3 tools/pdf_pipeline.py extract --output generated/all-discuss-items.json
```

Match those extracted discuss items against the indexed publications and get page/publication suggestions:

```bash
python3 tools/pdf_pipeline.py match \
  --index generated/all-index.json \
  --items generated/all-discuss-items.json \
  --output generated/all-discuss-locations.json
```

### Common commands

Only one aircraft:

```bash
python3 tools/pdf_pipeline.py index --aircraft T-45C --output generated/t45c-index.json
python3 tools/pdf_pipeline.py extract --aircraft T-45C --output generated/t45c-discuss-items.json
python3 tools/pdf_pipeline.py match \
  --aircraft T-45C \
  --index generated/t45c-index.json \
  --items generated/t45c-discuss-items.json \
  --output generated/t45c-discuss-locations.json
```

Search publications manually:

```bash
python3 tools/pdf_pipeline.py search \
  --index generated/all-index.json \
  --aircraft T-6B \
  --query "fuel system usable fuel imbalance"
```

### Output files

- `generated/all-index.json`
  Searchable chunks for every indexed publication, including title, inferred publication number, page, and snippet text.

- `generated/all-discuss-items.json`
  Discuss items extracted from curriculum guides. By default this excludes ground-only events and includes simulator/flight events only.

- `generated/all-discuss-locations.json`
  For each extracted discuss item, the top publication/page candidates where the answer is likely found.

### Notes

- The default extraction mode is `sim_flight`, which excludes ground events.
- The matcher excludes curriculum-guide PDFs by default so it points you toward NATOPS, FTI, checklists, supplements, and other supporting pubs instead of back to the syllabus itself.
- Some PDFs have messy OCR/text extraction. Always verify the suggested location manually before updating `data/*.js`.
- Boldface and emergency procedures must still be checked verbatim against the current NATOPS revision.

---

## Content Disclaimer

This site is a **study aid only**. It is not a substitute for official Naval Air Training Command (CNATRA) publications, NATOPS flight manuals, or official flight training instructions. All boldface and emergency procedures must be memorized from the current revision of the applicable NATOPS flight manual. Content accuracy is the responsibility of the person maintaining the data files.
