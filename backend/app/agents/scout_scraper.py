import requests
from bs4 import BeautifulSoup
import re


def scrape_ebay_motors(search_term: str, max_results: int = 10):
    """
    Scrape public eBay Motors listings for a given search term.
    Returns a list of dicts with title, price, mileage, location, and URL.
    """
    base_url = "https://www.ebay.com/sch/Cars-Trucks/6001/i.html"
    params = {
        '_nkw': search_term,
        '_sop': '12',  # Sort by newly listed
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Accorria/1.0)'
    }
    resp = requests.get(base_url, params=params, headers=headers)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')

    results = []
    for item in soup.select('.s-item'):
        title_tag = item.select_one('.s-item__title')
        price_tag = item.select_one('.s-item__price')
        url_tag = item.select_one('.s-item__link')
        loc_tag = item.select_one('.s-item__location')
        mileage_tag = item.find(string=re.compile(r"[0-9,]+ miles"))

        if not (title_tag and price_tag and url_tag):
            continue

        title = title_tag.get_text(strip=True)
        price = price_tag.get_text(strip=True)
        url = url_tag['href']
        location = loc_tag.get_text(strip=True) if loc_tag else None
        mileage = None
        if mileage_tag:
            mileage_match = re.search(r"([0-9,]+) miles", mileage_tag)
            if mileage_match:
                mileage = mileage_match.group(1).replace(',', '')

        results.append({
            'title': title,
            'price': price,
            'mileage': mileage,
            'location': location,
            'url': url
        })
        if len(results) >= max_results:
            break
    return results


if __name__ == "__main__":
    # Quick test: search for "Honda Accord"
    listings = scrape_ebay_motors("honda accord")
    for i, listing in enumerate(listings, 1):
        print(f"{i}. {listing['title']} | {listing['price']} | {listing['mileage']} miles | {listing['location']} | {listing['url']}") 