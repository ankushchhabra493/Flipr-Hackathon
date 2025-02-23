import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import "./App.css";

function App() {
  const [query, setQuery] = useState('');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDefaultNews, setIsDefaultNews] = useState(true);

  const apiKey = "dc9ed16a5d6b455c923f5080fcc0fba4";

  const fetchArticles = async (searchQuery = "") => {
    setLoading(true);
    setError("");
    setIsDefaultNews(!searchQuery);

    try {
      const timestamp = new Date().getTime();
      let url;

      if (searchQuery.trim() === '') {
        url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}&_=${timestamp}`;
      } else {
        url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&pageSize=20&apiKey=${apiKey}&_=${timestamp}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
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