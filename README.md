# CNATRA Study Hub

Naval aviation training reference for `T-6B`, `T-44C`, and `T-45C`. Discussion items from the Master Curriculum Guide (MCG) are cross-referenced to source documents such as NATOPS, FTI, and supporting publications.

> For study use only. Always verify all information against current official publications before any flight. Boldface procedures must be memorized from current NATOPS.

## How It Works

The site loads three generated JSON files, one per aircraft. Each MCG discussion item is linked to top-scoring chunks from the indexed publications for that same aircraft.

| Panel | What It Shows |
|---|---|
| Discussion Items | All MCG discussion items, filterable by block code and media type. |
| Publications | All referenced documents. |
| Boldface / Emergency | Quick-review emergency steps. |

## File Structure

```text
cnatra-study-hub/
|-- index.html
|-- css/
|   `-- style.css
|-- js/
|   `-- app.js
|-- data/
|   |-- all-discuss-locations.json
|   |-- all-index.json
|   |-- t6b/
|   |   `-- discuss-data.json        <- generated T-6B data (85 items)
|   |-- t44c/
|   |   `-- discuss-data.json        <- generated T-44C data (48 items)
|   `-- t45c/
|       `-- discuss-data.json        <- generated T-45C data (122 items)
|-- generated/
|   |-- all-discuss-items.json
|   |-- t6b-discuss-locations.json
|   |-- t44c-discuss-locations.json
|   `-- t45c-discuss-locations.json
|-- pdfs/
|   `-- raw/
|       |-- t6b/
|       |-- t44c/
|       `-- t45c/
|-- tools/
|   `-- pdf_pipeline.py
|-- generate-data.py
`-- README.md
```

## Hosting PDFs

For the PDF links in the site to work, place your publications in the matching aircraft folders:

```text
pdfs/raw/t6b/
pdfs/raw/t44c/
pdfs/raw/t45c/
```

The source PDFs under `pdfs/raw/` are meant to stay local for indexing and matching. They are ignored by Git and should not be committed to the repository.

If you host PDFs elsewhere, edit the `url` field in the relevant `data/{aircraft}/discuss-data.json`.

Recommended external hosting for large NATOPS files:

- Google Drive: upload the PDF, share it as "Anyone with the link", and paste the share URL into the document `url` field
- GitHub Pages or another static host: only practical for smaller PDFs
- Git LFS: possible, but requires `git-lfs` to be installed and adds storage/bandwidth management

## Updating Discussion Data

The web UI reads:

- `data/t6b/discuss-data.json`
- `data/t44c/discuss-data.json`
- `data/t45c/discuss-data.json`

Those files are generated from:

- `data/all-discuss-locations.json` <- matched discussion items with publication/page suggestions
- `generated/all-discuss-items.json` <- extracted discussion items from the curriculum PDFs
- `generated/all-index.json` or `data/all-index.json` <- indexed publication chunks

### Regenerating the site JSON files

If `data/all-discuss-locations.json` is already up to date, rebuild the JSON files used by the site with:

```bash
python3 generate-data.py
```

In WSL:

```bash
cd /mnt/c/Users/bassg/linux/CNATRA-Study-Guide
source .venv/bin/activate
python generate-data.py
```

This rewrites:

```text
data/t6b/discuss-data.json
data/t44c/discuss-data.json
data/t45c/discuss-data.json
```

### Full rebuild from PDFs

If you updated PDFs and want to regenerate everything, run the pipeline in this order:

```bash
cd /mnt/c/Users/bassg/linux/CNATRA-Study-Guide
source .venv/bin/activate

python tools/pdf_pipeline.py extract --output generated/all-discuss-items.json
python tools/pdf_pipeline.py match --index generated/all-index.json --items generated/all-discuss-items.json --output data/all-discuss-locations.json
python generate-data.py
```

That workflow:

- extracts discussion items from the curriculum PDFs, including sim and flight events
- matches each item only against publications from the same aircraft folder
- rebuilds the JSON files the web UI reads

### Per-aircraft matching

If you want to inspect one aircraft's matched output before rebuilding the UI files:

```bash
python tools/pdf_pipeline.py match --aircraft T-6B --index generated/all-index.json --items generated/all-discuss-items.json --output generated/t6b-discuss-locations.json
python tools/pdf_pipeline.py match --aircraft T-44C --index generated/all-index.json --items generated/all-discuss-items.json --output generated/t44c-discuss-locations.json
python tools/pdf_pipeline.py match --aircraft T-45C --index generated/all-index.json --items generated/all-discuss-items.json --output generated/t45c-discuss-locations.json
```

Accepted aircraft forms include `T-6B`, `T6B`, `t6b`, and the equivalent for `T-44C` and `T-45C`.

## Manual Editing

If you want to adjust a specific discussion item after generation, open the relevant `data/{aircraft}/discuss-data.json` file and edit the `sourceRefs` for that item.

Example shape:

```json
{
  "id": "t6b-FAM4101-14",
  "blockCode": "FAM41",
  "blockTitle": "Day Familiarization",
  "eventCode": "FAM4101",
  "media": "AIRCRAFT",
  "mediaClass": "flight",
  "discussText": "Ejection seat and CFS, abnormal starts, brake failure...",
  "sourceRefs": [
    {
      "docId": "a1-t6baa-nfm-000",
      "shortName": "Checklist",
      "location": "AIR FORCE TO 1T-6B-1 (page 201)",
      "pageStart": 201,
      "heading": "AIR FORCE TO 1T-6B-1",
      "snippet": "INTERIOR INSPECTION...",
      "score": 41.92,
      "file": "t6b/A1-T6BAA-NFM-000.pdf"
    }
  ]
}
```

## Media Type Codes

| Code | Meaning |
|---|---|
| `UTD` | Unit Training Device |
| `OFT` | Operational Flight Trainer |
| `VTD` | Versatile Training Device |
| `UTD/OFT` | Both UTD and OFT |
| `AIRCRAFT` | Flight event |

## Disclaimer

This project is a study aid only. Source matching is algorithmic and must be verified against the complete, current revision of the official publication.
