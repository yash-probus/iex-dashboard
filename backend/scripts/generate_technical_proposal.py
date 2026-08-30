import sys
import json
import os
import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Inches
import io
import base64
import copy

def format_rupee(amount):
    try:
        if amount is None or str(amount).strip() == '':
            return '₹ 0'
        amount_str = str(amount).replace(',', '').replace('₹', '').replace('Rs.', '').replace('Rs', '').strip()
        num = float(amount_str)
        s, *d = str(num).partition(".")
        r = ",".join([s[x-2:x] for x in range(-3, -len(s), -2)][::-1] + [s[-3:]])
        return f"₹ {r}"
    except (ValueError, TypeError):
        return str(amount)

def replace_in_text(text, replacements):
    if not text: return text
    for old_val, new_val in replacements.items():
        if old_val in text:
            text = text.replace(old_val, str(new_val))
    return text

def duplicate_row(row):
    tr = row._tr
    new_tr = copy.deepcopy(tr)
    tr.addnext(new_tr)
    return docx.table._Row(new_tr, row._parent)

def generate_proposal(data_json):
    if data_json.endswith('.json') and os.path.isfile(data_json):
        with open(data_json, 'r') as f:
            data = json.load(f)
    else:
        data = json.loads(data_json)
    
    template_path = data.get('template_path', '/Users/yashgupta/IEX-Dashboard/TECHNICAL PROPOSAL_11KV.docx')
    output_path = data.get('output_path', '/Users/yashgupta/IEX-Dashboard/generated_technical_proposal.docx')
    
    doc = docx.Document(template_path)
    client_name = data.get('client_name') or data.get('industry_name') or 'CLIENT XYZ'
    
    sanctioned_load = f"{data.get('sanctioned_load', '1000')} KVA" if data.get('sanctioned_load') else "1000 KVA"
    connectivity = f"{data.get('connectivity', '11')} KV" if data.get('connectivity') else "11 KV"
    discom_name = data.get('discom_name') or 'PUVVNL'
    feeder_type = data.get('feeder_type') or 'Dedicated'
    
    avg_monthly_savings = data.get('average_monthly_savings', 211034)
    avg_annual_savings = data.get('average_annual_savings', 2532409)

    replacements = {
        'XXXXXXXXXXXXXX': client_name.upper(),
        'Client XYZ': client_name.upper(),
        'CLIENT XYZ': client_name.upper(),
        'Chaurishi Ayurveda LLP': client_name,
        '1000 KVA': sanctioned_load,
        '11 KV': connectivity,
        'PUVVNL': discom_name,
        'Dedicated': feeder_type,
        '₹2,11,034': format_rupee(avg_monthly_savings),
        '₹25,32,409': format_rupee(avg_annual_savings)
    }
    
    # 1. Update text paragraphs
    for p in doc.paragraphs:
        for run in p.runs:
            if run.text:
                run.text = replace_in_text(run.text, replacements)
                
    # 2. Update tables (except the savings table which we'll handle separately)
    savings_table_index = -1
    for i, t in enumerate(doc.tables):
        is_savings_table = False
        if len(t.rows) > 0 and len(t.rows[0].cells) > 2:
            if 'Bill Months' in t.rows[0].cells[0].text or 'Billing Period' in t.rows[0].cells[1].text:
                savings_table_index = i
                is_savings_table = True
        
        if not is_savings_table:
            for r in t.rows:
                for c in r.cells:
                    for p in c.paragraphs:
                        for run in p.runs:
                            if run.text:
                                run.text = replace_in_text(run.text, replacements)
    
    # 3. Handle savings table
    if savings_table_index != -1 and 'monthlyData' in data:
        t = doc.tables[savings_table_index]
        monthly_data = data.get('monthlyData', [])
        
        # Determine the template row (first data row, usually index 2 because 0 and 1 are headers)
        template_row_idx = 2
        
        # Add new rows based on data
        if monthly_data and len(t.rows) > template_row_idx:
            # We copy the template row format
            # Then we remove existing data rows, and insert new ones
            
            # Keep header rows
            header_rows = t.rows[:template_row_idx]
            template_row = t.rows[template_row_idx]
            
            # Generate new rows
            for item in monthly_data:
                new_row = duplicate_row(template_row)
                cells = new_row.cells
                
                # Assign values
                month_label = item.get('month', '')
                billing_period = '' # We could derive from month
                actual_units = item.get('discom_only', {}).get('volume', 0)
                cleared_oa = ''
                discom_total = format_rupee(item.get('discom_only', {}).get('total_amount', 0))
                discom_pu = item.get('discom_only', {}).get('per_unit_effective', 0)
                mix_total = format_rupee(item.get('oa_mix', {}).get('total_amount', 0))
                mix_pu = item.get('oa_mix', {}).get('per_unit_effective', 0)
                savings = format_rupee(item.get('savings', 0))
                savings_pu = item.get('savings_per_unit', 0)
                
                if len(cells) > 0:
                    cells[0].text = str(month_label)
                if len(cells) > 1:
                    cells[1].text = str(billing_period)
                if len(cells) > 2:
                    cells[2].text = str(actual_units)
                if len(cells) > 3:
                    cells[3].text = str(cleared_oa)
                if len(cells) > 4:
                    cells[4].text = str(discom_total)
                if len(cells) > 5:
                    cells[5].text = str(discom_pu)
                if len(cells) > 6:
                    cells[6].text = str(mix_total)
                if len(cells) > 7:
                    cells[7].text = str(mix_pu)
                if len(cells) > 8:
                    cells[8].text = str(savings)
                if len(cells) > 9:
                    cells[9].text = str(savings_pu)
                    
                # Re-apply yellow highlight for savings cells if needed
                for cell_idx in [0, 2, 3, 4, 6, 8, 9]:
                    if len(cells) > cell_idx:
                        p = cells[cell_idx].paragraphs[0] if cells[cell_idx].paragraphs else cells[cell_idx].add_paragraph()
                        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        for run in p.runs:
                            rPr = run._element.get_or_add_rPr()
                            highlight = OxmlElement('w:highlight')
                            highlight.set(qn('w:val'), 'yellow')
                            rPr.append(highlight)
                            
            # Delete original data rows (including template row)
            # docx doesn't have an easy way to delete rows, so we just clear text or remove tr elements
            for i in range(len(t.rows)-1, template_row_idx-1, -1):
                row = t.rows[i]
                tbl = row._tr.getparent()
                tbl.remove(row._tr)
                
    # 4. Handle Chart Replacement
    chart_b64 = data.get('monthly_savings_chart')
    if chart_b64:
        try:
            image_data = base64.b64decode(chart_b64)
            image_stream = io.BytesIO(image_data)
            
            # Find the paragraph with the image
            for p in doc.paragraphs:
                if 'Graphic' in p._element.xml or 'pic:pic' in p._element.xml:
                    # Clear the paragraph
                    p.clear()
                    # Add new image
                    run = p.add_run()
                    run.add_picture(image_stream, width=Inches(6.0))
        except Exception as e:
            print(f"Error replacing image: {e}")

    if os.path.dirname(output_path):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"Successfully generated technical proposal at {output_path}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        generate_proposal(sys.argv[1])
    else:
        print("No input json provided")
