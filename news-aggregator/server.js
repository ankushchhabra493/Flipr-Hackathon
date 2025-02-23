const express = require('express');
const cors = require('cors');
const NewsAPI = require('newsapi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { scrapeNewsContent } = require('./news_crawler/scraper');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// Initialize APIs
const newsapi = new NewsAPI('ab8df099af1a4b90aec7e1fd523a2319');
const genAI = new GoogleGenerativeAI('AIzaSyA-aKbT-UsYnl5qGNDIs-ByvSRwaPAuWWA');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

async function summarizeNews(news, searchQuery) {
  if (!news || !news.content) return null;

  console.log('News to be summarized:', news.title);

  try {
    const prompt = `Analyze and summarize the following news article:
    Title: ${news.title}
    Content: ${news.content}
    Search Query: ${searchQuery}

    Task:
    1. Extract all cities mentioned in the news content
    2. Check if any of these cities belong to the state mentioned in the search query
    3. Only consider the article relevant if at least one mentioned city is within the specified state
    4. Use that city as the location in the response

    Rules:
    - If search query contains a state (e.g., "Punjab news"), only include articles about cities in that state
    - If no cities from the specified state are mentioned, set isRelevant to false
    - If no state is specified in the search query, set isRelevant to true and use the main city from the news
    - Only consider Indian cities and states

    Provide a JSON response in this exact format (no markdown, no code blocks):
    {
      "summary": "Summarized news content in under 100 words",
      "topic": "City - News Category",
      "location": "City",
      "isRelevant": true/false,
      "citiesFound": ["list of cities found in the article"]
    }`;

    const result = await model.generateContent(prompt);
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