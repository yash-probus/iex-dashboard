from docx import Document

def list_tables(filepath):
    doc = Document(filepath)
    print(f"--- {filepath} ---")
    for i, t in enumerate(doc.tables):
        print(f"Table {i}:")
        for row in t.rows:
            row_text = []
            for cell in row.cells:
                row_text.append(cell.text.strip())
            print(" | ".join(row_text))
        print()

list_tables('backend/assets/templates/technical_proposal_template.docx')
