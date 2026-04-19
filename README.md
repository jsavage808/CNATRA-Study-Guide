# CNATRA Study Hub

Naval aviation training reference for **T-6B**, **T-44C**, and **T-45C** — discussion items from the Master Curriculum Guide (MCG) cross-referenced to their source documents (NATOPS, FTI, and supporting publications).

> **FOR STUDY USE ONLY.** Always verify all information against current-revision official publications before any flight. Boldface procedures must be memorized from current NATOPS.

---

## How It Works

The site loads three JSON data files (one per aircraft) that were generated from your uploaded curriculum and index files. Each discussion item from the MCG is linked to the top-scoring document chunks found in the supporting publications.

| Panel | What It Shows |
|---|---|
| **Discussion Items** | All MCG discussion items, filterable by block code and media type. Expand any item to see which document and page to study. |
| **Publications** | All referenced documents. Click VIEW REFS to filter discussion items sourced from that publication. |
| **Boldface / Emergency** | Emergency procedure steps for quick review (must be memorized from current NATOPS). |

---

## File Structure

```
cnatra-study-hub/
├── index.html                    ← single-page app shell
├── css/
│   └── style.css                 ← all styling
├── js/
│   └── app.js                    ← all rendering logic
├── data/
│   ├── all-discuss-locations.json   ← master source (all aircraft)
│   ├── all-index.json               ← master document/chunk index
│   ├── t6b/
│   │   └── discuss-data.json        ← generated T-6B data (47 items)
│   ├── t44c/
│   │   └── discuss-data.json        ← generated T-44C data (24 items)
│   └── t45c/
│       └── discuss-data.json        ← generated T-45C data (68 items)
├── pdfs/
│   └── raw/
│       ├── t6b/                  ← place T-6B PDFs here
│       ├── t44c/                 ← place T-44C PDFs here
│       └── t45c/                 ← place T-45C PDFs here
└── README.md
```

---

## Deploying to GitHub Pages

### First-time setup

1. Create a GitHub account at [github.com](https://github.com) if you don't have one.
2. Create a new **public** repository — e.g. `cnatra-study-hub`.
3. Upload all files from this project, maintaining the folder structure exactly.
4. Go to your repo → **Settings** → **Pages**.
5. Under **Source**, select **Deploy from a branch**, choose `main`, folder `/root`.
6. Click **Save**. Your site will be live at `https://yourusername.github.io/cnatra-study-hub/` within ~60 seconds.

### Hosting PDFs for direct page links

The discussion items include file paths like `t6b/CNATRA-P-816.pdf`. For the "OPEN PDF" links to work, place your PDF files in `pdfs/raw/` matching those paths:

```
pdfs/raw/t6b/CNATRA-P-816.pdf
pdfs/raw/t6b/A1-T6BAA-NFM-000.pdf
pdfs/raw/t44c/A1-T44CA-NFM-000.pdf
pdfs/raw/t45c/A1-T45CA-NFM-000.pdf
... etc
```

**GitHub file size limit:** GitHub has a 100MB limit per file and a 1GB soft limit per repository. Large NATOPS PDFs may need to be hosted externally:

- **GitHub LFS** (Large File Storage) — free for public repos up to 1GB, handles large PDFs natively
- **Cloudflare R2** — free for up to 10GB storage, then cheap. Best for large PDF libraries.
- **Google Drive** — upload PDFs, set sharing to "Anyone with link", use a direct-link URL converter

If using external hosting, edit the `url` field for each document in `data/{aircraft}/discuss-data.json`.

---

## Updating Discussion Data

The `data/{t6b,t44c,t45c}/discuss-data.json` files are the content source. They were generated from:
- `data/all-discuss-locations.json` — MCG discussion items with matched source locations
- `data/all-index.json` — full document and chunk index

### Regenerating the data files

If you get new versions of the source JSON files, run the generator script:

```bash
python3 generate-data.py
```

This reads `all-discuss-locations.json` and regenerates all three `discuss-data.json` files.

### Manually editing a discussion item

Open `data/t6b/discuss-data.json` and find the item. Each item looks like:

```json
{
  "id": "t6b-FAM2101",
  "blockCode": "FAM21",
  "blockTitle": "Familiarization Cockpit Procedures",
  "eventCode": "FAM2101",
  "media": "UTD",
  "discussText": "Checklist challenge-action response format...",
  "topics": ["Checklist challenge-action response format", "dual concurrence/response CRM", ...],
  "sourceRefs": [
    {
      "docId": "cnatra-p-816",
      "shortName": "FTI",
      "location": "CHAPTER FOUR PRIMARY CONTACT (page 68)",
      "pageStart": 68,
      "heading": "CHAPTER FOUR PRIMARY CONTACT",
      "snippet": "The accomplishment of a safe, productive flight...",
      "score": 52.648,
      "file": "t6b/CNATRA-P-816.pdf"
    }
  ]
}
```

You can add, remove, or edit `sourceRefs` entries. The `file` path determines whether a PDF link appears.

### Adding a PDF URL for a document

Find the document in the `documents` array of the relevant `discuss-data.json`:

```json
{
  "id": "cnatra-p-816",
  "shortName": "FTI Contact",
  "fullName": "FLIGHT TRAINING INSTRUCTION - Contact",
  "pubNumber": "CNATRA P-816",
  "type": "fti",
  "file": "t6b/CNATRA-P-816.pdf",
  "url": ""     ← add your external URL here if not using pdfs/raw/
}
```

---

## Media Type Codes

| Code | Meaning |
|---|---|
| UTD | Unit Training Device (simulator) |
| OFT | Operational Flight Trainer |
| VTD | Versatile Training Device |
| UTD/OFT | Both UTD and OFT |
| UTD/MR | UTD and Mission Rehearsal |

---

## Content Disclaimer

This site is a **study aid only**. It is not a substitute for official Naval Air Training Command (CNATRA) publications, NATOPS flight manuals, or official flight training instructions. Source location matches are generated algorithmically — always verify content against the complete, current-revision official publication. All boldface and emergency procedures must be memorized from the current revision of the applicable NATOPS flight manual.
