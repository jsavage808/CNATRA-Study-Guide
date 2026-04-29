#!/usr/bin/env python3
"""High-accuracy offline PDF indexing, discussion-item extraction, and source matching.

Major upgrades over the original pipeline:
- Heading-aware PDF chunking with richer metadata.
- Cleaner discussion-item extraction with stray standalone "and" removal.
- Hybrid scoring: exact phrases + token overlap + synonym expansion + metadata priors.
- Optional semantic embeddings using sentence-transformers when available.
- Per discussion item JSON with primarySource and moreSources.

Recommended install for best results:
  python3 -m pip install pypdf sentence-transformers numpy

Works without sentence-transformers, but semantic scoring is disabled.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import pickle
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
  from pypdf import PdfReader
except ModuleNotFoundError as error:
  if error.name == "pypdf":
    print(
      "Missing dependency: pypdf\n"
      "Install it with:\n"
      "  python3 -m pip install pypdf\n",
      file=sys.stderr,
    )
    raise SystemExit(1)
  raise

try:
  import numpy as np
except ModuleNotFoundError:
  np = None  # type: ignore[assignment]

try:
  from sentence_transformers import SentenceTransformer
except ModuleNotFoundError:
  SentenceTransformer = None  # type: ignore[assignment]


AIRCRAFT_ALIASES = {
  "t6b": "T-6B",
  "t44c": "T-44C",
  "t45c": "T-45C",
}

STOPWORDS = {
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "criteria", "define",
  "describe", "difference", "do", "does", "for", "from", "how", "if", "in", "into",
  "is", "it", "its", "of", "on", "or", "qod", "state", "that", "the", "their",
  "these", "this", "to", "what", "when", "where", "which", "why", "with", "would",
  "you", "your", "shall", "will", "may", "per", "using", "use", "items", "item",
  "discuss", "discussion", "student", "instructor",
}

SECTION_KEYWORDS = (
  "chapter", "section", "appendix", "figure", "table", "emergency", "warning",
  "caution", "procedure", "procedures", "limitations", "systems", "fuel", "electrical",
  "hydraulic", "formation", "navigation", "instruments", "aerobatics", "checklist",
  "curriculum", "training", "operations", "normal", "abnormal", "malfunction",
  "approach", "departure", "landing", "takeoff", "stall", "spin", "engine", "instrument",
)

EVENT_CODE_RE = re.compile(r"\b[A-Z]{1,5}[0-9A-Z]{4}\b")
PUB_NUMBER_RE = re.compile(
  r"\b("
  r"A1-[A-Z0-9-]+|"
  r"CNATRA\s*INST\s*[A-Z0-9().-]+|"
  r"CNATRAINST\s*[A-Z0-9().-]+|"
  r"CNATRA\s*P-[0-9A-Z().-]+|"
  r"NAVAIR\s*[0-9A-Z-]+|"
  r"OPNAVINST\s*[0-9A-Z().-]+"
  r")\b",
  re.IGNORECASE,
)

MEDIA_HEADER_TOKENS = {
  "admin", "aircraft", "cai", "class", "exam", "lect", "mil", "offline",
  "oft", "p/p", "ptt", "sim", "sqdn", "sqdn/", "ss", "test", "utd", "vtd",
  "brief", "support", "flight", "trainer", "cpt", "ept", "est",
}

# Domain-specific expansions. Keep this conservative: query expansion should help recall,
# not make every aviation topic match every other aviation topic.
SYNONYMS: dict[str, list[str]] = {
  "ils": ["instrument landing system", "localizer", "glideslope", "glide slope"],
  "vor": ["vortac", "tacan", "nav aid", "navaid"],
  "tacan": ["vortac", "vor", "bearing", "dme"],
  "dme": ["distance measuring equipment", "tacan"],
  "crm": ["crew resource management", "communication", "decision making"],
  "orm": ["operational risk management", "risk management"],
  "ep": ["emergency procedure", "emergency procedures", "malfunction"],
  "eps": ["emergency procedures", "malfunctions"],
  "engine": ["powerplant", "propulsion"],
  "flameout": ["engine failure", "power loss", "loss of thrust"],
  "failure": ["malfunction", "emergency", "loss"],
  "stall": ["approach to stall", "departure", "aerodynamic stall"],
  "spin": ["departure", "incipient spin", "erect spin", "spin recovery"],
  "departure": ["out of control flight", "unusual attitude", "spin"],
  "ejection": ["egress", "bailout", "seat", "canopy"],
  "hydraulic": ["hydraulics", "flight controls"],
  "electrical": ["generator", "battery", "bus", "electrical system"],
  "fuel": ["fuel system", "boost pump", "transfer", "quantity"],
  "oxygen": ["o2", "hypoxia", "mask"],
  "pressurization": ["cockpit pressure", "cabin pressure"],
  "landing": ["approach", "touchdown", "flare"],
  "takeoff": ["take-off", "departure", "abort"],
  "formation": ["wing", "lead", "rejoin", "rendezvous", "breakup"],
  "instrument": ["ifr", "scan", "attitude instrument", "instrument flight"],
  "weather": ["metar", "taf", "thunderstorm", "icing", "visibility", "ceiling"],
  "navigation": ["nav", "route", "course", "bearing", "fix"],
  "radio": ["communication", "comm", "uhf", "vhf"],
  "lostcomm": ["lost communications", "radio failure", "communication failure"],
  "lost": ["failure", "lost communications"],
  "comm": ["communications", "radio"],
  "checklist": ["procedures", "emergency procedures", "boldface"],
  "boldface": ["critical action procedure", "memory items", "emergency procedure"],
}

DOC_TYPE_PRIOR = {
  "natops": 1.6,
  "fti": 1.35,
  "checklist": 1.25,
  "supplement": 1.0,
  "supporting": 0.75,
  "curriculum": -3.0,
}


@dataclass
class Chunk:
  chunk_id: str
  aircraft: str
  doc_id: str
  file: str
  title: str
  short_name: str
  publication_number: str
  doc_type: str
  page_start: int
  page_end: int
  heading: str
  section_path: list[str]
  text: str

  def to_dict(self) -> dict[str, Any]:
    return {
      "chunkId": self.chunk_id,
      "aircraft": self.aircraft,
      "docId": self.doc_id,
      "file": self.file,
      "title": self.title,
      "shortName": self.short_name,
      "publicationNumber": self.publication_number,
      "docType": self.doc_type,
      "pageStart": self.page_start,
      "pageEnd": self.page_end,
      "heading": self.heading,
      "sectionPath": self.section_path,
      "text": self.text,
    }


def normalize_whitespace(text: str) -> str:
  text = text.replace("\u00a0", " ")
  text = re.sub(r"\r\n?", "\n", text)
  text = re.sub(r"[ \t]+", " ", text)
  text = re.sub(r"\n{3,}", "\n\n", text)
  return text.strip()


def slugify(value: str) -> str:
  slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
  return slug or "document"


def stable_id(*parts: str, length: int = 12) -> str:
  digest = hashlib.sha1("|".join(parts).encode("utf8")).hexdigest()
  return digest[:length]


def title_from_filename(path: Path) -> str:
  return re.sub(r"[_-]+", " ", path.stem).strip()


def normalize_for_match(text: str) -> str:
  text = text.lower()
  text = text.replace("take-off", "takeoff")
  text = text.replace("glide slope", "glideslope")
  text = re.sub(r"[^a-z0-9]+", " ", text)
  return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str, *, expand: bool = False) -> list[str]:
  base = [
    token for token in re.findall(r"[a-z0-9]+", text.lower())
    if len(token) > 1 and token not in STOPWORDS
  ]
  if not expand:
    return base
  expanded = list(base)
  for token in base:
    for phrase in SYNONYMS.get(token, []):
      expanded.extend(tokenize(phrase, expand=False))
  return expanded


def meaningful_phrases(text: str, max_phrases: int = 16) -> list[str]:
  cleaned = normalize_for_match(text)
  words = [word for word in cleaned.split() if word not in STOPWORDS and len(word) > 1]
  phrases: list[str] = []
  # Prefer longer, high-information phrases from original adjacent terms.
  for n in (5, 4, 3, 2):
    for i in range(0, max(0, len(words) - n + 1)):
      phrase = " ".join(words[i:i + n])
      if len(phrase) >= 7 and phrase not in phrases:
        phrases.append(phrase)
      if len(phrases) >= max_phrases:
        return phrases
  return phrases


def clean_discuss_text(text: str) -> str:
  """Clean extraction artifacts, especially stray standalone 'and'."""
  text = normalize_whitespace(text)
  # Remove section/page litter and list bullets.
  text = re.sub(r"(?m)^\s*[-•*]\s*", "", text)
  text = re.sub(r"\bDiscuss Items?\.?\b", "", text, flags=re.IGNORECASE)
  # Remove standalone 'and' lines or list fragments. This directly addresses the user's issue.
  lines = []
  for line in text.splitlines():
    line = line.strip(" .;:,\t")
    if not line:
      continue
    if line.lower() == "and":
      continue
    lines.append(line)
  text = "\n".join(lines)
  text = re.sub(r"(?i)(^|[.;:,])\s*and\s*($|[.;:,])", r"\1 ", text)
  text = re.sub(r"(?i)^and\s+", "", text)
  text = re.sub(r"(?i)\s+and$", "", text)
  text = re.sub(r"\s+", " ", text).strip(" .;:,")
  return text


def split_topics(text: str) -> list[str]:
  text = clean_discuss_text(text)
  if not text:
    return []
  # Split on semicolons, bullets, and obvious list separators. Do not split normal phrase-internal 'and'.
  raw_parts = re.split(r"(?:\s*[;•]\s*|\s+\d+\.\s+|\n+)", text)
  topics: list[str] = []
  for part in raw_parts:
    part = clean_discuss_text(part)
    if not part or part.lower() == "and":
      continue
    # Some extracted bodies become comma lists. Split only when enough comma-separated units exist.
    comma_parts = [clean_discuss_text(piece) for piece in part.split(",")]
    comma_parts = [piece for piece in comma_parts if piece and piece.lower() != "and"]
    if len(comma_parts) >= 3:
      topics.extend(comma_parts)
    else:
      topics.append(part)
  return list(dict.fromkeys(topics))


def is_heading(line: str) -> bool:
  stripped = line.strip()
  if len(stripped) < 4 or len(stripped) > 120:
    return False
  alpha_chars = [char for char in stripped if char.isalpha()]
  if not alpha_chars:
    return False
  upper_ratio = sum(1 for char in alpha_chars if char.isupper()) / len(alpha_chars)
  starts_structured = bool(re.match(r"^(chapter|section|appendix|figure|table|\d+(?:\.\d+){0,4})\b", stripped.lower()))
  keyword_hit = any(keyword in stripped.lower() for keyword in SECTION_KEYWORDS)
  too_sentence_like = stripped.count(".") > 2 and not starts_structured
  return not too_sentence_like and (upper_ratio > 0.70 or starts_structured or keyword_hit)


def split_into_chunks(text: str, max_chars: int = 1100, overlap_chars: int = 180) -> list[str]:
  paragraphs = [segment.strip() for segment in re.split(r"\n\s*\n", text) if segment.strip()]
  chunks: list[str] = []
  buffer = ""
  for paragraph in paragraphs:
    candidate = paragraph if not buffer else f"{buffer}\n\n{paragraph}"
    if len(candidate) <= max_chars:
      buffer = candidate
      continue
    if buffer:
      chunks.append(buffer)
      tail = buffer[-overlap_chars:] if overlap_chars and len(buffer) > overlap_chars else ""
      buffer = tail.strip()
    if len(paragraph) <= max_chars:
      buffer = paragraph if not buffer else f"{buffer}\n\n{paragraph}"
      continue
    sentences = re.split(r"(?<=[.!?])\s+", paragraph)
    for sentence in sentences:
      candidate = sentence if not buffer else f"{buffer} {sentence}"
      if len(candidate) <= max_chars:
        buffer = candidate
      else:
        if buffer:
          chunks.append(buffer)
        buffer = sentence
  if buffer:
    chunks.append(buffer)
  return [chunk.strip() for chunk in chunks if chunk.strip()]


def relative_pdf_path(pdf_root: Path, pdf_path: Path) -> str:
  return str(pdf_path.relative_to(pdf_root)).replace("\\", "/")


def infer_aircraft_from_path(path: Path) -> str:
  for part in path.parts:
    key = re.sub(r"[^a-z0-9]", "", part.lower())
    if key in AIRCRAFT_ALIASES:
      return AIRCRAFT_ALIASES[key]
  return path.parent.name.upper()


def normalize_aircraft_name(value: str | None) -> str | None:
  if not value:
    return None
  compact = re.sub(r"[^a-z0-9]", "", str(value).lower())
  if compact in AIRCRAFT_ALIASES:
    return AIRCRAFT_ALIASES[compact]
  for alias, aircraft in AIRCRAFT_ALIASES.items():
    if alias in compact:
      return aircraft
  normalized = str(value).strip().upper()
  return normalized or None


def aircraft_from_relative_file(relative_file: str | None) -> str | None:
  if not relative_file:
    return None
  return infer_aircraft_from_path(Path(relative_file))


def resolve_record_aircraft(record: dict[str, Any], file_key: str = "file") -> str | None:
  file_aircraft = aircraft_from_relative_file(record.get(file_key))
  field_aircraft = normalize_aircraft_name(record.get("aircraft"))
  if file_aircraft and field_aircraft and file_aircraft != field_aircraft:
    return None
  return file_aircraft or field_aircraft


def infer_aircraft_from_text(*values: str) -> str | None:
  haystack = " ".join(value for value in values if value).lower()
  patterns = {
    "T-6B": (r"\bt[\s-]*6b\b", r"\btexan ii\b"),
    "T-44C": (r"\bt[\s-]*44c\b",),
    "T-45C": (r"\bt[\s-]*45c\b", r"\bgoshawk\b", r"\bt[\s-]*45\b"),
  }
  matches = [aircraft for aircraft, pats in patterns.items() if any(re.search(p, haystack) for p in pats)]
  return matches[0] if len(matches) == 1 else None


def infer_publication_number(name: str, first_pages_text: str) -> str:
  for candidate in (first_pages_text, name):
    match = PUB_NUMBER_RE.search(candidate)
    if match:
      return re.sub(r"\s+", " ", match.group(1)).strip()
  return ""


def infer_doc_type(name: str, first_pages_text: str) -> str:
  haystack = f"{name}\n{first_pages_text}".lower()
  if "curriculum guide" in haystack or "cnatrainst 1542." in haystack:
    return "curriculum"
  if "natops checklist" in haystack or "checklist" in haystack:
    return "checklist"
  if "natops" in haystack or "-nfm-" in haystack:
    return "natops"
  if "flight training instruction" in haystack or re.search(r"\bcnatra p-\d+", haystack):
    return "fti"
  if "supplement" in haystack:
    return "supplement"
  return "supporting"


def infer_title(pdf_path: Path, first_pages_text: str) -> str:
  normalized = normalize_whitespace(first_pages_text)
  lines = [line.strip() for line in normalized.splitlines() if line.strip()]
  joined = " ".join(lines[:15])
  preferred_patterns = (
    r"(T-[0-9A-Z]+.*?MASTER CURRICULUM GUIDE)",
    r"(FLIGHT TRAINING INSTRUCTION.*?T-[0-9A-Z]+)",
    r"(NATOPS FLIGHT MANUAL.*?T-[0-9A-Z]+)",
    r"(T-[0-9A-Z]+ NATOPS CHECKLISTS?)",
  )
  for pattern in preferred_patterns:
    match = re.search(pattern, joined, re.IGNORECASE)
    if match:
      return re.sub(r"\s+", " ", match.group(1)).strip()
  if lines:
    candidate = " ".join(lines[:3])
    if len(candidate) >= 15:
      return re.sub(r"\s+", " ", candidate).strip()
  return title_from_filename(pdf_path)


def infer_short_name(doc_type: str, title: str, publication_number: str) -> str:
  if doc_type == "curriculum":
    return "MCG"
  if doc_type == "natops":
    return "NATOPS"
  if doc_type == "fti":
    return "FTI"
  if doc_type == "checklist":
    return "Checklist"
  if doc_type == "supplement":
    return "Supplement"
  if publication_number:
    return publication_number.split()[0]
  return title.split()[0] if title.split() else "Document"


def classify_media(media: str) -> str:
  text = media.lower()
  compact = re.sub(r"[^a-z0-9]", "", text)
  if compact in AIRCRAFT_ALIASES:
    return "flight"
  if "aircraft" in text or "flight" in text:
    return "flight"
  if any(token in text for token in ("oft", "utd", "vtd", "sim", "cpt", "est", "ept")):
    return "sim"
  if any(token in text for token in ("class", "lect", "mil", "cai", "exam", "offline", "admin", "sqdn")):
    return "ground"
  if any(token in text for token in ("ptt", "support", "brief")):
    return "support"
  return "unknown"


def media_allowed(media_class: str, media_filter: str) -> bool:
  if media_filter == "all":
    return True
  if media_filter == "sim_flight":
    return media_class in {"sim", "flight"}
  if media_filter == "sim":
    return media_class == "sim"
  if media_filter == "flight":
    return media_class == "flight"
  if media_filter == "ground":
    return media_class == "ground"
  return False


def discover_documents(pdf_root: Path, aircraft_filter: str | None = None) -> list[dict[str, Any]]:
  documents: list[dict[str, Any]] = []
  for pdf_path in sorted(pdf_root.rglob("*.pdf")):
    if not pdf_path.is_file():
      continue
    aircraft = infer_aircraft_from_path(pdf_path)
    if aircraft_filter and aircraft != aircraft_filter:
      continue
    documents.append({
      "aircraft": aircraft,
      "path": pdf_path,
      "relativeFile": relative_pdf_path(pdf_root, pdf_path),
      "docId": slugify(pdf_path.stem),
    })
  return documents


def parse_block_header(page_text: str) -> dict[str, Any] | None:
  lines = [line.strip() for line in normalize_whitespace(page_text).splitlines() if line.strip()]
  for index, line in enumerate(lines[:20]):
    if not re.match(r"^[A-Z]{1,5}\d{2}\b", line):
      continue
    candidate_lines: list[str] = []
    for candidate in lines[index:index + 5]:
      candidate_lines.append(candidate)
      window = re.sub(r"\s+", " ", " ".join(candidate_lines)).strip()
      tokens = window.split()
      if len(tokens) < 5:
        continue
      block_code = tokens[0]
      media_tokens: list[str] = []
      cursor = 1
      while cursor < len(tokens):
        token = tokens[cursor]
        if token.lower() in MEDIA_HEADER_TOKENS or token.endswith("/"):
          media_tokens.append(token)
          cursor += 1
        else:
          break
      if not media_tokens:
        inferred_media = normalize_aircraft_name(tokens[1])
        media_tokens.append("AIRCRAFT" if inferred_media in AIRCRAFT_ALIASES.values() else tokens[1])
        cursor = 2
      remainder = tokens[cursor:]
      if len(remainder) < 2:
        continue
      block_name = ""
      if remainder and not re.fullmatch(r"\d+(?:\.\d+)?", remainder[-1]):
        block_name = remainder.pop()
      hx = None
      if len(remainder) >= 3 and re.fullmatch(r"\d+(?:\.\d+)?", remainder[-1]) and re.fullmatch(r"\d+(?:\.\d+)?", remainder[-2]):
        possible_hx = remainder[-1]
        possible_hours = remainder[-2]
        possible_events = remainder[-3]
        if re.fullmatch(r"\d+", possible_events):
          title = " ".join(remainder[:-3]).strip()
          if title:
            return {
              "blockCode": block_code,
              "media": " ".join(media_tokens),
              "title": title,
              "events": int(possible_events),
              "hours": float(possible_hours),
              "hx": float(possible_hx),
              "blockName": block_name,
            }
      if len(remainder) >= 2 and re.fullmatch(r"\d+(?:\.\d+)?", remainder[-1]) and re.fullmatch(r"\d+", remainder[-2]):
        title = " ".join(remainder[:-2]).strip()
        if title:
          return {
            "blockCode": block_code,
            "media": " ".join(media_tokens),
            "title": title,
            "events": int(remainder[-2]),
            "hours": float(remainder[-1]),
            "hx": hx,
            "blockName": block_name,
          }
  return None


def extract_event_refs(text: str) -> list[str]:
  return list(dict.fromkeys(EVENT_CODE_RE.findall(text)))


def extract_discuss_section(block_text: str) -> str:
  patterns = [
    r"4\.\s*Discuss Items(?:\.)?\s*(?P<body>.+?)(?:\n\s*5\.\s|\Z)",
    r"Discuss Items(?:\.)?\s*(?P<body>.+?)(?:\n\s*(?:5\.|Homework|Study Assignment|Assignment)\b|\Z)",
  ]
  for pattern in patterns:
    match = re.search(pattern, block_text, flags=re.IGNORECASE | re.DOTALL)
    if match:
      return clean_discuss_text(match.group("body"))
  return ""


def flatten_discuss_items(block: dict[str, Any]) -> list[dict[str, Any]]:
  discuss_body = clean_discuss_text(block.get("discussBody", ""))
  if not discuss_body or discuss_body.lower().startswith("none"):
    return []
  records: list[dict[str, Any]] = []

  explicit_sections = list(re.finditer(r"(?m)^(?P<code>[A-Z]{1,5}[0-9A-Z]{4})\s*$", discuss_body))
  if explicit_sections:
    for index, section in enumerate(explicit_sections):
      start = section.end()
      end = explicit_sections[index + 1].start() if index + 1 < len(explicit_sections) else len(discuss_body)
      text = clean_discuss_text(discuss_body[start:end])
      if not text:
        continue
      records.append({
        **block,
        "eventCode": section.group("code"),
        "eventRefs": [section.group("code")],
        "discussText": text,
        "topics": split_topics(text),
      })
    return records

  topics = split_topics(discuss_body)
  # If discuss section is a clean list, emit per-topic items; otherwise keep as one item.
  if len(topics) > 1:
    for topic in topics:
      records.append({
        **block,
        "eventCode": None,
        "eventRefs": block.get("eventRefs", []),
        "discussText": topic,
        "topics": [topic],
      })
    return records

  return [{
    **block,
    "eventCode": None,
    "eventRefs": block.get("eventRefs", []),
    "discussText": discuss_body,
    "topics": topics or [discuss_body],
  }]


def parse_curriculum_blocks(document: dict[str, Any]) -> list[dict[str, Any]]:
  reader = PdfReader(str(document["path"]))
  page_payloads: list[tuple[int, str]] = []
  for page_number, page in enumerate(reader.pages, start=1):
    text = normalize_whitespace(page.extract_text() or "")
    if text:
      page_payloads.append((page_number, text))

  blocks: list[dict[str, Any]] = []
  current_block: dict[str, Any] | None = None
  for page_number, page_text in page_payloads:
    header = parse_block_header(page_text)
    if header:
      if current_block:
        blocks.append(current_block)
      current_block = {
        "aircraft": document["aircraft"],
        "curriculumDocId": document["docId"],
        "curriculumTitle": document["title"],
        "curriculumFile": document["file"],
        "curriculumPublicationNumber": document["publicationNumber"],
        "blockCode": header["blockCode"],
        "blockTitle": header["title"],
        "blockName": header["blockName"],
        "media": header["media"],
        "mediaClass": classify_media(header["media"]),
        "pageStart": page_number,
        "pageEnd": page_number,
        "textParts": [page_text],
      }
      continue
    if current_block:
      current_block["pageEnd"] = page_number
      current_block["textParts"].append(page_text)
  if current_block:
    blocks.append(current_block)

  normalized_blocks: list[dict[str, Any]] = []
  for block in blocks:
    full_text = "\n\n".join(block.pop("textParts"))
    discuss_body = extract_discuss_section(full_text)
    normalized_blocks.append({
      **block,
      "eventRefs": extract_event_refs(full_text),
      "discussBody": discuss_body,
    })
  return normalized_blocks


def best_location(chunk: dict[str, Any]) -> str:
  heading = (chunk.get("heading") or "").strip()
  if heading:
    return f"{heading} (page {chunk['pageStart']})"
  return f"Page {chunk['pageStart']}"


def write_json(path: Path, payload: dict[str, Any] | list[Any]) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(payload, indent=2), encoding="utf8")


def build_doc_chunks(document: dict[str, Any]) -> tuple[dict[str, Any], list[Chunk]]:
  pdf_path = document["path"]
  reader = PdfReader(str(pdf_path))
  first_pages_text = []
  for page in reader.pages[:2]:
    first_pages_text.append(page.extract_text() or "")
  preview_text = normalize_whitespace("\n".join(first_pages_text))

  publication_number = infer_publication_number(pdf_path.name, preview_text)
  doc_type = infer_doc_type(pdf_path.name, preview_text)
  title = infer_title(pdf_path, preview_text)
  short_name = infer_short_name(doc_type, title, publication_number)
  folder_aircraft = document["aircraft"]
  content_aircraft = infer_aircraft_from_text(pdf_path.name, title, publication_number, preview_text)
  if content_aircraft and content_aircraft != folder_aircraft:
    return {
      "aircraft": folder_aircraft,
      "docId": document["docId"],
      "shortName": short_name,
      "title": title,
      "publicationNumber": publication_number,
      "docType": doc_type,
      "file": document["relativeFile"],
      "pageCount": len(reader.pages),
      "chunkCount": 0,
      "skipped": True,
      "skipReason": f"content aircraft {content_aircraft} does not match folder aircraft {folder_aircraft}",
    }, []

  chunks: list[Chunk] = []
  current_heading = title
  section_path = [title]
  chunk_counter = 1
  for page_number, page in enumerate(reader.pages, start=1):
    raw_text = page.extract_text() or ""
    page_text = normalize_whitespace(raw_text)
    if not page_text:
      continue
    lines = [line.strip() for line in page_text.splitlines() if line.strip()]
    page_heading = None
    for candidate in lines[:10]:
      if is_heading(candidate):
        page_heading = candidate
        break
    if page_heading:
      current_heading = page_heading
      if page_heading not in section_path[-3:]:
        section_path.append(page_heading)
        section_path = section_path[-4:]

    for text_chunk in split_into_chunks(page_text):
      chunk_id = f"{document['docId']}-p{page_number:04d}-c{chunk_counter:04d}"
      chunks.append(Chunk(
        chunk_id=chunk_id,
        aircraft=folder_aircraft,
        doc_id=document["docId"],
        file=document["relativeFile"],
        title=title,
        short_name=short_name,
        publication_number=publication_number,
        doc_type=doc_type,
        page_start=page_number,
        page_end=page_number,
        heading=current_heading,
        section_path=list(section_path),
        text=text_chunk,
      ))
      chunk_counter += 1

  return {
    "aircraft": folder_aircraft,
    "docId": document["docId"],
    "shortName": short_name,
    "title": title,
    "publicationNumber": publication_number,
    "docType": doc_type,
    "file": document["relativeFile"],
    "pageCount": len(reader.pages),
    "chunkCount": len(chunks),
  }, chunks


def load_json(path: Path) -> Any:
  return json.loads(path.read_text(encoding="utf8"))


def source_payload(chunk: dict[str, Any], rank: int) -> dict[str, Any]:
  return {
    "rank": rank,
    "docId": chunk["docId"],
    "title": chunk["title"],
    "shortName": chunk["shortName"],
    "publicationNumber": chunk.get("publicationNumber", ""),
    "docType": chunk.get("docType", ""),
    "file": chunk["file"],
    "location": best_location(chunk),
    "pageStart": chunk["pageStart"],
    "pageEnd": chunk.get("pageEnd", chunk["pageStart"]),
    "heading": chunk.get("heading", ""),
    "sectionPath": chunk.get("sectionPath", []),
    "score": chunk.get("score"),
    "scoreBreakdown": chunk.get("scoreBreakdown", {}),
    "snippet": chunk.get("text", "")[:700],
  }


def make_query_text(item: dict[str, Any]) -> str:
  weighted_parts = []
  # Discuss text is most important; block title gives context but can be broad/noisy.
  discuss = clean_discuss_text(item.get("discussText", ""))
  block_title = clean_discuss_text(item.get("blockTitle", ""))
  topics = [clean_discuss_text(topic) for topic in item.get("topics", []) if clean_discuss_text(topic)]
  event_refs = " ".join(item.get("eventRefs", []) or [])
  weighted_parts.extend([discuss] * 4)
  weighted_parts.extend(topics * 2)
  weighted_parts.extend([block_title] * 1)
  if event_refs:
    weighted_parts.append(event_refs)
  return " ".join(part for part in weighted_parts if part)


def phrase_score(query_text: str, chunk_text: str) -> float:
  normalized_chunk = normalize_for_match(chunk_text)
  score = 0.0
  for phrase in meaningful_phrases(query_text):
    if phrase in normalized_chunk:
      words = phrase.split()
      score += 3.5 + len(words) * 0.9
  # Domain synonym phrase boost.
  for token in set(tokenize(query_text)):
    for synonym in SYNONYMS.get(token, []):
      synonym_norm = normalize_for_match(synonym)
      if len(synonym_norm) > 4 and synonym_norm in normalized_chunk:
        score += 2.75
  return score


def lexical_score(query_text: str, chunk: dict[str, Any]) -> tuple[float, dict[str, Any]]:
  q_tokens = tokenize(query_text, expand=True)
  if not q_tokens:
    return 0.0, {}
  title_heading = f"{chunk.get('title', '')} {chunk.get('heading', '')} {' '.join(chunk.get('sectionPath', []))}"
  body = chunk.get("text", "")
  combined = f"{title_heading}\n{body}"
  c_tokens = tokenize(combined, expand=False)
  if not c_tokens:
    return 0.0, {}
  q_counts = Counter(q_tokens)
  c_counts = Counter(c_tokens)
  unique_query = set(q_tokens)
  overlap_terms = sorted(token for token in unique_query if token in c_counts)
  overlap = sum(min(q_counts[token], 3) * min(c_counts[token], 4) for token in overlap_terms)
  coverage = len(overlap_terms) / max(1, len(set(tokenize(query_text))))
  heading_tokens = set(tokenize(title_heading, expand=False))
  heading_hits = sorted(token for token in unique_query if token in heading_tokens)
  heading_bonus = 2.5 * len(heading_hits)
  density = overlap / math.sqrt(max(1, len(c_tokens)))
  phrase = phrase_score(query_text, combined)
  doc_prior = DOC_TYPE_PRIOR.get(chunk.get("docType", "supporting"), 0.0)
  event_bonus = 0.0
  for event_code in EVENT_CODE_RE.findall(query_text):
    if event_code in combined:
      event_bonus += 8.0
  score = overlap * 1.25 + coverage * 6.0 + heading_bonus + density * 1.5 + phrase + doc_prior + event_bonus
  return score, {
    "lexicalOverlap": round(overlap * 1.25, 3),
    "coverage": round(coverage * 6.0, 3),
    "headingBonus": round(heading_bonus, 3),
    "density": round(density * 1.5, 3),
    "phraseBonus": round(phrase, 3),
    "docTypePrior": round(doc_prior, 3),
    "eventCodeBonus": round(event_bonus, 3),
    "matchedTerms": overlap_terms[:20],
    "headingHits": heading_hits[:20],
  }


def embedding_available() -> bool:
  return SentenceTransformer is not None and np is not None


def load_embedding_model(model_name: str):
  if not embedding_available():
    return None
  return SentenceTransformer(model_name)


def embed_texts(model: Any, texts: list[str], batch_size: int = 32):
  if model is None or np is None:
    return None
  return model.encode(texts, batch_size=batch_size, show_progress_bar=True, normalize_embeddings=True)


def build_embedding_cache(index_path: Path, model_name: str, cache_path: Path) -> Any:
  if not embedding_available():
    print("Embeddings unavailable. Install sentence-transformers and numpy to enable semantic matching.", file=sys.stderr)
    return None
  index = load_json(index_path)
  chunks = index.get("chunks", [])
  model = load_embedding_model(model_name)
  texts = [f"{chunk.get('title','')}\n{chunk.get('heading','')}\n{chunk.get('text','')}" for chunk in chunks]
  vectors = embed_texts(model, texts)
  cache = {
    "modelName": model_name,
    "indexPath": str(index_path),
    "chunkIds": [chunk["chunkId"] for chunk in chunks],
    "vectors": vectors,
  }
  cache_path.parent.mkdir(parents=True, exist_ok=True)
  with cache_path.open("wb") as f:
    pickle.dump(cache, f)
  print(f"Wrote embedding cache for {len(chunks)} chunks to {cache_path}")
  return cache


def load_embedding_cache(cache_path: Path) -> Any | None:
  if not cache_path.exists():
    return None
  with cache_path.open("rb") as f:
    return pickle.load(f)


def rank_chunks(
  item: dict[str, Any],
  chunks: list[dict[str, Any]],
  *,
  embedding_model: Any = None,
  chunk_vector_by_id: dict[str, Any] | None = None,
  semantic_weight: float = 24.0,
) -> list[dict[str, Any]]:
  query_text = make_query_text(item)
  query_vector = None
  if embedding_model is not None and chunk_vector_by_id and np is not None:
    query_vector = embedding_model.encode([query_text], normalize_embeddings=True)[0]

  ranked: list[dict[str, Any]] = []
  for chunk in chunks:
    lex, breakdown = lexical_score(query_text, chunk)
    semantic = 0.0
    if query_vector is not None:
      vec = chunk_vector_by_id.get(chunk["chunkId"])
      if vec is not None:
        semantic = float(np.dot(query_vector, vec)) * semantic_weight
    total = lex + semantic
    if total <= 0:
      continue
    enriched = dict(chunk)
    breakdown["semantic"] = round(semantic, 3)
    enriched["score"] = round(total, 3)
    enriched["scoreBreakdown"] = breakdown
    ranked.append(enriched)

  ranked.sort(key=lambda c: c["score"], reverse=True)
  return ranked


def build_index(args: argparse.Namespace) -> int:
  pdf_root = Path(args.pdf_root)
  requested_aircraft = normalize_aircraft_name(args.aircraft)
  documents = discover_documents(pdf_root, requested_aircraft)
  docs_payload: list[dict[str, Any]] = []
  chunks_payload: list[dict[str, Any]] = []
  for document in documents:
    metadata, chunks = build_doc_chunks(document)
    docs_payload.append(metadata)
    chunks_payload.extend(chunk.to_dict() for chunk in chunks)
  payload = {
    "manifest": {
      "pdfRoot": str(pdf_root.as_posix()),
      "aircraft": requested_aircraft,
      "chunking": "heading-aware-overlapping-v2",
    },
    "documents": docs_payload,
    "chunks": chunks_payload,
  }
  write_json(Path(args.output), payload)
  print(f"Indexed {len(docs_payload)} document(s) into {args.output}")
  print(f"Created {len(chunks_payload)} searchable chunk(s)")
  if args.build_embeddings:
    build_embedding_cache(Path(args.output), args.embedding_model, Path(args.embedding_cache))
  return 0


def search_index(args: argparse.Namespace) -> int:
  index = load_json(Path(args.index))
  chunks = index["chunks"]
  requested_aircraft = normalize_aircraft_name(args.aircraft)
  if requested_aircraft:
    chunks = [chunk for chunk in chunks if resolve_record_aircraft(chunk) == requested_aircraft]
  if args.exclude_doc_type:
    excluded = {item.strip().lower() for item in args.exclude_doc_type.split(",") if item.strip()}
    chunks = [chunk for chunk in chunks if chunk.get("docType", "").lower() not in excluded]
  fake_item = {"discussText": args.query, "topics": [args.query], "blockTitle": "", "eventRefs": []}
  model = None
  vector_map = None
  if args.use_embeddings and embedding_available():
    cache = load_embedding_cache(Path(args.embedding_cache))
    if cache:
      model = load_embedding_model(cache["modelName"])
      vector_map = dict(zip(cache["chunkIds"], cache["vectors"]))
  ranked = rank_chunks(fake_item, chunks, embedding_model=model, chunk_vector_by_id=vector_map)[:args.limit]
  if args.json:
    print(json.dumps(ranked, indent=2))
    return 0
  if not ranked:
    print("No matches found.")
    return 0
  for idx, item in enumerate(ranked, start=1):
    print(f"{idx}. [{item['aircraft']}] {item['shortName']} ({item.get('publicationNumber') or item['docId']}) :: {best_location(item)}")
    print(f"   type={item.get('docType', 'unknown')} score={item['score']} breakdown={item.get('scoreBreakdown', {})}")
    snippet = item["text"].replace("\n", " ")
    print(f"   {snippet[:300]}{'...' if len(snippet) > 300 else ''}")
  return 0


def extract_discussion_items(args: argparse.Namespace) -> int:
  pdf_root = Path(args.pdf_root)
  requested_aircraft = normalize_aircraft_name(args.aircraft)
  documents = discover_documents(pdf_root, requested_aircraft)
  extracted: list[dict[str, Any]] = []
  summary: list[dict[str, Any]] = []
  for document in documents:
    metadata, _chunks = build_doc_chunks(document)
    if metadata["docType"] != "curriculum":
      continue
    curriculum_document = {**document, **metadata, "file": document["relativeFile"]}
    blocks = parse_curriculum_blocks(curriculum_document)
    block_count = 0
    item_count = 0
    for block in blocks:
      if not media_allowed(block["mediaClass"], args.media_filter):
        continue
      block_count += 1
      for record in flatten_discuss_items(block):
        discuss_text = clean_discuss_text(record["discussText"])
        if not discuss_text or discuss_text.lower() == "and":
          continue
        item_count += 1
        item_id = stable_id(
          record["aircraft"], record["blockCode"], record.get("eventCode") or "",
          discuss_text, str(record["pageStart"]), length=14,
        )
        extracted.append({
          "id": f"{record['aircraft'].lower().replace('-', '')}-{item_id}",
          "aircraft": record["aircraft"],
          "curriculumDocId": record["curriculumDocId"],
          "curriculumTitle": record["curriculumTitle"],
          "curriculumPublicationNumber": record["curriculumPublicationNumber"],
          "curriculumFile": record["curriculumFile"],
          "blockCode": record["blockCode"],
          "blockTitle": record["blockTitle"],
          "blockName": record["blockName"],
          "media": record["media"],
          "mediaClass": record["mediaClass"],
          "pageStart": record["pageStart"],
          "pageEnd": record["pageEnd"],
          "eventCode": record.get("eventCode"),
          "eventRefs": record.get("eventRefs", []),
          "discussText": discuss_text,
          "topics": split_topics(discuss_text),
        })
    summary.append({
      "aircraft": metadata["aircraft"],
      "curriculumTitle": metadata["title"],
      "publicationNumber": metadata["publicationNumber"],
      "file": metadata["file"],
      "includedBlocks": block_count,
      "extractedDiscussItems": item_count,
    })
  payload = {"filters": {"aircraft": requested_aircraft, "mediaFilter": args.media_filter}, "summary": summary, "items": extracted}
  write_json(Path(args.output), payload)
  print(f"Extracted {len(extracted)} discussion-item record(s) to {args.output}")
  return 0


def match_discussion_items(args: argparse.Namespace) -> int:
  index = load_json(Path(args.index))
  extracted = load_json(Path(args.items))
  items = extracted["items"] if isinstance(extracted, dict) and "items" in extracted else extracted
  chunks = index["chunks"]
  excluded_types = {item.strip().lower() for item in args.exclude_doc_type.split(",") if item.strip()}
  requested_aircraft = normalize_aircraft_name(args.aircraft)
  scoped_chunks: dict[str, list[dict[str, Any]]] = defaultdict(list)
  skipped_chunks = 0
  skipped_items = 0
  for chunk in chunks:
    aircraft = resolve_record_aircraft(chunk)
    if not aircraft:
      skipped_chunks += 1
      continue
    if requested_aircraft and aircraft != requested_aircraft:
      continue
    if chunk.get("docType", "").lower() in excluded_types:
      continue
    scoped = dict(chunk)
    scoped["aircraft"] = aircraft
    scoped_chunks[aircraft].append(scoped)

  model = None
  vector_map = None
  semantic_enabled = False
  if args.use_embeddings:
    if not embedding_available():
      print("Embeddings requested but unavailable. Install sentence-transformers and numpy. Falling back to hybrid lexical scoring.", file=sys.stderr)
    else:
      cache = load_embedding_cache(Path(args.embedding_cache))
      if cache is None:
        cache = build_embedding_cache(Path(args.index), args.embedding_model, Path(args.embedding_cache))
      if cache:
        model = load_embedding_model(cache["modelName"])
        vector_map = dict(zip(cache["chunkIds"], cache["vectors"]))
        semantic_enabled = True

  output: list[dict[str, Any]] = []
  for item in items:
    item_aircraft = resolve_record_aircraft(item, file_key="curriculumFile") or normalize_aircraft_name(item.get("aircraft"))
    if not item_aircraft:
      skipped_items += 1
      continue
    if requested_aircraft and item_aircraft != requested_aircraft:
      continue
    relevant_chunks = scoped_chunks.get(item_aircraft, [])
    ranked = rank_chunks(item, relevant_chunks, embedding_model=model, chunk_vector_by_id=vector_map, semantic_weight=args.semantic_weight)
    ranked = [chunk for chunk in ranked if chunk["score"] >= args.min_score]
    top = ranked[:args.limit]
    primary = source_payload(top[0], 1) if top else None
    more = [source_payload(chunk, rank) for rank, chunk in enumerate(top[1:], start=2)]
    # Keep suggestedLocations for backwards compatibility with current UI/data script.
    suggested = [source_payload(chunk, rank) for rank, chunk in enumerate(top, start=1)]
    output.append({
      **item,
      "aircraft": item_aircraft,
      "queryText": make_query_text(item),
      "primarySource": primary,
      "moreSources": more,
      "suggestedLocations": suggested,
      "matchCount": len(top),
    })

  payload = {
    "filters": {
      "aircraft": requested_aircraft,
      "excludeDocType": sorted(excluded_types),
      "strictAircraftScope": True,
      "useEmbeddings": bool(args.use_embeddings),
      "semanticEnabled": semantic_enabled,
      "minScore": args.min_score,
    },
    "summary": {
      "matchedItems": len(output),
      "itemsWithPrimarySource": sum(1 for item in output if item.get("primarySource")),
      "skippedItems": skipped_items,
      "skippedChunks": skipped_chunks,
      "aircraftScopes": sorted(scoped_chunks.keys()),
    },
    "items": output,
  }
  write_json(Path(args.output), payload)
  print(f"Wrote {len(output)} matched discussion-item record(s) to {args.output}")
  print(f"Items with primary source: {payload['summary']['itemsWithPrimarySource']}")
  return 0


def bundle_ui(args: argparse.Namespace) -> int:
  payload: dict[str, Any] = {}
  for input_path in args.inputs:
    source = load_json(Path(input_path))
    aircraft = None
    if isinstance(source, dict):
      aircraft = source.get("filters", {}).get("aircraft")
      if not aircraft:
        items = source.get("items") or []
        if items:
          aircraft = items[0].get("aircraft")
    if not aircraft:
      raise ValueError(f"Could not determine aircraft for {input_path}")
    payload[aircraft] = source
  output_path = Path(args.output)
  output_path.parent.mkdir(parents=True, exist_ok=True)
  output_path.write_text("window.GENERATED_DISCUSS = " + json.dumps(payload, indent=2) + ";\n", encoding="utf8")
  print(f"Wrote UI bundle for {len(payload)} aircraft to {args.output}")
  return 0


def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(description="High-accuracy PDF discuss-item locator pipeline")
  subparsers = parser.add_subparsers(dest="command", required=True)

  index_parser = subparsers.add_parser("index", help="Index PDFs under pdfs/raw")
  index_parser.add_argument("--pdf-root", default="pdfs/raw")
  index_parser.add_argument("--aircraft")
  index_parser.add_argument("--output", default="generated/pdf-index.json")
  index_parser.add_argument("--build-embeddings", action="store_true")
  index_parser.add_argument("--embedding-model", default="sentence-transformers/all-mpnet-base-v2")
  index_parser.add_argument("--embedding-cache", default="generated/pdf-index.embeddings.pkl")
  index_parser.set_defaults(func=build_index)

  embed_parser = subparsers.add_parser("embed", help="Build/rebuild embedding cache for an existing index")
  embed_parser.add_argument("--index", default="generated/pdf-index.json")
  embed_parser.add_argument("--embedding-model", default="sentence-transformers/all-mpnet-base-v2")
  embed_parser.add_argument("--embedding-cache", default="generated/pdf-index.embeddings.pkl")
  embed_parser.set_defaults(func=lambda args: 0 if build_embedding_cache(Path(args.index), args.embedding_model, Path(args.embedding_cache)) else 1)

  search_parser = subparsers.add_parser("search", help="Search indexed PDF chunks")
  search_parser.add_argument("--index", default="generated/pdf-index.json")
  search_parser.add_argument("--query", required=True)
  search_parser.add_argument("--aircraft")
  search_parser.add_argument("--exclude-doc-type", default="")
  search_parser.add_argument("--limit", type=int, default=5)
  search_parser.add_argument("--json", action="store_true")
  search_parser.add_argument("--use-embeddings", action="store_true")
  search_parser.add_argument("--embedding-cache", default="generated/pdf-index.embeddings.pkl")
  search_parser.set_defaults(func=search_index)

  extract_parser = subparsers.add_parser("extract", help="Extract discuss items from curriculum-guide PDFs")
  extract_parser.add_argument("--pdf-root", default="pdfs/raw")
  extract_parser.add_argument("--aircraft")
  extract_parser.add_argument("--media-filter", choices=["sim_flight", "sim", "flight", "ground", "all"], default="sim_flight")
  extract_parser.add_argument("--output", default="generated/discuss-items.json")
  extract_parser.set_defaults(func=extract_discussion_items)

  match_parser = subparsers.add_parser("match", help="Match discuss items to source publications")
  match_parser.add_argument("--index", default="generated/pdf-index.json")
  match_parser.add_argument("--items", default="generated/discuss-items.json")
  match_parser.add_argument("--aircraft")
  match_parser.add_argument("--exclude-doc-type", default="curriculum")
  match_parser.add_argument("--limit", type=int, default=5)
  match_parser.add_argument("--min-score", type=float, default=8.0)
  match_parser.add_argument("--use-embeddings", action="store_true")
  match_parser.add_argument("--embedding-model", default="sentence-transformers/all-mpnet-base-v2")
  match_parser.add_argument("--embedding-cache", default="generated/pdf-index.embeddings.pkl")
  match_parser.add_argument("--semantic-weight", type=float, default=24.0)
  match_parser.add_argument("--output", default="generated/discuss-item-locations.json")
  match_parser.set_defaults(func=match_discussion_items)

  bundle_parser = subparsers.add_parser("bundle-ui", help="Bundle matched outputs into JS")
  bundle_parser.add_argument("--inputs", nargs="+", required=True)
  bundle_parser.add_argument("--output", default="data/generated/discuss-locations.js")
  bundle_parser.set_defaults(func=bundle_ui)
  return parser


def main(argv: list[str] | None = None) -> int:
  parser = build_parser()
  args = parser.parse_args(argv)
  return args.func(args)


if __name__ == "__main__":
  raise SystemExit(main())
