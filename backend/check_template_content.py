import sys
from docx import Document

doc = Document('assets/templates/technical_proposal_template.docx')
for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    if text:
        print(f"P{i}: {text}")
