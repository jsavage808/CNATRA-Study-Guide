#!/usr/bin/env python3
"""Generate aircraft-specific UI JSON from rebuilt matched discuss-location JSON.

This keeps backward-compatible fields while exposing the new structure:
- primarySource: best link for the discuss item
- moreSources: secondary source links
- sourceRefs/suggestedLocations: compatibility arrays
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


DEFAULT_OUTPUT_DIRS = {
  "T-6B": Path("data/t6b/discuss-data.json"),
  "T-44C": Path("data/t44c/discuss-data.json"),
  "T-45C": Path("data/t45c/discuss-data.json"),
}


def load_json(path: Path) -> Any:
  return json.loads(path.read_text(encoding="utf8"))


def doc_sort_key(document: dict[str, Any]) -> tuple[str, str]:
  return (document.get("shortName", ""), document.get("docId", ""))


def normalize_source(ref: dict[str, Any] | None, rank: int | None = None) -> dict[str, Any] | None:
  if not ref:
    return None
  payload = {
    "rank": ref.get("rank", rank),
    "docId": ref.get("docId"),
    "shortName": ref.get("shortName", ""),
    "title": ref.get("title", ""),
    "publicationNumber": ref.get("publicationNumber", ""),
    "docType": ref.get("docType", ""),
    "file": ref.get("file", ""),
    "url": ref.get("url", ""),
    "location": ref.get("location", ""),
    "pageStart": ref.get("pageStart"),
    "pageEnd": ref.get("pageEnd"),
    "heading": ref.get("heading", ""),
    "sectionPath": ref.get("sectionPath", []),
    "snippet": ref.get("snippet", ""),
    "score": ref.get("score"),
    "scoreBreakdown": ref.get("scoreBreakdown", {}),
  }
  return payload


def build_payload(aircraft: str, items: list[dict[str, Any]]) -> dict[str, Any]:
  documents_by_id: dict[str, dict[str, Any]] = {}
  phases: list[dict[str, Any]] = []
  seen_blocks: set[str] = set()
  discussion_items: list[dict[str, Any]] = []

  for source_item in items:
    item = dict(source_item)
    block_code = item.get("blockCode") or "OTHER"
    block_title = item.get("blockTitle") or block_code
    if block_code not in seen_blocks:
      seen_blocks.add(block_code)
      phases.append({"blockCode": block_code, "blockTitle": block_title})

    raw_sources = item.get("suggestedLocations") or []
    if not raw_sources and item.get("primarySource"):
      raw_sources = [item["primarySource"], *(item.get("moreSources") or [])]

    source_refs: list[dict[str, Any]] = []
    for index, ref in enumerate(raw_sources, start=1):
      normalized = normalize_source(ref, index)
      if not normalized:
        continue
      doc_id = normalized.get("docId")
      if doc_id and doc_id not in documents_by_id:
        documents_by_id[doc_id] = {
          "id": doc_id,
          "shortName": normalized.get("shortName", ""),
          "fullName": normalized.get("title", ""),
          "pubNumber": normalized.get("publicationNumber", ""),
          "type": normalized.get("docType", ""),
          "file": normalized.get("file", ""),
          "url": normalized.get("url", ""),
        }
      source_refs.append(normalized)

    primary_source = normalize_source(item.get("primarySource"), 1)
    if not primary_source and source_refs:
      primary_source = source_refs[0]
    more_sources = [normalize_source(src, idx) for idx, src in enumerate(item.get("moreSources") or source_refs[1:], start=2)]
    more_sources = [src for src in more_sources if src]

    event_code = item.get("eventCode")
    fallback_id = f"{aircraft.lower().replace('-', '')}-{event_code or block_code}-{len(discussion_items) + 1}"
    discussion_items.append({
      "id": item.get("id") or fallback_id,
      "blockCode": block_code,
      "blockTitle": block_title,
      "eventCode": event_code,
      "eventRefs": item.get("eventRefs", []),
      "media": item.get("media", ""),
      "mediaClass": item.get("mediaClass", ""),
      "discussText": item.get("discussText", ""),
      "topics": item.get("topics", []),
      "curriculumPage": item.get("pageStart"),
      "curriculumPageEnd": item.get("pageEnd"),
      "curriculumFile": item.get("curriculumFile", ""),
      "curriculumPubNumber": item.get("curriculumPublicationNumber", ""),
      "queryText": item.get("queryText", ""),
      "primarySource": primary_source,
      "moreSources": more_sources,
      "sourceRefs": source_refs,
      "matchCount": item.get("matchCount", len(source_refs)),
    })

  return {
    "aircraft": aircraft,
    "generatedFrom": "rebuilt matched discuss-location JSON",
    "schemaVersion": 2,
    "itemCount": len(discussion_items),
    "documents": sorted(documents_by_id.values(), key=doc_sort_key),
    "phases": phases,
    "discussionItems": discussion_items,
  }


def parse_output_dirs(repo_root: Path, output_root: Path | None) -> dict[str, Path]:
  if output_root:
    return {
      "T-6B": output_root / "t6b" / "discuss-data.json",
      "T-44C": output_root / "t44c" / "discuss-data.json",
      "T-45C": output_root / "t45c" / "discuss-data.json",
    }
  return {aircraft: repo_root / path for aircraft, path in DEFAULT_OUTPUT_DIRS.items()}


def main() -> int:
  parser = argparse.ArgumentParser(description="Generate aircraft-specific discuss-data JSON")
  parser.add_argument("--master", default="data/all-discuss-locations.json", help="Matched master JSON")
  parser.add_argument("--repo-root", default=".", help="Repository root")
  parser.add_argument("--output-root", help="Optional output data root, e.g. data")
  args = parser.parse_args()

  repo_root = Path(args.repo_root).resolve()
  master_path = Path(args.master)
  if not master_path.is_absolute():
    master_path = repo_root / master_path
  output_root = Path(args.output_root).resolve() if args.output_root else None
  output_dirs = parse_output_dirs(repo_root, output_root)

  master = load_json(master_path)
  items = master.get("items", []) if isinstance(master, dict) else master
  grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
  for item in items:
    aircraft = item.get("aircraft")
    if aircraft in output_dirs:
      grouped[aircraft].append(item)

  for aircraft, output_path in output_dirs.items():
    payload = build_payload(aircraft, grouped.get(aircraft, []))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")
    print(f"Wrote {payload['itemCount']} items to {output_path.relative_to(repo_root) if output_path.is_relative_to(repo_root) else output_path}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
