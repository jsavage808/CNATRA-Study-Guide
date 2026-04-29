#!/usr/bin/env python3
"""Generate UI data files from the matched discuss-location master JSON."""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent
MASTER_PATH = REPO_ROOT / "data" / "all-discuss-locations.json"
OUTPUT_DIRS = {
    "T-6B": REPO_ROOT / "data" / "t6b" / "discuss-data.json",
    "T-44C": REPO_ROOT / "data" / "t44c" / "discuss-data.json",
    "T-45C": REPO_ROOT / "data" / "t45c" / "discuss-data.json",
}


def load_master() -> dict:
  return json.loads(MASTER_PATH.read_text(encoding="utf8"))


def doc_sort_key(document: dict) -> tuple[str, str]:
  return (document.get("shortName", ""), document.get("docId", ""))


def build_payload(aircraft: str, items: list[dict]) -> dict:
  documents_by_id: dict[str, dict] = {}
  phases: list[dict] = []
  seen_blocks: set[str] = set()
  discussion_items: list[dict] = []

  for item in items:
    block_code = item.get("blockCode") or "OTHER"
    block_title = item.get("blockTitle") or block_code
    if block_code not in seen_blocks:
      seen_blocks.add(block_code)
      phases.append({"blockCode": block_code, "blockTitle": block_title})

    source_refs: list[dict] = []
    for ref in item.get("suggestedLocations", []):
      doc_id = ref.get("docId")
      if doc_id and doc_id not in documents_by_id:
        documents_by_id[doc_id] = {
            "id": doc_id,
            "shortName": ref.get("shortName", ""),
            "fullName": ref.get("title", ""),
            "pubNumber": ref.get("publicationNumber", ""),
            "type": ref.get("docType", ""),
            "file": ref.get("file", ""),
            "url": "",
        }

      source_refs.append(
          {
              "docId": doc_id,
              "shortName": ref.get("shortName", ""),
              "location": ref.get("location", ""),
              "pageStart": ref.get("pageStart"),
              "heading": ref.get("heading", ""),
              "snippet": ref.get("snippet", ""),
              "score": ref.get("score"),
              "file": ref.get("file", ""),
          }
      )

    event_code = item.get("eventCode")
    discussion_items.append(
        {
            "id": f"{aircraft.lower().replace('-', '')}-{event_code or block_code}-{len(discussion_items) + 1}",
            "blockCode": block_code,
            "blockTitle": block_title,
            "eventCode": event_code,
            "eventRefs": item.get("eventRefs", []),
            "media": item.get("media", ""),
            "mediaClass": item.get("mediaClass", ""),
            "discussText": item.get("discussText", ""),
            "topics": item.get("topics", []),
            "curriculumPage": item.get("pageStart"),
            "curriculumFile": item.get("curriculumFile", ""),
            "curriculumPubNumber": item.get("curriculumPublicationNumber", ""),
            "sourceRefs": source_refs,
        }
    )

  return {
      "aircraft": aircraft,
      "generatedFrom": "data/all-discuss-locations.json",
      "itemCount": len(discussion_items),
      "documents": sorted(documents_by_id.values(), key=doc_sort_key),
      "phases": phases,
      "discussionItems": discussion_items,
  }


def main() -> int:
  master = load_master()
  items = master.get("items", []) if isinstance(master, dict) else master
  grouped: dict[str, list[dict]] = defaultdict(list)
  for item in items:
    aircraft = item.get("aircraft")
    if aircraft in OUTPUT_DIRS:
      grouped[aircraft].append(item)

  for aircraft, output_path in OUTPUT_DIRS.items():
    payload = build_payload(aircraft, grouped.get(aircraft, []))
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")
    print(f"Wrote {payload['itemCount']} items to {output_path.relative_to(REPO_ROOT)}")

  return 0


if __name__ == "__main__":
  raise SystemExit(main())
