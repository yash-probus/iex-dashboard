import urllib.request
import urllib.error

urls = [
    "https://www.iexindia.com/api/calculator?voltage=11&state=Uttar+Pradesh&consumerCategory=Industrial+General&todMonth=Apr+-+Sept&todSlot=RTC+(24+Hrs)",
    "https://api.iexindia.com/calculator?voltage=11&state=Uttar+Pradesh&consumerCategory=Industrial+General&todMonth=Apr+-+Sept&todSlot=RTC+(24+Hrs)",
    "https://www.iexindia.com/calculator?voltage=11&state=Uttar+Pradesh&consumerCategory=Industrial+General&todMonth=Apr+-+Sept&todSlot=RTC+(24+Hrs)"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        print(f"Success for {url}:")
        print(response.read().decode('utf-8')[:200])
    except Exception as e:
        print(f"Error for {url}: {e}")
