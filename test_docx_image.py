import docx
from docx.oxml.ns import qn

doc = docx.Document('backend/assets/templates/COMMERCIAL PROPOSAL_33KV.docx')
p_last = doc.paragraphs[-1]._element

for drawing in p_last.iter(qn('w:drawing')):
    wp_inline = drawing.find(qn('wp:inline'))
    wp_anchor = drawing.find(qn('wp:anchor'))
    
    if wp_inline is not None:
        ext = wp_inline.find(qn('wp:extent'))
        print(f"Inline image size: cx={ext.get('cx')} cy={ext.get('cy')}")
    if wp_anchor is not None:
        ext = wp_anchor.find(qn('wp:extent'))
        print(f"Floating image size: cx={ext.get('cx')} cy={ext.get('cy')}")

