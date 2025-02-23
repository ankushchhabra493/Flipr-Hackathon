import scrapy

class NewsSpider(scrapy.Spider):
    name = "news_spider"
    start_urls = [
        'https://www.bbc.com/news',  # Replace with the actual news website URL
    ]

    custom_settings = {
        "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "DOWNLOAD_DELAY": 2,
    }

    def parse(self, response):
        self.logger.info("Fetched page with length: %d", len(response.text))
        articles = response.css('div.gs-c-promo')
        self.logger.info("Number of articles found with 'div.gs-c-promo': %d", len(articles))
        if not articles:
            articles = response.css('article')
            self.logger.info("Number of articles found with 'article': %d", len(articles))
        if not articles:
            self.logger.warning("No article elements found. The page structure might have changed.")
        for article in articles:
            title = article.css('h3.gs-c-promo-heading__title::text').get()
            summary = article.css('p.gs-c-promo-summary::text').get()
            link = article.css('a.gs-c-promo-heading::attr(href)').get()
            date = article.css('time::attr(datetime)').get()
            yield {
                'title': title.strip() if title else None,
                'summary': summary.strip() if summary else None,
                'link': response.urljoin(link) if link else None,
                'date': date,
            }