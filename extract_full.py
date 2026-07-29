import json

log_file = "/Users/yashgupta/.gemini/antigravity-ide/brain/31e46fb9-96d7-418f-b373-cdd6c4452886/.system_generated/logs/transcript_full.jsonl"
last_user_input = ""

try:
    with open(log_file, "r") as f:
        for line in f:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                last_user_input = data.get("content", "")
    
    # Save the extracted input to a file to inspect its size and end
    with open("full_user_input.html", "w") as out:
        out.write(last_user_input)
    print("Extracted length:", len(last_user_input))
except Exception as e:
    print("Error:", e)
