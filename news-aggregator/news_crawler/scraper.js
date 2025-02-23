const cheerio = require('cheerio');

async function scrapeNewsContent(url) {
  try {
    console.log("Scraping URL:", url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const content = $('article').text().trim();
    
    if (!content) {
      console.log('No content found with article selector');
      // Fallback selectors for BBC news
      const fallbackContent = $('.article__body-content').text().trim() || 
                            $('.story-body').text().trim();
      return fallbackContent;
    }

    console.log('Scraped content:', content);
    return content;
  } catch (error) {
    console.error('Scraping Error:', url, error);
    return null;
  }
}

module.exports = { scrapeNewsContent };