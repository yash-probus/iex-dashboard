import sys
import json
import docx

def format_rupee(val):
    if val is None or val == '':
        return ''
    if isinstance(val, (int, float)):
        # Format with Indian comma grouping
        s, *d = f"{val:.2f}".split('.')
        r = []
        for i, ch in enumerate(reversed(s)):
            if i == 3 or (i > 3 and (i - 3) % 2 == 0):
                r.append(',')
            r.append(ch)
        formatted = "".join(reversed(r))
        return f"₹{formatted}.{d[0]}" if d else f"₹{formatted}"
    val_str = str(val).strip()
    if val_str.startswith('₹'):
        return val_str
    try:
        num = float(val_str.replace(',', '').replace('₹', '').replace('/kWh', '').replace('%', ''))
        return format_rupee(num)
    except:
        return val_str

def generate_proposal(data_json):
    data = json.loads(data_json)
    template_path = data.get('template_path', '/Users/yashgupta/IEX-Dashboard/COMMERCIAL PROPOSAL_V2.docx')
    output_path = data.get('output_path', '/Users/yashgupta/IEX-Dashboard/generated_commercial_proposal.docx')
    
    doc = docx.Document(template_path)
    
    # 1. Update Title Paragraph P2
    client_name = data.get('client_name') or data.get('industry_name') or 'CLIENT'
    for p in doc.paragraphs:
        if 'XXXXXXXXXXXXX' in p.text:
            p.text = p.text.replace('XXXXXXXXXXXXX', client_name.upper())

    # 2. Update Table 0 (Facility Parameters)
    if len(doc.tables) > 0:
        t0 = doc.tables[0]
        if len(t0.rows) > 1:
            r1 = t0.rows[1].cells
            sanctioned_load = str(data.get('sanctioned_load') or data.get('sanctioned_load_kw') or '1000 kW')
            if not sanctioned_load.lower().endswith('kw') and not sanctioned_load.lower().endswith('kva'):
                sanctioned_load += ' kW'
            r1[0].text = sanctioned_load
            r1[1].text = str(data.get('connectivity') or data.get('voltage_level') or '11 kV')
            r1[2].text = str(data.get('discom_name') or data.get('discom') or 'DISCOM')
            r1[3].text = str(data.get('feeder_type') or 'Dedicated Feeder')

    # Helper function to set cell text with bold formatting
    def set_cell_value(cell, text, bold=False):
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(str(text))
        if bold:
            run.bold = True

    # 3. Update Table 2 (Fixed One-Time Cost)
    if len(doc.tables) > 2:
        t2 = doc.tables[2]
        c_supply = float(data.get('abt_supply_cost', 450000))
        c_service = float(data.get('abt_service_cost', 350000))
        c_liaison = float(data.get('utility_liaisoning_cost', 300000))
        c_bg = float(data.get('bank_guarantee_cost', 150000))
        c_total = c_supply + c_service + c_liaison
        
        if len(t2.rows) > 2: set_cell_value(t2.rows[2].cells[4], format_rupee(c_supply))
        if len(t2.rows) > 3: set_cell_value(t2.rows[3].cells[4], format_rupee(c_service))
        if len(t2.rows) > 4: set_cell_value(t2.rows[4].cells[4], format_rupee(c_liaison))
        if len(t2.rows) > 5: set_cell_value(t2.rows[5].cells[4], format_rupee(c_liaison))
        if len(t2.rows) > 6: set_cell_value(t2.rows[6].cells[4], format_rupee(c_total), bold=True)
        if len(t2.rows) > 8: set_cell_value(t2.rows[8].cells[4], format_rupee(c_bg))

    # 4. Update Table 3 (Fixed Recurring Charges)
    if len(doc.tables) > 3:
        t3 = doc.tables[3]
        if len(t3.rows) > 1: set_cell_value(t3.rows[1].cells[4], format_rupee(data.get('iex_annual_fee', 100000)))
        if len(t3.rows) > 2: set_cell_value(t3.rows[2].cells[4], format_rupee(data.get('sldc_monthly_noc', 7000)))
        if len(t3.rows) > 3: set_cell_value(t3.rows[3].cells[4], format_rupee(data.get('st11_settlement', 20000)))

    # 5. Update Table 4 (Probus Fees)
    if len(doc.tables) > 4:
        t4 = doc.tables[4]
        tm = str(data.get('trading_margin', '2p/kWh'))
        pf = str(data.get('platform_fee', '2p/kWh'))
        vs = str(data.get('value_share', '15%'))
        if not vs.endswith('%'): vs += '%'
        smart = float(data.get('smart_metering_infra', 125000))
        
        if len(t4.rows) > 1: set_cell_value(t4.rows[1].cells[4], tm)
        if len(t4.rows) > 2: set_cell_value(t4.rows[2].cells[4], pf)
        if len(t4.rows) > 3: set_cell_value(t4.rows[3].cells[4], vs)
        if len(t4.rows) > 4: set_cell_value(t4.rows[4].cells[4], format_rupee(smart))

    doc.save(output_path)
    print(f"Successfully generated commercial proposal at {output_path}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        generate_proposal(sys.argv[1])
    else:
        print("No input json provided")
