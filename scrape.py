import requests
from bs4 import BeautifulSoup as bs
import json
import os

def scrape_website():
    URL = "https://shrenik2000.github.io/simple-webpage/"
    response = requests.get(URL)
    if response.status_code == 200:
        print("Successfully fetched webpage!")
    else:
        print("Failed to fetch the webpage. Status code:", response.status_code)
        return []

    soup = bs(response.content, 'html.parser')
    articles = []
    headers = soup.find_all(["h1", "h2"])
    for header in headers:
        article = {
            "title": header.get_text(strip=True),
            "summary": header.find_next("p").get_text(strip=True) if header.find_next("p") else ""
        }
        articles.append(article)
    return articles

def save_articles(articles):
    os.makedirs('./news_crawler', exist_ok=True)
    with open('./news_crawler/articles.json', 'w') as f:
        json.dump(articles, f, indent=4)

if __name__ == "__main__":
    articles = scrape_website()
    save_articles(articles)