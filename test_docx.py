import docx
doc = docx.Document('backend/assets/templates/COMMERCIAL PROPOSAL_33KV.docx')
print(f"Sections: {len(doc.sections)}")
for i, section in enumerate(doc.sections):
    print(f"Section {i}: Header linked: {section.header.is_linked_to_previous}")
    print(f"Top margin: {section.top_margin}")

print("Last shapes/images in document:")
for rel in doc.part.rels.values():
    if "image" in rel.target_ref:
        print(rel.target_ref)
