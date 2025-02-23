const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 5001;

app.use(cors());

app.get('/api/articles', (req, res) => {
  fs.readFile('./news_crawler/articles.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading articles file:', err);
      res.status(500).send('Error reading articles file');
      return;
    }
    try {
      const articles = JSON.parse(data);
      res.json(articles);
    } catch (parseErr) {
      console.error('Error parsing articles file:', parseErr);
      res.status(500).send('Error parsing articles file');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});