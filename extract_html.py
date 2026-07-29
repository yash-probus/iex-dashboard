import json

log_path = "/Users/yashgupta/.gemini/antigravity-ide/brain/0e78b7cc-1161-4e38-9e35-bf981e2a10fc/.system_generated/logs/transcript_full.jsonl"

for line in open(log_path):
    try:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            if "<!doctype html>" in content and "The Delhi Flour Mills | Energy Insight Suite" in content:
                # write the HTML out to a file
                start = content.find("<!doctype html>")
                end = content.find("</html>", start) + 7
                html = content[start:end]
                with open("/Users/yashgupta/IEX-Dashboard/frontend/public/dashboard.html", "w") as f:
                    f.write(html)
                print("Extracted HTML successfully")
    except Exception as e:
        pass
