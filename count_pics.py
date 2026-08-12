from docx import Document

def count_pics(filepath):
    doc = Document(filepath)
    count = 0
    for p in doc.paragraphs:
        for r in p.runs:
            if '<w:drawing>' in r._element.xml:
                count += 1
    print(f"{filepath}: {count} pictures")

count_pics('backend/assets/templates/commercial_proposal_template.docx')
count_pics('backend/assets/templates/technical_proposal_template.docx')
