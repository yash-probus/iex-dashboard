import docx
doc = docx.Document('backend/assets/templates/COMMERCIAL PROPOSAL_33KV.docx')
for i, p in enumerate(doc.paragraphs[-10:]):
    print(f"Para {-10+i}: runs: {len(p.runs)} text: '{p.text}'")
    for j, r in enumerate(p.runs):
        print(f"  Run {j}: xml: {r._element.xml[:100]}")
