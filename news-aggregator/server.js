const express = require('express');
const cors = require('cors');
const NewsAPI = require('newsapi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio'); // Added for scraping functionality

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// --- Inline Scraping Function ---
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

// --- NewsAPI Fallback Setup ---
const newsApiKeys = [
  "12f36fbf62a74407b680f9cc322dfe06",
  "7f66387075b84241b99cf1c8679ecbab",
  "ab8df099af1a4b90aec7e1fd523a2319",
  "ae058c119aa647bfa0b27b5d872d98eb",
  "717702c6ceda43478a67caad44dcc89b"
];
let currentNewsApiIndex = Math.floor(Math.random() * newsApiKeys.length);
const getNewsApiKey = () => newsApiKeys[currentNewsApiIndex];

// Initialize NewsAPI with the current key.
let newsapi = new NewsAPI(getNewsApiKey());

// Helper function for NewsAPI fallback
async function fetchNewsWithFallback(url) {
  for (let i = 0; i < newsApiKeys.length; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI key ${getNewsApiKey()} failed with HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(error.message, "Trying another NewsAPI key...");
      currentNewsApiIndex = (currentNewsApiIndex + 1) % newsApiKeys.length;
      newsapi = new NewsAPI(getNewsApiKey());
    }
  }
  throw new Error("All NewsAPI keys failed.");
}

// --- Gemini Fallback Setup ---
const geminiKeys = [
  "AIzaSyBEnXL5Cqo-vXhQMSriRvt0HWsjHNUpS1c",
  "AIzaSyA-aKbT-UsYnl5qGNDIs-ByvSRwaPAuWWA",
  "AIzaSyAtSOw0T8S19ybibigUpBddFWHKhsbLlxM",
  "AIzaSyCY0VD7dGr4TE92gq62zAaXNDH8zr-UgSs"
];
let currentGeminiIndex = Math.floor(Math.random() * geminiKeys.length);
const getGeminiKey = () => geminiKeys[currentGeminiIndex];

// Initialize Gemini with the current key.
let genAI = new GoogleGenerativeAI(getGeminiKey());
let model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

// Helper function for Gemini fallback
async function generateContentWithFallback(prompt) {
  for (let i = 0; i < geminiKeys.length; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      console.warn(`Gemini key ${getGeminiKey()} failed: ${error.message}. Trying another key...`);
      currentGeminiIndex = (currentGeminiIndex + 1) % geminiKeys.length;
      genAI = new GoogleGenerativeAI(getGeminiKey());
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    }
  }
  throw new Error("All Gemini API keys failed.");
}

async function summarizeNews(news, searchQuery) {
  if (!news || !news.content) return null;

  console.log('News to be summarized:', news.title);

  try {
    const prompt = `Summarize the following Indian news article in under 100 words:
    Title: ${news.title}
    Author: ${news.author}
    Content: ${news.content}
    Search Query (State): ${searchQuery}

    Instructions:
    1. Confirm that the article is an Indian news piece.
    2. Extract any city names mentioned in the article (from both content and author) and filter them to include only cities located in India.
    3. From these, identify the cities that are within the state specified in the search query.
    4. If at least one valid city from the queried state is found, mark the article as relevant. Choose one of these cities as the "location" and list all valid cities in "citiesFound".
    5. If no valid city from the queried state is found, set "isRelevant" to false.
    6. Provide a concise summary and a topic in the format "City - News Category".
    7. Do not assign any city as the location if it is outside India.

    Output the result as JSON in exactly this format (no markdown, no code blocks):
    {
      "summary": "Summarized news content in under 100 words",
      "topic": "City - News Category",
      "location": "City",
      "isRelevant": true/false,
      "citiesFound": ["list of cities from the queried state"]
    }`;

    const result = await generateContentWithFallback(prompt);
    const responseText = result.response.text();

    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(cleanJson);
      
      if (parsedResponse.isRelevant) {
        console.log('News summarized successfully:', parsedResponse.summary);
        console.log('News topic identified:', parsedResponse.topic);
        console.log('Cities found:', parsedResponse.citiesFound);
        console.log('Selected location:', parsedResponse.location);
        
        return {
          ...news,
          summary: parsedResponse.summary,
          topic: parsedResponse.topic,
          location: parsedResponse.location,
          citiesFound: parsedResponse.citiesFound
        };
      }
      console.log('Article skipped: No relevant cities found for state:', searchQuery);
      return null;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('Raw response:', responseText);
      return null;
    }
  } catch (error) {
    console.error('Gemini Summarization Error:', error);
    return null;
  }
}

app.post('/summarize-news', async (req, res) => {
  const { articles, query } = req.body;
  console.log('Request Body:', { query, articleCount: articles.length });
  
  const targetCount = 5; // Target number of summarized articles
  let processedArticles = 0;
  let validSummarizedArticles = [];

  try {
    // Process articles in batches until we get enough valid summaries
    while (validSummarizedArticles.length < targetCount && processedArticles < articles.length) {
      const nextBatch = articles.slice(processedArticles, processedArticles + 3);
      processedArticles += nextBatch.length;

      console.log(`Processing batch of ${nextBatch.length} articles...`);

      const summarizedBatch = await Promise.all(
        nextBatch.map(async (article) => {
          const content = await scrapeNewsContent(article.url);
          if (content) {
            console.log('Scraped content for:', article.title);
            const summarizedArticle = await summarizeNews({ ...article, content }, query);
            return summarizedArticle;
          }
          return null;
        })
      );

      const validBatch = summarizedBatch.filter(article => article !== null);
      validSummarizedArticles = [...validSummarizedArticles, ...validBatch];

      console.log(`Got ${validSummarizedArticles.length} valid summaries out of ${targetCount} target`);
      
      if (processedArticles >= articles.length) {
        console.log('Processed all available articles');
        break;
      }
    }

    console.log(`Returning ${validSummarizedArticles.length} summarized articles`);
    res.json(validSummarizedArticles.slice(0, targetCount));
  } catch (error) {
    console.error('❌ Main Error:', error);
    res.status(500).json({ error: 'Failed to summarize news' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
