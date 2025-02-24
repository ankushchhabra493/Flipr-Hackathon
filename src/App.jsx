import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import "./App.css";

// Array of API keys; the first one is your default key.
const apiKeys = [
  "12f36fbf62a74407b680f9cc322dfe06",
  "7f66387075b84241b99cf1c8679ecbab",
  "ab8df099af1a4b90aec7e1fd523a2319",
  "ae058c119aa647bfa0b27b5d872d98eb",
  "717702c6ceda43478a67caad44dcc89b"
];

// Start with a random API key from the array.
let currentApiIndex = Math.floor(Math.random() * apiKeys.length);

// Helper function to get the current API key.
const getApiKey = () => apiKeys[currentApiIndex];

function App() {
  const [query, setQuery] = useState('');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDefaultNews, setIsDefaultNews] = useState(true);

  const fetchArticles = async (searchQuery = "") => {
    setLoading(true);
    setError("");
    setIsDefaultNews(!searchQuery);

    try {
      const timestamp = new Date().getTime();
      let url;

      // Loop through available API keys until one works
      for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = getApiKey();
        if (searchQuery.trim() === '') {
          url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}&_=${timestamp}`;
        } else {
          url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&pageSize=20&apiKey=${apiKey}&_=${timestamp}`;
        }

        try {
          const response = await fetch(url);

          // Check if the response is OK; if not (e.g., rate limit reached), throw an error.
          if (!response.ok) {
            // Optionally, you could check for a specific status code:
            // if(response.status === 429) { ... }
            throw new Error(`API limit exceeded or HTTP Error ${response.status}`);
          }

          const data = await response.json();
          console.log("Fetched articles:", data.articles);

          if (searchQuery.trim() !== '') {
            const summarizedResponse = await fetch('http://localhost:5001/summarize-news', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                articles: data.articles.slice(0, 15),
                query: searchQuery 
              }),
            });

            if (!summarizedResponse.ok) {
              throw new Error(`HTTP Error ${summarizedResponse.status}`);
            }

            const summarizedData = await summarizedResponse.json();
            console.log("Summarized articles:", summarizedData);

            const cleanedData = summarizedData.map(article => {
              let summary = article.summary;
              let topic = article.topic;

              if (typeof summary === 'string' && summary.includes('```json')) {
                try {
                  const jsonStr = summary.replace(/```json|\s+```/g, '').trim();
                  const parsed = JSON.parse(jsonStr);
                  summary = parsed.summary;
                  topic = parsed.topic;
                } catch (e) {
                  console.error('Failed to parse JSON:', e);
                }
              }

              return {
                ...article,
                summary,
                topic
              };
            });

            setNews(cleanedData);
          } else {
            setNews(data.articles);
          }

          setError("");
          return; // Exit the loop on a successful fetch.
        } catch (apiError) {
          console.warn(`API Key ${apiKey} failed (${apiError.message}). Trying another API key...`);
          // Rotate to the next API key.
          currentApiIndex = (currentApiIndex + 1) % apiKeys.length;
        }
      }

      // If all API keys have been tried and failed, throw an error.
      throw new Error("All API keys have reached the limit or failed.");
    } catch (error) {
      console.error("❌ Fetch Error:", error.message);
      setNews([]);
      setError(error.message || "Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearch = () => {
    fetchArticles(query);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="text-3xl font-bold">Latest News</h1>
        <Input
          placeholder="Search for news..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-bar"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </Button>
        {error && <p className="text-red-500">{error}</p>}
      </div>

      {loading && <p className="text-blue-500 text-center">Loading articles...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {news.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {news.map((article) => (
            <Card key={article.url} className="p-4 shadow-lg">
              <CardContent>
                <h2 className="text-xl font-semibold">
                  {article.location}
                </h2>
                <h3 className="text-lg font-medium mt-3">
                  {article.title}
                </h3>
                <div className="mt-4">
                  <span className="font-semibold text-gray-700">Summary: </span>
                  <p className="text-gray-600 mt-1">
                    {query ? (
                      typeof article.summary === 'string' ? 
                        article.summary : 
                        article.description
                    ) : article.description}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Published at: {new Date(article.publishedAt).toLocaleString()}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => window.open(article.url, "_blank")}
                >
                  Read More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !query && <p className="text-center">No news available.</p>
      )}
    </div>
  );
}

export default App;
