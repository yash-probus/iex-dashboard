import requests
import json

response = requests.get("https://iexrtmprice.com/DSM_Data/", params={
    "Product_Code": "1", # DAM
    "From_Date": "22/09/2026",
    "To_Date": "22/09/2026"
})
data = response.json()
if "Delivery_Date_Details" in data and len(data["Delivery_Date_Details"]) > 0:
    token_wise = data["Delivery_Date_Details"][0].get("Token_Wise", [])
    if len(token_wise) > 0:
        print(json.dumps(token_wise[0].get("All_India_DAM_GDAM_RTM", {}), indent=2))
        print(json.dumps(token_wise[0].get("Area_Details", [])[0], indent=2))
