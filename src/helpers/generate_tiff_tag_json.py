import json
import requests
from bs4 import BeautifulSoup

loc_url = "https://www.loc.gov/preservation/digital/formats/content/tiff_tags.shtml"

response = requests.get(loc_url)

soup = BeautifulSoup(response.text)

tbody_for_tags = soup.find_all('tbody')[1]

tags_dict = {}

for row in tbody_for_tags.find_all('tr'):
    data = {}
    for i, cell in enumerate(row.find_all('td')):
        if i == 0:
            data['dec'] = int(cell.text)
            data['hex'] = hex(data['dec'])
        elif i == 2:
            data['name'] = cell.text
        elif i == 3:
            data['source'] = cell.text
        elif i == 4:
            data['notes'] = cell.encode_contents().decode('utf-8')

    tags_dict[data['dec']] = data

with open('tiff_tags.json', 'w') as f:
    json.dump(tags_dict, f, indent=4)

pass
