# WebMovies

A full-stack personal movie and web series streaming platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![TMDb](https://img.shields.io/badge/TMDb-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)

>  Stream movies and web series from your own platform, powered by TMDb and hosted on the cloud.

**Live Demo:** Coming Soon

---

## Features

- Movie and Web Series Streaming with a custom-built HTML5 video player
- Auto Metadata Fetching: Posters, descriptions, ratings, and episodes auto-fetched from TMDb
- Hero Banner Slider: Full-screen homepage banner with hover trailer previews
- Coming Soon Section: Showcase upcoming movies and series with hover video previews
- Secure Admin Panel: Token-protected admin dashboard to manage the entire catalog
- Catalog Management: Add, edit, or delete movies, series, and banners from one place
- Multi-Server Support: Internet Archive, Streamtape, StreamWish, or any direct MP4 URL
- Fully Responsive: Works on desktop, tablet, and mobile
- Dark UI: Netflix-inspired dark theme with smooth animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js built-in http module |
| Database | JSON flat-file data/catalog.json |
| Auth | JWT plus bcryptjs |
| Metadata | TMDb API |
| Video Hosting | Internet Archive / Streamtape / StreamWish |

---

## Getting Started

Prerequisites: Node.js v18 or higher and a free TMDb API key from themoviedb.org

Installation steps:
1. git clone https://github.com/YOUR_USERNAME/WebMovies-App.git
2. cd WebMovies-App
3. npm install
4. copy .env.example to .env and fill in your credentials
5. npm start

Open your browser and go to http://localhost:3000

---

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Port the server runs on default 3000 |
| TMDB_BEARER_TOKEN | TMDb Read Access Token from themoviedb.org |
| ADMIN_TOKEN | Your secret admin password for the admin panel |

Never commit your .env file to GitHub. It is already in .gitignore

---

## Project Structure

WebMovies-App/
  server.js        - Node.js backend server
  app.js           - Frontend app logic
  index.html       - Homepage
  admin.html       - Admin dashboard
  series.html      - Series detail page
  style.css        - Main styles
  admin.css        - Admin panel styles
  auth.js          - JWT authentication
  data/catalog.json - Movie/series catalog database
  assets/posters/  - Local poster images
  assets/clips/    - Preview video clips
  .env.example     - Environment variables template

---

## How to Add Movies

1. Open http://localhost:3000/admin.html
2. Log in with your ADMIN_TOKEN
3. Go to Movies and Series and fill in the title
4. Metadata such as poster, description, and rating is auto-fetched from TMDb
5. Select Direct licensed URL and paste your video link from Internet Archive
6. Click Fetch details and add to catalog

---

## Video Hosting Free Options

| Platform | Storage | Ads | Direct Link |
|---|---|---|---|
| Internet Archive | Unlimited | None | Yes |
| Streamtape | Unlimited | Some | Yes |
| StreamWish | Unlimited | Some | Yes |

Tip: Upload videos as .mp4 not .mkv to Internet Archive for full 1080p HD quality

---

## Deployment

Deploy for free on Render.com

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set Build Command to npm install
5. Set Start Command to node server.js
6. Add your environment variables in Render dashboard
7. Deploy!

---

## License

This project is for personal and educational use only.
All movie metadata is fetched from TMDb and is subject to their terms of use.

---

Made with love by Ritesh