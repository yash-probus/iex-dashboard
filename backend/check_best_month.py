import sys
from docx import Document

doc = Document('assets/templates/technical_proposal_template.docx')
for i, p in enumerate(doc.paragraphs):
    if "strongest saving" in p.text:
        print(f"P{i}: {p.text}")
