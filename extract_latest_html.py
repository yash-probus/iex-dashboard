import json

log_path = "/Users/yashgupta/.gemini/antigravity-ide/brain/0e78b7cc-1161-4e38-9e35-bf981e2a10fc/.system_generated/logs/transcript_full.jsonl"
latest_html = None

for line in open(log_path):
    try:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            lower_c = content.lower()
            if "<!doctype html>" in lower_c and "the delhi flour mills" in lower_c:
                start = lower_c.find("<!doctype html>")
                end = lower_c.rfind("</html>")
                if end == -1:
                    end = len(content)
                else:
                    end += 7
                latest_html = content[start:end]
    except Exception as e:
        pass

if latest_html:
    with open("/Users/yashgupta/IEX-Dashboard/frontend/public/dashboard.html", "w") as f:
        f.write(latest_html)
    print(f"Extracted latest HTML successfully, length {len(latest_html)}")
else:
    print("Could not find the HTML!")
