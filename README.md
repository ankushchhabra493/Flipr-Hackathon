# 📢 Flipr Hackathon 2025 - Autonomous AI Agent 📰

## Website Preview
<img width="1792" alt="Screenshot 2025-02-24 at 7 27 13 PM" src="https://github.com/user-attachments/assets/1ea9870e-8e20-4e80-8f41-36fb08e2ff13" />

## 🌐 Live Demo
**Frontend Deployed at:** [https://indian-news-summary.netlify.app/](https://indian-news-summary.netlify.app/)  
**Backend API Deployed at:** [https://flipr-hackathon-4.onrender.com](https://indian-news-summary.onrender.com)  

---
## 📌 Problem Statement
Develop an **autonomous AI agent** capable of searching, summarizing, and publishing content on **general news topics** like current events, crime, sports, politics, etc. The AI agent should:
1. **Search and classify** news articles into broader and sub-topics at **global and local** levels.
2. **Summarize** extracted articles into **concise, structured summaries** while ensuring factual accuracy.
3. **Optimize** content for **SEO (Search Engine Optimization)** to enhance discoverability.
4. **Publish** the generated articles **autonomously** on a blog/website.

### **Expected Features**
✔ **Automated Web Crawling & Data Extraction** – Fetch news articles from reliable sources.
✔ **Summarization & Content Generation** – Process articles into well-structured summaries.
✔ **SEO Optimization** – Enhance search rankings with keywords & metadata.
✔ **Automated Publishing** – Post content **without manual intervention**.

### **Bonus Features (Extra Points!)**
⭐ **Use of Open-Source LLMs** – Extra credit for self-hosted models instead of proprietary APIs.  
⭐ **Image Generation** – AI-generated **infographics & visuals** for blog posts.  
⭐ **Multilingual Support** – Translate articles into **multiple languages** like Hindi & English.  
⭐ **User Engagement Metrics** – Track views, shares, and search rankings.  

---
## 📌 Project Description
This project is a **news aggregator** that **searches, summarizes, and publishes news autonomously**. Users can select an **Indian state** from a dropdown menu to view local news, or explore the **Global News** section. It is built with **ReactJS (frontend)** and **Node.js/Express.js (backend)** and utilizes **LLMs** for AI-based summarization.

---
## 📁 Directory Structure
```
Flipr-Hackathon/
│── news-aggregator/   # Backend (Node.js + Express)
│   │── news_crawler/  # Scraper for fetching news
│   │── server.js      # Main backend server
│   │── package.json   # Dependencies
│   │── package-lock.json
│   └── .ipynb_checkpoints/
│
│── public/            # Frontend public assets
│   └── index.html
│
│── src/               # Frontend (React.js)
│   │── components/ui  # UI components
│   │── App.js         # Main React app
│   │── index.js       # Entry point for React
│   │── App.css
│   └── .gitignore
│
│── package.json       # Frontend dependencies
│── package-lock.json
│── scrape.py          # Python script (if needed for scraping)
└── README.md          # Documentation
```

---
## 🛠️ Installation & Setup
### **1️⃣ Clone the repository**
```bash
git clone https://github.com/ankushchhabra493/Flipr-Hackathon.git
cd Flipr-Hackathon
```
### **2️⃣ Install Dependencies**
Run the following to install dependencies inside both, the Flipr-Hackathon directory and `news-aggregator`:
```bash
npm install
cd news-aggregator && npm install  # Install backend dependencies
```
### **3️⃣ Start the Backend (Server)**
Navigate inside `news-aggregator` and start the backend:
```bash
cd news-aggregator
node server.js
```
The backend will now be running at **http://localhost:5001**.

### **4️⃣ Start the Frontend**
Back in the main project directory, start the frontend:
```bash
npm start
```
The frontend will now be accessible at **http://localhost:3000**.

### **5️⃣ Ensure the Frontend is Connected to the Backend**
Edit `App.jsx` to make sure it points to the correct backend URL:
```javascript
const BACKEND_URL = "http://localhost:5001"; // Use this for local testing
// const BACKEND_URL = "https://flipr-hackathon-4.onrender.com"; // Use this for production
```
Then restart the frontend if needed.

---
## 🚀 Deployment
### **Backend Deployment (Render)**
1. Push backend updates to GitHub:
   ```bash
   git add .
   git commit -m "Updated backend"
   git push origin main
   ```
2. Go to [Render](https://dashboard.render.com/) and select **New Web Service**.
3. Connect your GitHub repo and set:
   - **Runtime:** Node.js
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Click **Deploy** and wait for completion.

### **Frontend Deployment (Netlify)**
1. Push frontend updates to GitHub:
   ```bash
   git add .
   git commit -m "Updated frontend"
   git push origin main
   ```
2. Go to [Netlify](https://app.netlify.com/) and select **New Site from Git**.
3. Connect your GitHub repo and set:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `build`
4. Click **Deploy**.

✅ Your website will now be live at **https://indian-news-summary.netlify.app/**.

---
## 📄 API Endpoints
| Endpoint               | Method | Description |
|----------------------|--------|------------|
| `/fetch-global-news` | POST   | Fetches global news |
| `/fetch-news`        | POST   | Fetches news by search query |
| `/summarize-news`    | POST   | Summarizes fetched news |

---
## 📌 Technologies Used
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **APIs:** NewsAPI, Gemini AI, Axios for HTTP requests
- **Hosting:** Render (Backend), Netlify (Frontend)

---
## 🙌 Contributors
- **Ankush Chhabra** - [GitHub](https://github.com/ankushchhabra493)
- **Isha Kumar** - [GitHub](https://github.com/Isha-pixel)
- **Rishabh Chaturvedi** - [GitHub](https://github.com/rishabh-iith)
- **Syed Imam Ali** - [GitHub](https://github.com/syed-imam-ali-99)

---
## 📢 How to Test the Website
If you want to test the deployed website:
1. **Visit the live site:** [https://indian-news-summary.netlify.app/](https://indian-news-summary.netlify.app/)
2. **Select a state** from the dropdown menu to view local news.
3. **Explore the Global News section** for worldwide updates.
4. Click **Read More** to check full news articles.
5. The website will fetch news summaries using **AI summarization** 🎯

---
💡 **Found an issue?** Feel free to create a GitHub **Issue** or contribute! ✨
