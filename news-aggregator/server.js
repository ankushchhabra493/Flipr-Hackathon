const express = require('express');
const cors = require('cors');
const NewsAPI = require('newsapi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// Initialize APIs
const newsapi = new NewsAPI('ab8df099af1a4b90aec7e1fd523a2319');
const genAI = new GoogleGenerativeAI('AIzaSyC6TiENdoJXQr7pf9FQPRk5GUG1nLDy9A4');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

// Enhanced translation function with better prompt
async function translateQuery(query) {
  try {
    const prompt = `Transform the search query "${query}" into a specific news search query. 
    Focus on current events and local context. 
    If the query is about:
    - Sports: Include specific sport names, tournaments, or teams
    - Politics: Include specific politician names or political events
    - Culture: Include specific festival names or cultural events
    - Local news: Include specific city or region names
    
    Return only the transformed query without any explanation.`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return responseText.trim();
  } catch (error) {
    console.error('Gemini Translation Error:', error);
    return `${query} latest news`;
  }
}

// Improved scraping function with better content extraction
async function scrapeNews(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Enhanced content selection
    const selectors = {
      title: ['h1', 'h2', '.article-title', '.entry-title', 'title'],
      content: [
        'article', 
        '.article-content',
        '.entry-content',
        'main',
        '[itemprop="articleBody"]',
        '.story-content'
      ]
    };

    let title = '';
    let content = '';

    // Try each title selector until we find content
    for (const selector of selectors.title) {
      title = $(selector).first().text().trim();
      if (title) break;
    }

    // Try each content selector until we find content
    for (const selector of selectors.content) {
      content = $(selector).text().trim();
      if (content) break;
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .substring(0, 2000);

    return { title, content, url };
  } catch (error) {
    console.error('Scraping Error:', url, error);
    return null;
  }
}

// Enhanced summarization function with better categorization
async function summarizeNews(news) {
  if (!news || !news.content) return null;

  try {
    const prompt = `Analyze and summarize this news article:
    Title: ${news.title}
    Content: ${news.content}

    Create a JSON response with:
    1. A category title that reflects the local context:
       - For sports news: use sport name (e.g., "Cricket", "Football")
       - For political news: use leader or party name
       - For local news: use city or region name
       - For cultural news: use festival or event name
    2. A concise summary under 100 words
    3. Keywords (up to 3) that best represent the article

    Format:
    {
      "categoryTitle": "Local context-based title",
      "summary": "Concise summary",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);

    return {
      ...news,
      title: parsedResponse.categoryTitle,
      summary: parsedResponse.summary,
      keywords: parsedResponse.keywords
    };
  } catch (error) {
    console.error('Gemini Summarization Error:', error);
    return null;
  }
}

// Enhanced default news fetching
async function fetchDefaultNews() {
  try {
    const response = await newsapi.v2.topHeadlines({
      language: 'en',
      country: 'us', // Can be configured based on user's location
      pageSize: 10
    });

    if (response.status === 'ok') {
      const articles = await Promise.all(
        response.articles.map(async article => {
          // Categorize default news as well
          const summarized = await summarizeNews({
            title: article.title,
            content: article.description + ' ' + article.content,
            url: article.url
          });

          return summarized || {
            title: 'General News',
            summary: article.description,
            url: article.url,
            keywords: []
          };
        })
      );

      // Group by category
      const groupedArticles = articles.reduce((acc, article) => {
        const category = article.title || 'General News';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(article);
        return acc;
      }, {});

      return groupedArticles;
    }
    return {};
  } catch (error) {
    console.error('News API Error:', error);
    return {};
  }
}

// Main endpoint
app.post('/fetch-news', async (req, res) => {
  const { query } = req.body;

  try {
    if (!query || query.toLowerCase() === 'world') {
      const defaultNews = await fetchDefaultNews();
      res.json(defaultNews);
      return;
    }

    const translatedQuery = await translateQuery(query);
    const searchResults = await googleSearch(translatedQuery);
    
    // Process articles in parallel with a limit
    const processedNews = await Promise.all(
      searchResults.slice(0, 10).map(async url => {
        const scraped = await scrapeNews(url);
        if (scraped) {
          return await summarizeNews(scraped);
        }
        return null;
      })
    );

    // Group by category title
    const organizedNews = processedNews
      .filter(news => news !== null)
      .reduce((acc, news) => {
        if (!acc[news.title]) {
          acc[news.title] = [];
        }
        acc[news.title].push(news);
        return acc;
      }, {});

    res.json(organizedNews);
  } catch (error) {
    console.error('Main Error:', error);
    res.status(500).json({ error: 'Failed to fetch and summarize news' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});