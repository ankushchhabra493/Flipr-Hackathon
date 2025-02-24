const express = require('express');
const cors = require('cors');
const NewsAPI = require('newsapi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { scrapeNewsContent } = require('./news_crawler/scraper');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

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

// Helper function for NewsAPI fallback (if you need to fetch articles from NewsAPI in the future)
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
    const prompt = `Analyze and summarize the following news article:
    Title: ${news.title}
    Author: ${news.author}
    Content: ${news.content}
    Search Query: ${searchQuery}
    
    Task:
    1. Extract all cities mentioned in the news content.
    2. Check the news.author field for any city information.
    3. For each extracted city (from both content and author), verify whether it is actually located within the Indian state specified in the search query using accurate geographic data.
    4. Only consider the article relevant if at least one of these cities is verifiably located in the specified state.
    5. If the article is relevant, choose one of the matching cities as the location in your response.
    
    Rules:
    - If the search query contains a state (e.g., "Punjab news"), only include articles about cities in that state.
    - Do not misclassify cities. For example, do not consider Kolkata as part of Haryana or Delhi as part of Punjab.
    - If none of the extracted cities (including those from news.author) are actually located in the specified state, set "isRelevant" to false.
    - If no state is specified in the search query, set "isRelevant" to true and use the main city from the news.
    - Only consider Indian cities and states.
    
    Provide a JSON response in this exact format (no markdown, no code blocks):
    {
      "summary": "Summarized news content in under 100 words",
      "topic": "City - News Category",
      "location": "City",
      "isRelevant": true/false,
      "citiesFound": ["list of cities found in the article"]
    }`;    

    // Use the fallback function for Gemini
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
