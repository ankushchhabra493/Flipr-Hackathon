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
const newsapi = new NewsAPI('ab8df099af1a4b90aec7e1fd523a2319'); // Replace with your News API key
const genAI = new GoogleGenerativeAI('AIzaSyC6TiENdoJXQr7pf9FQPRk5GUG1nLDy9A4'); // Replace with your Gemini API key
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' }); // Choose the model

// Function to translate query using Gemini API
async function translateQuery(query) {
  try {
    const prompt = `Translate the following search query to be more specific for news search: "${query}". The translated query should focus on current events and local news.`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return responseText.trim();
  } catch (error) {
    console.error('Gemini Translation Error:', error);
    return query + ' news'; // Fallback query
  }
}

// Function to perform Google search
async function googleSearch(query) {
  const apiKey = '07073e7622410c235d71d3a1d36f9fd245d389c0be37048d07a3f39f5a4639b1'; // Replace with your SerpAPI API key
  const encodedQuery = encodeURIComponent(query);
  const url = `https://serpapi.com/search?q=${encodedQuery}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.organic_results) {
      return data.organic_results.map(result => result.link);
    } else {
      console.warn('No organic results found.');
      return [];
    }
  } catch (error) {
    console.error('Google Search Error:', error);
    return [];
  }
}

// Function to scrape news from a website
async function scrapeNews(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Adjust these selectors based on the website structure
    let title = $('h1').text() || $('h2').text() || $('title').text();
    let content = $('article').text() || $('div.content').text() || $('body').text();

    // Clean up content
    title = title.trim();
    content = content.substring(0, 1000).trim(); // Limit content for summarization

    return { title, content, url };
  } catch (error) {
    console.error('Scraping Error:', url, error);
    return null;
  }
}

// Function to summarize news using Gemini API and determine the title
async function summarizeNews(news) {
  if (!news || !news.content) return null;

  try {
    const prompt = `Summarize the following news article in under 100 words and suggest a title that reflects the local topic or category of the news (e.g., city name, sport, leader name, festival):\nTitle: ${news.title}\nContent: ${news.content}\n\nOutput format: {"title": "Suggested Title", "summary": "Summarized News"}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsedResponse = JSON.parse(responseText);
      return { ...news, title: parsedResponse.title, summary: parsedResponse.summary };
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return { ...news, title: 'Local News', summary: responseText }; // Fallback
    }
  } catch (error) {
    console.error('Gemini Summarization Error:', error);
    return null;
  }
}

// Function to fetch initial news from News API
async function fetchInitialNews(query) {
  try {
    const response = await newsapi.v2.everything({
      q: query,
      language: 'en',
      sortBy: 'relevancy',
      pageSize: 10, // Number of articles to fetch
    });

    console.log('News API Response:', response); // Add this line

    if (response.status === 'ok') {
      const articles = response.articles.map(article => ({
        title: article.title,
        summary: article.description,
        url: article.url,
      }));

      return {
        [query]: articles,
      };
    } else {
      console.error('News API Error:', response.message);
      return {};
    }
  } catch (error) {
    console.error('❌ News API Error:', error);
    return {};
  }
}

// Main endpoint to fetch and summarize news
app.post('/fetch-news', async (req, res) => {
  const { query } = req.body;

  try {
    if (query === 'world') {
      // Fetch initial news from News API
      const initialNews = await fetchInitialNews(query);
      res.json(initialNews);
    } else {
      // 1. Translate the query
      const translatedQuery = await translateQuery(query);
      console.log('Translated Query:', translatedQuery);

      // 2. Perform Google search
      const searchResults = await googleSearch(translatedQuery);
      console.log('Search Results:', searchResults);

      // 3. Scrape news from websites
      const scrapedNews = await Promise.all(searchResults.map(scrapeNews)); // Remove the slice(0, 5)
      const validNews = scrapedNews.filter(news => news !== null);
      console.log('Scraped News:', validNews);

      // 4. Summarize news using Gemini API
      const summarizedNews = await Promise.all(validNews.map(summarizeNews));
      const validSummarizedNews = summarizedNews.filter(news => news !== null);
      console.log('Summarized News:', validSummarizedNews);

      // 5. Organize news by local topic
      const organizedNews = {};
      validSummarizedNews.forEach(news => {
        if (!organizedNews[news.title]) {
          organizedNews[news.title] = [];
        }
        organizedNews[news.title].push(news);
      });

      res.json(organizedNews);
    }
  } catch (error) {
    console.error('❌ Main Error:', error);
    res.status(500).json({ error: 'Failed to fetch and summarize news' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});