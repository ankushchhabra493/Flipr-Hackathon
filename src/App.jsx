import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import "./App.css";

function App() {
  const [query, setQuery] = useState('');
  const [news, setNews] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDefaultNews, setIsDefaultNews] = useState(true);
  const [articles, setArticles] = useState([]); // State for articles from News API

  const apiKey = "ab8df099af1a4b90aec7e1fd523a2319"; // Replace with your actual NewsAPI key

  const fetchArticles = async (searchQuery = "") => {
    setLoading(true);
    setError("");
    setIsDefaultNews(!searchQuery); // Set isDefaultNews based on whether there's a search query

    try {
      const timestamp = new Date().getTime(); // Add a timestamp to prevent caching
      const url = searchQuery
        ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&apiKey=${apiKey}&_=${timestamp}`
        : `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}&_=${timestamp}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched articles:", data.articles);
      setArticles(data.articles); // Store articles in the articles state
      setError("");
    } catch (error) {
      console.error("❌ Fetch Error:", error.message);
      setArticles([]);
      setError(error.message || "Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(); // Fetch initial news on component mount
  }, []);

  const handleSearch = () => {
    fetchArticles(query); // Fetch news based on search query
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

      {articles.length > 0 ? (
        articles.map((article) => (
          <Card key={article.url} className="p-4 shadow-lg">
            <CardContent>
              <h2 className="text-xl font-semibold">{article.title}</h2>
              <p className="text-gray-600 mt-2">{article.description}</p>
              <p className="text-sm text-gray-500 mt-2">Published at: {new Date(article.publishedAt).toLocaleString()}</p>
              <Button
                className="mt-4"
                onClick={() => window.open(article.url, "_blank")}
              >
                Read More
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center">No news available.</p>
      )}
    </div>
  );
};

export default App;