"""
Extraction de texte depuis des fichiers PDF.
Utilise PyMuPDF (fitz) — rapide et précis.
Fallback OCR avec pytesseract si PDF scanné/image.
"""

import re
from typing import Tuple


def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, int]:
    """
    Extrait le texte d'un PDF depuis ses bytes.
    Optimisé pour systèmes RAG (LLM).
    Fallback OCR automatique si PDF scanné.
    """
    try:
        import fitz
    except ImportError:
        raise ImportError("Installer PyMuPDF : pip install pymupdf")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"PDF illisible : {e}")

    page_count = doc.page_count
    if page_count == 0:
        raise ValueError("Le PDF ne contient aucune page.")

    pages_text = []
    ocr_needed_pages = []  # pages sans texte sélectionnable

    for page_num in range(page_count):
        page = doc.load_page(page_num)

        # Méthode 1 (meilleure pour documents structurés)
        text = page.get_text("markdown")

        # Fallback si page vide
        if not text.strip():
            blocks = page.get_text("blocks")
            text = "\n".join(block[4] for block in blocks if len(block) > 4)

        if text.strip():
            pages_text.append((page_num, f"[Page {page_num + 1}]\n{text.strip()}"))
        else:
            # Marquer cette page pour OCR
            ocr_needed_pages.append(page_num)

    # --- Fallback OCR pour les pages sans texte ---
    if ocr_needed_pages:
        print(f"Pages sans texte détectées ({len(ocr_needed_pages)}) → OCR en cours...")
        ocr_results = _ocr_pages(doc, ocr_needed_pages)
        pages_text.extend(ocr_results)

    doc.close()

    # Trier les pages dans l'ordre
    pages_text.sort(key=lambda x: x[0])
    full_text = "\n\n".join(content for _, content in pages_text)

    # Nettoyage léger
    full_text = clean_extracted_text(full_text)

    # Debug utile
    print(f"Pages       : {page_count}")
    print(f"Pages OCR   : {len(ocr_needed_pages)}")
    print(f"Chars extraits: {len(full_text)}")

    if len(full_text.strip()) < 50:
        raise ValueError(
            f"Texte extrait trop court ({len(full_text)} caractères). "
            "Vérifiez que le PDF n'est pas protégé ou corrompu."
        )

    return full_text, page_count


def _ocr_pages(doc, page_nums: list) -> list:
    """
    OCR sur les pages spécifiées via pytesseract.
    Retourne une liste de tuples (page_num, text).
    """
    try:
        import pytesseract
        from PIL import Image
        import io
    except ImportError:
        raise ImportError(
            "OCR requis mais dépendances manquantes.\n"
            "Installer : pip install pytesseract pillow\n"
            "Puis Tesseract OCR : https://github.com/tesseract-ocr/tesseract"
        )

    results = []

    for page_num in page_nums:
        page = doc.load_page(page_num)

        # Rendu haute résolution (300 DPI pour OCR de qualité)
        mat = page.get_fitz_matrix_from_dpi(300) if hasattr(page, 'get_fitz_matrix_from_dpi') \
              else __import__('fitz').Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        # Conversion en image PIL
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))

        # OCR avec support français et arabe
        # lang='fra' pour français seul, 'fra+ara' si documents bilingues
        try:
            text = pytesseract.image_to_string(img, lang='fra', config='--psm 3')
        except pytesseract.TesseractError:
            # Fallback sans spécifier la langue
            text = pytesseract.image_to_string(img, config='--psm 3')

        if text.strip():
            results.append((page_num, f"[Page {page_num + 1}] [OCR]\n{text.strip()}"))
        else:
            print(f"  ⚠ Page {page_num + 1} : OCR n'a rien extrait.")

    return results


def _get_fitz_matrix(dpi: int = 300):
    """Crée une matrice de transformation pour le rendu à la résolution souhaitée."""
    import fitz
    scale = dpi / 72  # 72 DPI = résolution native PDF
    return fitz.Matrix(scale, scale)


def clean_extracted_text(text: str) -> str:
    """Nettoyage adapté aux documents universitaires."""
    lines = [line.strip() for line in text.splitlines()]

    cleaned = []
    for line in lines:
        if not line:
            cleaned.append("")
            continue

        # Évite de fusionner les marqueurs de page et titres
        is_marker = line.startswith("[Page ") or line.startswith("#")
        if (
            not is_marker
            and cleaned
            and cleaned[-1]
            and not cleaned[-1].startswith("[Page ")
            and len(line) < 60
            and len(cleaned[-1]) < 120
            and cleaned[-1][-1] not in ".!?:"
        ):
            cleaned[-1] += " " + line
            continue

        cleaned.append(line)

    text = "\n".join(cleaned)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def get_pdf_metadata(file_bytes: bytes) -> dict:
    """Retourne les métadonnées d'un PDF."""
    try:
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        meta = doc.metadata or {}
        result = {
            "title":    meta.get("title", ""),
            "author":   meta.get("author", ""),
            "pages":    doc.page_count,
            "size_kb":  round(len(file_bytes) / 1024, 1),
        }
        doc.close()
        return result
    except Exception:
        return {"pages": 0, "size_kb": round(len(file_bytes) / 1024, 1)}