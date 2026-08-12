import sys
from docx import Document

doc = Document('backend/assets/templates/technical_proposal_template.docx')
for i, p in enumerate(doc.paragraphs):
    if p.text.strip():
        print(f"P{i}: {p.text.strip()}")
