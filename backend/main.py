import requests

url = "https://api.pavlok.com/api/v5/stimulus/send"

payload = { "stimulus": {
        "stimulusType": "beep",
        "stimulusValue": 100
    } }
headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlBhcnRpbmcgT3JjaGlkIEJsYXN0b2lzZSIsImlkIjoyMDI0ODEsImVtYWlsIjoiZ2lvaWFiZWxsYUBtZS5jb20iLCJpc19hcHBsaWNhdGlvbiI6ZmFsc2UsImV4cCI6MTgwMDIyOTE4Mywic3ViIjoiYWNjZXNzIn0.162j0_fqFQG8I5XBdHmoEui-Vi2pRu79bchbGVtY4W4"
}

response = requests.post(url, json=payload, headers=headers)

print(response.text)
