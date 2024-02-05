"""
Document Processing and Chunking Pipeline.
Parses academic curriculum documents (Markdown/Text), performs recursive chunking
with boundary overlap, and enriches chunks with pedagogical metadata tags.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import re
import hashlib
from pathlib import Path

class DocumentChunk(BaseModel):
    chunk_id: str
    doc_id: str
    doc_title: str
    subject: str
    topic_id: str
    topic_name: str
    difficulty: str  # Beginner, Intermediate, Advanced
    bloom_level: str  # Remember, Understand, Apply, Analyze, Evaluate, Create
    content: str
    token_count: int
    char_length: int
    prerequisites: List[str] = []
    metadata: Dict[str, Any] = {}

class DocumentProcessor:
    """
    Splits text/markdown documents into semantic chunks respecting header boundaries
    and paragraph structures while preserving context overlap.
    """
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 80):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def process_text(
        self,
        raw_text: str,
        doc_id: str,
        doc_title: str,
        subject: str = "Computer Science",
        default_topic_id: str = "general",
        default_topic_name: str = "General",
        default_difficulty: str = "Intermediate",
        default_bloom: str = "Understand",
        prerequisites: Optional[List[str]] = None
    ) -> List[DocumentChunk]:
        """
        Parses text and splits by sections or recursive paragraph windows.
        """
        prereqs = prerequisites or []
        sections = self._split_by_markdown_headers(raw_text)
        chunks: List[DocumentChunk] = []

        for section_title, section_text in sections:
            # Detect section metadata if present in text
            meta = self._extract_inline_metadata(section_text)
            topic_id = meta.get("topic_id", default_topic_id)
            topic_name = meta.get("topic_name", section_title or default_topic_name)
            difficulty = meta.get("difficulty", default_difficulty)
            bloom = meta.get("bloom_level", default_bloom)
            sec_prereqs = meta.get("prerequisites", prereqs)

            # Clean markdown meta comments from body
            cleaned_text = re.sub(r"<!--.*?-->", "", section_text, flags=re.DOTALL).strip()
            
            # Recursive chunking
            raw_splits = self._recursive_split(cleaned_text, self.chunk_size, self.chunk_overlap)
            
            for idx, split_text in enumerate(raw_splits):
                if not split_text.strip():
                    continue
                
                # Deterministic chunk ID
                chunk_hash = hashlib.md5(f"{doc_id}_{section_title}_{idx}_{split_text[:40]}".encode()).hexdigest()[:10]
                chunk_id = f"{doc_id}_c{idx}_{chunk_hash}"
                approx_tokens = max(len(split_text.split()), 1)

                chunks.append(DocumentChunk(
                    chunk_id=chunk_id,
                    doc_id=doc_id,
                    doc_title=doc_title,
                    subject=subject,
                    topic_id=topic_id,
                    topic_name=topic_name,
                    difficulty=difficulty,
                    bloom_level=bloom,
                    content=split_text.strip(),
                    token_count=approx_tokens,
                    char_length=len(split_text),
                    prerequisites=sec_prereqs,
                    metadata={
                        "section_title": section_title,
                        "chunk_index": idx,
                        "total_section_chunks": len(raw_splits)
                    }
                ))

        return chunks

    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Reads file from disk and parses it into chunks."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        doc_id = file_path.stem
        # Derive title
        first_line = content.strip().split("\n")[0]
        title = first_line.lstrip("#").strip() if first_line.startswith("#") else doc_id.replace("_", " ").title()
        
        return self.process_text(
            raw_text=content,
            doc_id=doc_id,
            doc_title=title
        )

    def _split_by_markdown_headers(self, text: str) -> List[tuple[str, str]]:
        """Splits markdown into header-delimited blocks."""
        header_pattern = re.compile(r"^(#{1,3}\s+.+)$", re.MULTILINE)
        splits = header_pattern.split(text)
        
        sections: List[tuple[str, str]] = []
        if splits and not header_pattern.match(splits[0]):
            preamble = splits.pop(0).strip()
            cleaned_preamble = re.sub(r"<!--.*?-->", "", preamble, flags=re.DOTALL).strip()
            if not cleaned_preamble and len(splits) >= 2:
                splits[1] = f"{preamble}\n\n{splits[1]}"
            elif preamble:
                sections.append(("Overview", preamble))
                
        i = 0
        while i < len(splits):
            header = splits[i].strip().lstrip("#").strip()
            body = splits[i + 1].strip() if i + 1 < len(splits) else ""
            sections.append((header, f"{header}\n\n{body}"))
            i += 2
            
        if not sections:
            sections.append(("Full Document", text))
            
        return sections

    def _recursive_split(self, text: str, max_chars: int, overlap: int) -> List[str]:
        """
        Recursively splits text on paragraph breaks (\n\n), line breaks (\n),
        or sentence boundaries (. ) to keep thoughts contiguous.
        """
        if len(text) <= max_chars:
            return [text]

        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
                
            if len(current_chunk) + len(p) + 2 <= max_chars:
                current_chunk = f"{current_chunk}\n\n{p}".strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # apply overlap by grabbing trailing lines
                    overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                    current_chunk = f"{overlap_text}\n\n{p}".strip()
                else:
                    # Paragraph itself is longer than max_chars, split by sentence
                    sentences = re.split(r"(?<=[.!?])\s+", p)
                    for s in sentences:
                        if len(current_chunk) + len(s) + 1 <= max_chars:
                            current_chunk = f"{current_chunk} {s}".strip()
                        else:
                            if current_chunk:
                                chunks.append(current_chunk)
                            current_chunk = s
                            
        if current_chunk:
            chunks.append(current_chunk)
            
        return chunks

    def _extract_inline_metadata(self, text: str) -> Dict[str, Any]:
        """Extracts JSON or key-value metadata embedded in HTML comments."""
        meta = {}
        comment_match = re.search(r"<!--\s*metadata:(.*?)\s*-->", text, re.DOTALL | re.IGNORECASE)
        if comment_match:
            lines = comment_match.group(1).strip().split("\n")
            for line in lines:
                if ":" in line:
                    k, v = line.split(":", 1)
                    k = k.strip().lower()
                    v = v.strip()
                    if k == "prerequisites":
                        meta[k] = [p.strip() for p in v.split(",") if p.strip()]
                    else:
                        meta[k] = v
        return meta
