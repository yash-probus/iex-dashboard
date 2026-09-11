import sys
import json
import os
import pdfplumber
import re

def to_float(val):
    if not val:
        return 0.0
    return float(val.replace(",", "").strip())

def clean_text(text):
    """Normalize multi-line text into single line"""
    return " ".join(text.split())

def normalize_key(label):
    """Convert labels to JSON-friendly keys"""
    label = label.lower()
    label = label.replace("&", "and")
    label = re.sub(r"[^a-z0-9]+", "_", label)
    label = re.sub(r"_+", "_", label)
    return label.strip("_")

def extract_full_iex_report(file_path):
    data = {
        "trading_date": None,
        "delivery_date": None,
        "entity_id": None,
        "entity_name": None,
        "portfolio_code": None,
        "portfolio_name": None,
        "charges": {},
        "funds_payin_payout": None,
        "total_amount": None,
        "total_trade_mwh": None,
        "remarks": None,
        "trades": [],
        "oa_market_type": None
    }

    # Determine market type from filename
    filename = os.path.basename(file_path)
    if filename.startswith("RTM_IEX"):
        data["oa_market_type"] = "RTM"
    elif filename.startswith("GDAM_IEX"):
        data["oa_market_type"] = "GDAM"
    elif filename.startswith("IEX"):
        data["oa_market_type"] = "DAM"

    with pdfplumber.open(file_path) as pdf:
        page1 = pdf.pages[0].extract_text()
        
        if page1:
            m = re.search(r"Trading Date\s*:\s*(\d{1,2}-\w{3}-\d{2})", page1)
            if m:
                data["trading_date"] = m.group(1)

            m = re.search(r"Delivery Date\s*:\s*(\d{1,2}-\w{3}-\d{2})", page1)
            if m:
                data["delivery_date"] = m.group(1)

            # Note: We override market type with filename, but if filename is not recognized, fallback to date logic
            if not data["oa_market_type"]:
                if data["trading_date"] is None and data["delivery_date"] is not None:
                    data["trading_date"] = data["delivery_date"]
                    data["oa_market_type"] = "RTM"
                elif data["trading_date"] is not None and data["delivery_date"] is not None and data["trading_date"] != data["delivery_date"]:
                    data["oa_market_type"] = "DAM"

            m = re.search(r"Entity ID\s*:\s*([A-Z0-9]+)", page1)
            if m:
                data["entity_id"] = m.group(1)

            m = re.search(r"Entity Name\s*:\s*(.+?)(?:Portfolio Code|$)", page1, re.S)
            if m:
                data["entity_name"] = clean_text(m.group(1))

            m = re.search(r"Portfolio Code\s*:\s*([A-Z0-9]+)", page1)
            if m:
                data["portfolio_code"] = m.group(1)

            m = re.search(r"Portfolio Name\s*:\s*(.+?)(?:Funds Payin|Charges|$)", page1, re.S)
            if m:
                data["portfolio_name"] = clean_text(m.group(1))

            m = re.search(r"Funds Payin\(-\)\s*/\s*Payout\(\+\)\s+(-?[\d,]+\.\d+)", page1)
            if m:
                data["funds_payin_payout"] = to_float(m.group(1))

            charge_matches = re.findall(r"(?:>\s*|^)([A-Za-z &\-/]+?)\s+(-?[\d,]+\.\d+)", page1, re.MULTILINE)
            for label, amount in charge_matches:
                label = clean_text(label)
                if label.lower() in ["total", "funds payin(-) / payout(+)"]:
                    continue
                key = normalize_key(label)
                data["charges"][key] = to_float(amount)

            if "fees" not in data["charges"]:
                m = re.search(r"Fees\s+(-?[\d,]+\.\d+)", page1)
                if m:
                    data["charges"]["fees"] = to_float(m.group(1))

            m = re.search(r"Total\s+(-?[\d,]+\.\d+)", page1)
            if m:
                data["total_amount"] = to_float(m.group(1))

            remarks_match = re.search(r"Remarks\s*:(.*?)(\*\* This is a computer generated report|\Z)", page1, re.S)
            if remarks_match:
                data["remarks"] = clean_text(remarks_match.group(1))

        if len(pdf.pages) > 1:
            page2 = pdf.pages[1].extract_text()
            if page2:
                m = re.search(r"Total Trade.*?MWh\s+([\d.]+)", page2)
                if m:
                    data["total_trade_mwh"] = to_float(m.group(1))

                trade_matches = re.findall(r"(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\s+(-?[\d.]+)\s+([\d,]+\.\d+)\s+(-?[\d,]+\.\d+)", page2)
                sum_qty = 0.0
                for period, qty, rate, amount in trade_matches:
                    q = to_float(qty)
                    data["trades"].append({
                        "period": period,
                        "qty_mw": q,
                        "rate_mwh": to_float(rate),
                        "amount": to_float(amount)
                    })
                    if q > 0:
                        sum_qty += q
                        
                if data["total_trade_mwh"] is None and sum_qty > 0:
                    data["total_trade_mwh"] = sum_qty * 0.25

    return data

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file paths provided"}))
        sys.exit(1)
        
    results = {}
    files_status = []
    
    for file_path in sys.argv[1:]:
        filename = os.path.basename(file_path)
        try:
            parsed = extract_full_iex_report(file_path)
            results[filename] = parsed
            files_status.append({
                "file_name": filename,
                "status": "SUCCESS",
                "message": "OK"
            })
        except Exception as e:
            files_status.append({
                "file_name": filename,
                "status": "FAILURE",
                "message": str(e)
            })

    output = {
        "data": results,
        "files_status": files_status
    }
    
    print(json.dumps(output))

if __name__ == "__main__":
    main()
