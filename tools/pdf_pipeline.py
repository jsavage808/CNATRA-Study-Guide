#!/usr/bin/env python3
"""Offline PDF discovery, indexing, curriculum extraction, and source matching."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path

try:
  from pypdf import PdfReader
except ModuleNotFoundError as error:
  if error.name == "pypdf":
    print(
        "Missing dependency: pypdf\n"
        "Install it in WSL with one of these commands:\n"
        "  python3 -m pip install pypdf\n"
        "  python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt",
        file=sys.stderr,
    )
    raise SystemExit(1)
  raise


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
    "you", "your",
}

SECTION_KEYWORDS = (
    "chapter", "section", "appendix", "figure", "table", "emergency", "warning",
    "caution", "procedure", "limitations", "systems", "fuel", "electrical",
    "hydraulic", "formation", "navigation", "instruments", "aerobatics",
    "checklist", "curriculum", "training",
)

EVENT_CODE_RE = re.compile(r"\b[A-Z]{1,5}[0-9A-Z]{4}\b")
PUB_NUMBER_RE = re.compile(
    r"\b("
    r"A1-[A-Z0-9-]+|"
    r"CNATRA\s*INST\s*[A-Z0-9().-]+|"
    r"CNATRAINST\s*[A-Z0-9().-]+|"
    r"CNATRA\s*P-[0-9A-Z().-]+|"
    r"NAVAIR\s*[0-9A-Z-]+|"
    r"NAVAIR\s*[0-9A-Z-]+|"
    r"OPNAVINST\s*[0-9A-Z().-]+"
    r")\b",
    re.IGNORECASE,
)

MEDIA_HEADER_TOKENS = {
    "admin", "aircraft", "cai", "class", "exam", "lect", "mil", "offline",
    "oft", "p/p", "ptt", "sim", "sqdn", "sqdn/", "ss", "test", "utd", "vtd",
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
  text: str

  def to_dict(self) -> dict:
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


def title_from_filename(path: Path) -> str:
  return re.sub(r"[_-]+", " ", path.stem).strip()


def tokenize(text: str) -> list[str]:
  return [
      token for token in re.findall(r"[a-z0-9]+", text.lower())
      if len(token) > 2 and token not in STOPWORDS
  ]


def is_heading(line: str) -> bool:
  stripped = line.strip()
  if len(stripped) < 4 or len(stripped) > 100:
    return False

  alpha_chars = [char for char in stripped if char.isalpha()]
  if not alpha_chars:
    return False

  upper_ratio = sum(1 for char in alpha_chars if char.isupper()) / len(alpha_chars)
  looks_structured = bool(re.match(r"^(chapter|section|appendix|figure|table)\b", stripped.lower()))
  keyword_hit = any(keyword in stripped.lower() for keyword in SECTION_KEYWORDS)

  return upper_ratio > 0.72 or looks_structured or keyword_hit


def split_into_chunks(text: str, max_chars: int = 1400) -> list[str]:
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
      buffer = ""

    if len(paragraph) <= max_chars:
      buffer = paragraph
      continue

    sentences = re.split(r"(?<=[.!?])\s+", paragraph)
    sentence_buffer = ""
    for sentence in sentences:
      candidate = sentence if not sentence_buffer else f"{sentence_buffer} {sentence}"
      if len(candidate) <= max_chars:
        sentence_buffer = candidate
      else:
        if sentence_buffer:
          chunks.append(sentence_buffer)
        sentence_buffer = sentence
    if sentence_buffer:
      buffer = sentence_buffer

  if buffer:
    chunks.append(buffer)

  return chunks


def relative_pdf_path(pdf_root: Path, pdf_path: Path) -> str:
  return str(pdf_path.relative_to(pdf_root)).replace("\\", "/")


def infer_aircraft_from_path(path: Path) -> str:
  for part in path.parts:
    key = part.lower()
    if key in AIRCRAFT_ALIASES:
      return AIRCRAFT_ALIASES[key]
  return path.parent.name.upper()


def normalize_aircraft_name(value: str | None) -> str | None:
  if not value:
    return None
  normalized = str(value).strip()
  if not normalized:
    return None

  compact = re.sub(r"[^a-z0-9]", "", normalized.lower())
  if compact in AIRCRAFT_ALIASES:
    return AIRCRAFT_ALIASES[compact]

  for alias, aircraft in AIRCRAFT_ALIASES.items():
    if alias in compact:
      return aircraft

  return normalized.upper()


def aircraft_from_relative_file(relative_file: str | None) -> str | None:
  if not relative_file:
    return None
  return infer_aircraft_from_path(Path(relative_file))


def resolve_record_aircraft(record: dict, file_key: str = "file") -> str | None:
  file_aircraft = aircraft_from_relative_file(record.get(file_key))
  field_aircraft = normalize_aircraft_name(record.get("aircraft"))

  if file_aircraft and field_aircraft and file_aircraft != field_aircraft:
    return None
  return file_aircraft or field_aircraft


def infer_aircraft_from_text(*values: str) -> str | None:
  haystack = " ".join(value for value in values if value)
  normalized = haystack.lower()
  patterns = {
      "T-6B": (r"\bt[\s-]*6b\b", r"\btexan ii\b"),
      "T-44C": (r"\bt[\s-]*44c\b",),
      "T-45C": (r"\bt[\s-]*45c\b", r"\bgoshawk\b", r"\bt[\s-]*45\b"),
  }
  matches: list[str] = []
  for aircraft, aircraft_patterns in patterns.items():
    if any(re.search(pattern, normalized) for pattern in aircraft_patterns):
      matches.append(aircraft)
  if len(matches) == 1:
    return matches[0]
  return None


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
  joined = " ".join(lines[:12])

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
  return title.split()[0]


def classify_media(media: str) -> str:
  text = media.lower()
  compact = re.sub(r"[^a-z0-9]", "", text)
  if compact in AIRCRAFT_ALIASES:
    return "flight"
  if any(token in text for token in ("aircraft",)):
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
  return False


def discover_documents(pdf_root: Path, aircraft_filter: str | None = None) -> list[dict]:
  documents: list[dict] = []

  for pdf_path in sorted(pdf_root.rglob("*.pdf")):
    if not pdf_path.is_file():
      continue

    aircraft = infer_aircraft_from_path(pdf_path)
    if aircraft_filter and aircraft != aircraft_filter:
      continue

    documents.append(
        {
            "aircraft": aircraft,
            "path": pdf_path,
            "relativeFile": relative_pdf_path(pdf_root, pdf_path),
            "docId": slugify(pdf_path.stem),
        }
    )

  return documents


def parse_block_header(page_text: str) -> dict | None:
  lines = [line.strip() for line in normalize_whitespace(page_text).splitlines() if line.strip()]
  for index, line in enumerate(lines[:18]):
    if not re.match(r"^[A-Z]{1,5}\d{2}\b", line):
      continue
    candidate_lines: list[str] = []
    for candidate in lines[index:index + 4]:
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
          continue
        break

      if not media_tokens:
        inferred_media = normalize_aircraft_name(tokens[1])
        if inferred_media in AIRCRAFT_ALIASES.values():
          media_tokens.append("AIRCRAFT")
        else:
          media_tokens.append(tokens[1])
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
          hx = float(possible_hx)
          hours = float(possible_hours)
          events = int(possible_events)
          title = " ".join(remainder[:-3]).strip()
          if title:
            return {
                "blockCode": block_code,
                "media": " ".join(media_tokens),
                "title": title,
                "events": events,
                "hours": hours,
                "hx": hx,
                "blockName": block_name,
            }

      if len(remainder) >= 2 and re.fullmatch(r"\d+(?:\.\d+)?", remainder[-1]) and re.fullmatch(r"\d+", remainder[-2]):
        hours = float(remainder[-1])
        events = int(remainder[-2])
        title = " ".join(remainder[:-2]).strip()
        if title:
          return {
              "blockCode": block_code,
              "media": " ".join(media_tokens),
              "title": title,
              "events": events,
              "hours": hours,
              "hx": hx,
              "blockName": block_name,
          }
  return None


def extract_event_refs(text: str) -> list[str]:
  return list(dict.fromkeys(EVENT_CODE_RE.findall(text)))


def split_topics(text: str) -> list[str]:
  cleaned = normalize_whitespace(text)
  parts = [part.strip(" .;") for part in re.split(r"[;,]\s+", cleaned) if part.strip(" .;")]
  return parts if parts else [cleaned]


def extract_discuss_section(block_text: str) -> str:
  match = re.search(
      r"4\.\s*Discuss Items(?:\.)?\s*(?P<body>.+?)(?:\n\s*5\.\s|\Z)",
      block_text,
      flags=re.IGNORECASE | re.DOTALL,
  )
  return normalize_whitespace(match.group("body")) if match else ""


def flatten_discuss_items(block: dict) -> list[dict]:
  discuss_body = block["discussBody"]
  if not discuss_body or discuss_body.lower().startswith("none"):
    return []

  records: list[dict] = []
  explicit_sections = list(re.finditer(r"(?m)^(?P<code>[A-Z]{1,5}[0-9A-Z]{4})\s*$", discuss_body))

  if explicit_sections:
    for index, section in enumerate(explicit_sections):
      start = section.end()
      end = explicit_sections[index + 1].start() if index + 1 < len(explicit_sections) else len(discuss_body)
      text = normalize_whitespace(discuss_body[start:end]).strip(" .")
      if not text:
        continue
      records.append(
          {
              **block,
              "eventCode": section.group("code"),
              "eventRefs": [section.group("code")],
              "discussText": text,
              "topics": split_topics(text),
          }
      )
    return records

  records.append(
      {
          **block,
          "eventCode": None,
          "eventRefs": block["eventRefs"],
          "discussText": discuss_body.strip(" ."),
          "topics": split_topics(discuss_body),
      }
  )
  return records


def parse_curriculum_blocks(document: dict) -> list[dict]:
  reader = PdfReader(str(document["path"]))
  page_payloads: list[tuple[int, str]] = []

  for page_number, page in enumerate(reader.pages, start=1):
    text = normalize_whitespace(page.extract_text() or "")
    if text:
      page_payloads.append((page_number, text))

  blocks: list[dict] = []
  current_block: dict | None = None

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

  normalized_blocks: list[dict] = []
  for block in blocks:
    full_text = "\n\n".join(block.pop("textParts"))
    discuss_body = extract_discuss_section(full_text)
    event_refs = extract_event_refs(full_text)
    normalized_blocks.append(
        {
            **block,
            "eventRefs": event_refs,
            "discussBody": discuss_body,
        }
    )

  return normalized_blocks


def score_text(query: str, chunk: dict) -> float:
  query_tokens = tokenize(query)
  if not query_tokens:
    return 0.0

  chunk_text = f"{chunk.get('title', '')}\n{chunk.get('heading', '')}\n{chunk.get('text', '')}"
  chunk_tokens = tokenize(chunk_text)
  if not chunk_tokens:
    return 0.0

  chunk_counts = Counter(chunk_tokens)
  overlap = sum(min(chunk_counts[token], 3) for token in set(query_tokens) if token in chunk_counts)
  title_bonus = sum(
      2 for token in set(query_tokens)
      if token in tokenize(chunk.get("heading", "")) or token in tokenize(chunk.get("title", ""))
  )
  density = overlap / math.sqrt(len(chunk_tokens))

  score = overlap * 2.5 + title_bonus + density
  if chunk.get("docType") in {"natops", "fti", "checklist", "supplement"}:
    score += 0.75
  if chunk.get("docType") == "curriculum":
    score -= 2.0
  return score


def best_location(chunk: dict) -> str:
  heading = (chunk.get("heading") or "").strip()
  if heading:
    return f"{heading} (page {chunk['pageStart']})"
  return f"Page {chunk['pageStart']}"


def write_json(path: Path, payload: dict | list) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(payload, indent=2), encoding="utf8")


def build_doc_chunks(document: dict) -> tuple[dict, list[Chunk]]:
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
    metadata = {
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
    }
    return metadata, []

  chunks: list[Chunk] = []
  current_heading = title
  chunk_counter = 1

  for page_number, page in enumerate(reader.pages, start=1):
    raw_text = page.extract_text() or ""
    page_text = normalize_whitespace(raw_text)
    if not page_text:
      continue

    lines = [line.strip() for line in page_text.splitlines() if line.strip()]
    if lines:
      for candidate in lines[:8]:
        if is_heading(candidate):
          current_heading = candidate
          break

    for text_chunk in split_into_chunks(page_text):
      chunk_id = f"{document['docId']}-p{page_number:04d}-c{chunk_counter:03d}"
      chunks.append(
          Chunk(
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
              text=text_chunk,
          )
      )
      chunk_counter += 1

  metadata = {
      "aircraft": folder_aircraft,
      "docId": document["docId"],
      "shortName": short_name,
      "title": title,
      "publicationNumber": publication_number,
      "docType": doc_type,
      "file": document["relativeFile"],
      "pageCount": len(reader.pages),
      "chunkCount": len(chunks),
  }
  return metadata, chunks


def load_index(path: Path) -> dict:
  return json.loads(path.read_text(encoding="utf8"))


def build_index(args: argparse.Namespace) -> int:
  pdf_root = Path(args.pdf_root)
  requested_aircraft = normalize_aircraft_name(args.aircraft)
  documents = discover_documents(pdf_root, requested_aircraft)
  docs_payload: list[dict] = []
  chunks_payload: list[dict] = []

  for document in documents:
    metadata, chunks = build_doc_chunks(document)
    docs_payload.append(metadata)
    chunks_payload.extend(chunk.to_dict() for chunk in chunks)

  payload = {
      "manifest": {
          "pdfRoot": str(pdf_root.as_posix()),
          "aircraft": requested_aircraft,
      },
      "documents": docs_payload,
      "chunks": chunks_payload,
  }
  write_json(Path(args.output), payload)
  print(f"Indexed {len(docs_payload)} document(s) into {args.output}")
  print(f"Created {len(chunks_payload)} searchable chunk(s)")
  return 0


def search_index(args: argparse.Namespace) -> int:
  index = load_index(Path(args.index))
  chunks = index["chunks"]
  requested_aircraft = normalize_aircraft_name(args.aircraft)

  if requested_aircraft:
    chunks = [chunk for chunk in chunks if resolve_record_aircraft(chunk) == requested_aircraft]
  if args.exclude_doc_type:
    excluded = {item.strip().lower() for item in args.exclude_doc_type.split(",") if item.strip()}
    chunks = [chunk for chunk in chunks if chunk.get("docType", "").lower() not in excluded]

  ranked = sorted(
      (
          {**chunk, "score": round(score_text(args.query, chunk), 3)}
          for chunk in chunks
      ),
      key=lambda item: item["score"],
      reverse=True,
  )
  ranked = [item for item in ranked if item["score"] > 0][: args.limit]

  if args.json:
    print(json.dumps(ranked, indent=2))
    return 0

  if not ranked:
    print("No matches found.")
    return 0

  for index_number, item in enumerate(ranked, start=1):
    print(
        f"{index_number}. [{item['aircraft']}] {item['shortName']} "
        f"({item.get('publicationNumber') or item['docId']}) :: {best_location(item)}"
    )
    print(f"   type={item.get('docType', 'unknown')} score={item['score']}")
    snippet = item["text"].replace("\n", " ")
    print(f"   {snippet[:260]}{'...' if len(snippet) > 260 else ''}")

  return 0


def extract_discussion_items(args: argparse.Namespace) -> int:
  pdf_root = Path(args.pdf_root)
  requested_aircraft = normalize_aircraft_name(args.aircraft)
  documents = discover_documents(pdf_root, requested_aircraft)
  extracted: list[dict] = []
  summary: list[dict] = []

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
        item_count += 1
        extracted.append(
            {
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
                "eventCode": record["eventCode"],
                "eventRefs": record["eventRefs"],
                "discussText": record["discussText"],
                "topics": record["topics"],
            }
        )

    summary.append(
        {
            "aircraft": metadata["aircraft"],
            "curriculumTitle": metadata["title"],
            "publicationNumber": metadata["publicationNumber"],
            "file": metadata["file"],
            "includedBlocks": block_count,
            "extractedDiscussItems": item_count,
        }
    )

  payload = {
      "filters": {
          "aircraft": requested_aircraft,
          "mediaFilter": args.media_filter,
      },
      "summary": summary,
      "items": extracted,
  }
  write_json(Path(args.output), payload)
  print(f"Extracted {len(extracted)} discussion-item record(s) to {args.output}")
  return 0


def match_discussion_items(args: argparse.Namespace) -> int:
  index = load_index(Path(args.index))
  extracted = load_index(Path(args.items))
  items = extracted["items"] if isinstance(extracted, dict) and "items" in extracted else extracted
  chunks = index["chunks"]

  excluded_types = {item.strip().lower() for item in args.exclude_doc_type.split(",") if item.strip()}
  output: list[dict] = []
  requested_aircraft = normalize_aircraft_name(args.aircraft)
  skipped_chunks = 0
  skipped_items = 0
  scoped_chunks: dict[str, list[dict]] = defaultdict(list)

  for chunk in chunks:
    chunk_aircraft = resolve_record_aircraft(chunk)
    if not chunk_aircraft:
      skipped_chunks += 1
      continue
    if requested_aircraft and chunk_aircraft != requested_aircraft:
      continue
    if chunk.get("docType", "").lower() in excluded_types:
      continue

    scoped_chunk = dict(chunk)
    scoped_chunk["aircraft"] = chunk_aircraft
    scoped_chunks[chunk_aircraft].append(scoped_chunk)

  for item in items:
    item_aircraft = resolve_record_aircraft(item, file_key="curriculumFile") or normalize_aircraft_name(item.get("aircraft"))
    if not item_aircraft:
      skipped_items += 1
      continue
    if requested_aircraft and item_aircraft != requested_aircraft:
      continue

    relevant_chunks = scoped_chunks.get(item_aircraft, [])

    query = " ".join(
        segment for segment in [
            item.get("blockTitle", ""),
            item.get("discussText", ""),
            " ".join(item.get("topics", [])),
        ]
        if segment
    )

    ranked = sorted(
        (
            {**chunk, "score": round(score_text(query, chunk), 3)}
            for chunk in relevant_chunks
        ),
        key=lambda chunk: chunk["score"],
        reverse=True,
    )
    ranked = [chunk for chunk in ranked if chunk["score"] > 0][: args.limit]

    output.append(
        {
            **item,
            "aircraft": item_aircraft,
            "suggestedLocations": [
                {
                    "docId": chunk["docId"],
                    "title": chunk["title"],
                    "shortName": chunk["shortName"],
                    "publicationNumber": chunk.get("publicationNumber", ""),
                    "docType": chunk.get("docType", ""),
                    "file": chunk["file"],
                    "location": best_location(chunk),
                    "pageStart": chunk["pageStart"],
                    "pageEnd": chunk["pageEnd"],
                    "score": chunk["score"],
                    "heading": chunk.get("heading", ""),
                    "snippet": chunk["text"][:500],
                }
                for chunk in ranked
            ],
        }
    )

  payload = {
      "filters": {
          "aircraft": requested_aircraft,
          "excludeDocType": sorted(excluded_types),
          "strictAircraftScope": True,
      },
      "summary": {
          "matchedItems": len(output),
          "skippedItems": skipped_items,
          "skippedChunks": skipped_chunks,
          "aircraftScopes": sorted(scoped_chunks.keys()),
      },
      "items": output,
  }
  write_json(Path(args.output), payload)
  print(f"Wrote {len(output)} matched discussion-item record(s) to {args.output}")
  return 0


def bundle_ui(args: argparse.Namespace) -> int:
  payload: dict[str, dict] = {}

  for input_path in args.inputs:
    source = load_index(Path(input_path))
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
  output_path.write_text(
      "window.GENERATED_DISCUSS = "
      + json.dumps(payload, indent=2)
      + ";\n",
      encoding="utf8",
  )
  print(f"Wrote UI bundle for {len(payload)} aircraft to {args.output}")
  return 0


def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(description="PDF discovery and discuss-item locator pipeline")
  subparsers = parser.add_subparsers(dest="command", required=True)

  index_parser = subparsers.add_parser("index", help="Index every PDF under pdfs/raw")
  index_parser.add_argument("--pdf-root", default="pdfs/raw", help="Root folder containing aircraft PDF folders")
  index_parser.add_argument("--aircraft", help="Optional aircraft filter, e.g. T-6B")
  index_parser.add_argument("--output", default="generated/pdf-index.json", help="Output index JSON")
  index_parser.set_defaults(func=build_index)

  search_parser = subparsers.add_parser("search", help="Search the indexed PDF chunks")
  search_parser.add_argument("--index", default="generated/pdf-index.json", help="Path to index JSON")
  search_parser.add_argument("--query", required=True, help="Free-text query to search")
  search_parser.add_argument("--aircraft", help="Optional aircraft filter, e.g. T-6B")
  search_parser.add_argument("--exclude-doc-type", default="", help="Comma-separated doc types to exclude")
  search_parser.add_argument("--limit", type=int, default=5, help="Max results to print")
  search_parser.add_argument("--json", action="store_true", help="Emit raw JSON results")
  search_parser.set_defaults(func=search_index)

  extract_parser = subparsers.add_parser("extract", help="Extract discuss items from curriculum-guide PDFs")
  extract_parser.add_argument("--pdf-root", default="pdfs/raw", help="Root folder containing aircraft PDF folders")
  extract_parser.add_argument("--aircraft", help="Optional aircraft filter, e.g. T-6B")
  extract_parser.add_argument(
      "--media-filter",
      choices=["sim_flight", "sim", "flight", "all"],
      default="sim_flight",
      help="Which event media to include from curriculum guides",
  )
  extract_parser.add_argument(
      "--output",
      default="generated/discuss-items.json",
      help="Output JSON of extracted discuss items",
  )
  extract_parser.set_defaults(func=extract_discussion_items)

  match_parser = subparsers.add_parser("match", help="Match extracted discuss items to source publications")
  match_parser.add_argument("--index", default="generated/pdf-index.json", help="Path to index JSON")
  match_parser.add_argument(
      "--items",
      default="generated/discuss-items.json",
      help="Path to extracted discuss items JSON",
  )
  match_parser.add_argument("--aircraft", help="Optional aircraft filter, e.g. T-6B")
  match_parser.add_argument(
      "--exclude-doc-type",
      default="curriculum",
      help="Comma-separated doc types to exclude from matching",
  )
  match_parser.add_argument("--limit", type=int, default=5, help="Max matches per discuss item")
  match_parser.add_argument(
      "--output",
      default="generated/discuss-item-locations.json",
      help="Output JSON of suggested publication/page matches",
  )
  match_parser.set_defaults(func=match_discussion_items)

  bundle_parser = subparsers.add_parser("bundle-ui", help="Bundle matched outputs into a UI-ready JS file")
  bundle_parser.add_argument("--inputs", nargs="+", required=True, help="Matched JSON files to bundle")
  bundle_parser.add_argument(
      "--output",
      default="data/generated/discuss-locations.js",
      help="Output JS bundle path",
  )
  bundle_parser.set_defaults(func=bundle_ui)

  return parser


def main(argv: list[str] | None = None) -> int:
  parser = build_parser()
  args = parser.parse_args(argv)
  return args.func(args)


if __name__ == "__main__":
  raise SystemExit(main())
