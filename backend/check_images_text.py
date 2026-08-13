from docx import Document

doc = Document('backend/assets/templates/technical_proposal_template.docx')

for i in range(80, 115):
    p = doc.paragraphs[i]
    has_graphic = any('graphic' in run._element.xml for run in p.runs)
    print(f"P {i} (Has image: {has_graphic}): {p.text}")

