import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import './App.css';

const App = () => {
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiKey = "12f36fbf62a74407b680f9cc322dfe06"; // Replace with your actual NewsAPI key

  const fetchArticles = async (query = "") => {
    setLoading(true);
    setError("");

    try {
      const timestamp = new Date().getTime(); // Add a timestamp to prevent caching
      const url = query
        ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}&_=${timestamp}`
        : `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}&_=${timestamp}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched articles:", data.articles);
      setNews(data.articles);
      setError("");
    } catch (error) {
      console.error("❌ Fetch Error:", error.message);
      setNews([]);
      setError(error.message || "Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const classifyArticles = (articles) => {
    const classified = {};

    articles.forEach(article => {
      const { title, description } = article;
      const content = `${title} ${description}`.toLowerCase();

      // Example classification based on location keywords
      if (content.includes("lucknow")) {
        if (!classified["Lucknow"]) classified["Lucknow"] = [];
        classified["Lucknow"].push(article);
      } else if (content.includes("uttar pradesh")) {
        if (!classified["Uttar Pradesh"]) classified["Uttar Pradesh"] = [];
        classified["Uttar Pradesh"].push(article);
      } else {
        if (!classified["Others"]) classified["Others"] = [];
        classified["Others"].push(article);
      }
    });

    return classified;
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        fetchArticles(search.trim());
      } else {
        fetchArticles();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const classifiedNews = classifyArticles(news);

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="text-3xl font-bold">Latest News</h1>
        <Input
          placeholder="Search for news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
        />
      </div>
      
      {loading && <p className="text-blue-500 text-center">Loading articles...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {Object.keys(classifiedNews).map((category) => (
        <div key={category}>
          <h2 className="text-2xl font-bold mt-4">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {classifiedNews[category].map((article) => (
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default App;