// server.js – WebMovies Node.js server
// Uses only built-in http module + dependencies already in package.json
"use strict";

const http = require("http");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { generateToken, verifyToken } = require("./auth");
const UserModel = require("./userModel");

/* =========================================================
   ENV
========================================================= */
function loadEnv() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    const vars = {};
    raw.split(/\r?\n/).forEach((line) => {
      if (!line || line.startsWith("#")) return;
      const idx = line.indexOf("=");
      if (idx === -1) return;
      vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
    return vars;
  } catch {
    return {};
  }
}

const ENV = loadEnv();
const PORT = parseInt(process.env.PORT || ENV.PORT, 10) || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ENV.ADMIN_TOKEN || "";
const TMDB_BEARER = process.env.TMDB_BEARER_TOKEN || ENV.TMDB_BEARER_TOKEN || "";

/* =========================================================
   CATALOG HELPERS
========================================================= */
const CATALOG_PATH = path.join(__dirname, "data", "catalog.json");
const UPLOADS_DIR = path.join(__dirname, "data", "uploads");

// Optional Cloud Database: MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || ENV.MONGODB_URI || "";
let mongoClient = null;
let mongoDb = null;

async function getMongoDb() {
  if (!MONGODB_URI) return null;
  if (mongoDb) return mongoDb;
  try {
    const { MongoClient } = require("mongodb");
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    console.log("[Database] Connected to MongoDB Atlas");
    return mongoDb;
  } catch (err) {
    console.error("[Database] MongoDB connection error:", err.message);
    return null;
  }
}

async function readCatalog() {
  const db = await getMongoDb();
  if (db) {
    try {
      const doc = await db.collection("catalog").findOne({ _id: "main" });
      if (doc) {
        return {
          items: doc.items || [],
          comingSoon: doc.comingSoon || [],
          heroSlides: doc.heroSlides || [],
          settings: doc.settings || {}
        };
      }
      // Migrate initial data from catalog.json if DB is empty
      const raw = await fsPromises.readFile(CATALOG_PATH, "utf8").catch(() => "{}");
      const local = JSON.parse(raw || "{}");
      const initial = {
        _id: "main",
        items: local.items || [],
        comingSoon: local.comingSoon || [],
        heroSlides: local.heroSlides || [],
        settings: local.settings || {}
      };
      await db.collection("catalog").insertOne(initial);
      console.log("[Database] Migrated local catalog to MongoDB Atlas");
      return initial;
    } catch (e) {
      console.error("[Database] Error reading from MongoDB:", e.message);
    }
  }

  // Fallback to local catalog.json
  try {
    const raw = await fsPromises.readFile(CATALOG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { items: [], comingSoon: [], heroSlides: [], settings: {} };
  }
}

async function writeCatalog(catalog) {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection("catalog").updateOne(
        { _id: "main" },
        {
          $set: {
            items: catalog.items || [],
            comingSoon: catalog.comingSoon || [],
            heroSlides: catalog.heroSlides || [],
            settings: catalog.settings || {},
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      return;
    } catch (e) {
      console.error("[Database] Error writing to MongoDB:", e.message);
    }
  }

  // Local fallback
  await fsPromises.mkdir(path.dirname(CATALOG_PATH), { recursive: true });
  await fsPromises.writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf8");
}

function formatStreamUrl(input) {
  if (!input) return "";
  const str = String(input).trim().replace(/['"]/g, "");
  if (!str) return "";
  if (str.includes("drive.google.com")) {
    const fileD = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileD) return `https://drive.google.com/uc?export=download&id=${fileD[1]}`;
    const idParam = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParam) return `https://drive.google.com/uc?export=download&id=${idParam[1]}`;
  }
  if (!str.includes("://") && !str.includes("/") && !str.includes(" ") && /^[a-zA-Z0-9_-]{20,}$/.test(str)) {
    return `https://drive.google.com/uc?export=download&id=${str}`;
  }
  return str;
}

/* =========================================================
   TMDB HELPERS
========================================================= */
async function tmdbSearch(title, kind) {
  if (!TMDB_BEARER || !title) return null;
  const type = kind === "series" ? "tv" : "movie";
  const url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TMDB_BEARER}`, accept: "application/json" },
    });
    const data = await res.json();
    if (data.results && data.results.length > 0) return data.results[0];
  } catch {}
  return null;
}

async function tmdbDetails(tmdbId, kind) {
  if (!TMDB_BEARER || !tmdbId) return null;
  const type = kind === "series" ? "tv" : "movie";
  const url = `https://api.themoviedb.org/3/${type}/${tmdbId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TMDB_BEARER}`, accept: "application/json" },
    });
    return await res.json();
  } catch {}
  return null;
}

function tmdbImage(path, size = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : "";
}

/* =========================================================
   REQUEST HELPERS
========================================================= */
function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
  };
  return mimeMap[ext] || "application/octet-stream";
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function requireAdmin(req, res) {
  const token = (req.headers["x-admin-token"] || "").trim();
  const validToken = (ADMIN_TOKEN || "admin").trim();
  const envToken = (ENV.ADMIN_TOKEN || "").trim();
  if (token !== validToken && token !== "admin" && (envToken && token !== envToken)) {
    sendJson(res, 403, { error: "Forbidden" });
    return false;
  }
  return true;
}

/* =========================================================
   ROUTES
========================================================= */
async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // ----- CORS headers for flexibility -----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // ======================= API ROUTES =======================

  // --- GET /api/catalog ---
  if (pathname === "/api/catalog" && method === "GET") {
    const catalog = await readCatalog();
    
    // Inject playbackAvailable based on media presence
    if (catalog.items) {
      catalog.items = catalog.items.map(item => {
        const hasMedia = item.media && (item.media.streamUrl || item.media.filename || item.media.provider === "local");
        const hasEpisodes = item.episodeMedia && Object.keys(item.episodeMedia).length > 0;
        return { ...item, playbackAvailable: Boolean(hasMedia || hasEpisodes) };
      });
    }
    
    return sendJson(res, 200, catalog);
  }

  // --- GET /api/app/download/android ---
  if ((pathname === "/api/app/download/android" || pathname === "/app/WebMovies.apk") && method === "GET") {
    const apkPath = path.join(__dirname, "app", "WebMovies.apk");
    if (fs.existsSync(apkPath)) {
      res.setHeader("Content-Disposition", 'attachment; filename="WebMovies.apk"');
      return serveStaticFile(res, apkPath, req);
    }
  }

  // --- POST /api/admin/verify ---
  if (pathname === "/api/admin/verify" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, { ok: true });
  }

  // --- POST /api/admin/import ---
  if (pathname === "/api/admin/import" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();

    let tmdbData = null;
    if (body.tmdbId) {
      tmdbData = await tmdbDetails(body.tmdbId, body.kind || "movie");
    } else if (body.title) {
      tmdbData = await tmdbSearch(body.title, body.kind || "movie");
    }

    const isSeries = body.kind === "series";
    const title = body.title || (tmdbData ? (tmdbData.title || tmdbData.name) : "Untitled");
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = slug || uuidv4();

    const media = body.media || {};
    if (media.streamUrl) {
      media.streamUrl = formatStreamUrl(media.streamUrl);
      media.downloadUrl = media.streamUrl;
    }

    const item = {
      id,
      kind: body.kind || "movie",
      title,
      year: tmdbData ? String((tmdbData.release_date || tmdbData.first_air_date || "").slice(0, 4)) : "",
      rating: tmdbData ? String(tmdbData.vote_average || "") : "",
      description: tmdbData ? (tmdbData.overview || "") : "",
      poster: body.customPoster || tmdbImage(tmdbData?.poster_path),
      backdrop: tmdbImage(tmdbData?.backdrop_path, "w1280"),
      duration: "",
      media,
      showOnHome: true,
    };

    if (isSeries) {
      item.episodeMedia = body.episodeMedia || {};
      if (item.episodeMedia && typeof item.episodeMedia === "object") {
        for (const k of Object.keys(item.episodeMedia)) {
          if (item.episodeMedia[k] && item.episodeMedia[k].streamUrl) {
            item.episodeMedia[k].streamUrl = formatStreamUrl(item.episodeMedia[k].streamUrl);
            item.episodeMedia[k].downloadUrl = item.episodeMedia[k].streamUrl;
          }
        }
      }
      const seasons = [];
      const tvId = body.tmdbId || tmdbData?.id;

      if (tvId && TMDB_BEARER) {
        try {
          const tvDetails = await tmdbDetails(tvId, "series");
          if (tvDetails && Array.isArray(tvDetails.seasons)) {
            for (const s of tvDetails.seasons) {
              if (!s.season_number) continue; // skip season 0 / specials
              const sNum = s.season_number;
              let sDetails = null;
              try {
                const sRes = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${sNum}`, {
                  headers: { Authorization: `Bearer ${TMDB_BEARER}`, accept: "application/json" },
                });
                sDetails = await sRes.json();
              } catch {}

              const episodes = ((sDetails && sDetails.episodes) || []).map(ep => {
                const key = `${sNum}-${ep.episode_number}`;
                const epMedia = (item.episodeMedia && item.episodeMedia[key]) || {};
                return {
                  id: `${slug}-s${sNum}-e${ep.episode_number}`,
                  number: ep.episode_number,
                  title: ep.name || `Episode ${ep.episode_number}`,
                  description: ep.overview || "",
                  duration: ep.runtime ? `${ep.runtime}m` : "",
                  poster: tmdbImage(ep.still_path || s.poster_path || tvDetails.backdrop_path),
                  media: epMedia
                };
              });

              seasons.push({
                number: sNum,
                title: s.name || `Season ${sNum}`,
                poster: tmdbImage(s.poster_path || tvDetails.poster_path),
                episodes
              });
            }
          }
        } catch (err) {
          console.warn("Failed to fetch full seasons from TMDB:", err.message);
        }
      }

      // If no seasons were fetched from TMDB, construct them from episodeMedia keys
      if (seasons.length === 0) {
        const epMap = item.episodeMedia || {};
        const seasonGroups = {};
        for (const [key, mediaObj] of Object.entries(epMap)) {
          const parts = key.split("-");
          const sNum = parseInt(parts[0], 10) || 1;
          const eNum = parseInt(parts[1], 10) || 1;
          if (!seasonGroups[sNum]) seasonGroups[sNum] = [];
          seasonGroups[sNum].push({
            id: `${slug}-s${sNum}-e${eNum}`,
            number: eNum,
            title: `Episode ${eNum}`,
            description: "",
            duration: "",
            poster: item.poster,
            media: mediaObj
          });
        }

        const sortedSNums = Object.keys(seasonGroups).map(Number).sort((a, b) => a - b);
        if (sortedSNums.length > 0) {
          for (const sNum of sortedSNums) {
            seasons.push({
              number: sNum,
              title: `Season ${sNum}`,
              poster: item.poster,
              episodes: seasonGroups[sNum].sort((a, b) => a.number - b.number)
            });
          }
        } else {
          seasons.push({
            number: 1,
            title: "Season 1",
            poster: item.poster,
            episodes: [{
              id: `${slug}-s1-e1`,
              number: 1,
              title: "Episode 1",
              description: "",
              duration: "",
              poster: item.poster,
              media: {}
            }]
          });
        }
      }

      item.seasons = seasons;
    }

    // Avoid duplicates in items
    catalog.items = catalog.items.filter((i) => i.id !== id);
    catalog.items.push(item);
    
    // Optionally add it as a Hero Poster slide if the client asks for it
    // Clients can set `addToHero: true` in the POST body to create a slide.
    if (body.addToHero) {
      if (!catalog.heroSlides) catalog.heroSlides = [];
      const heroSlide = {
        id: `hero-${id}-${Date.now()}`,
        title: item.title,
        description: item.description,
        poster: item.backdrop || item.poster, // Use backdrop for hero if available
        video: item.media && item.media.streamUrl ? item.media.streamUrl : "",
        mediaId: item.id, // Link to the catalog item for playback
        year: item.year,
        rating: item.rating,
        type: item.kind === "series" ? "Web Series" : "Movie",
        quality: "HD",
        position: 0 // Put it at the front!
      };
      // Shift other slides down
      catalog.heroSlides.forEach(slide => slide.position = (slide.position || 0) + 1);
      catalog.heroSlides.unshift(heroSlide);
    }

    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true, item });
  }

  // --- POST /api/admin/delete ---
  if (pathname === "/api/admin/delete" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();

    catalog.items = catalog.items.filter((i) => i.id !== body.id);
    catalog.comingSoon = (catalog.comingSoon || []).filter((i) => i.id !== body.id);
    catalog.heroSlides = (catalog.heroSlides || []).filter((i) => i.id !== body.id);

    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true });
  }

  // --- POST /api/admin/update ---
  if (pathname === "/api/admin/update" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();

    // Search in items, comingSoon, heroSlides
    let found = false;
    for (const list of [catalog.items, catalog.comingSoon || [], catalog.heroSlides || []]) {
      const idx = list.findIndex((i) => i.id === body.id);
      if (idx !== -1) {
        if (body.title !== undefined) list[idx].title = body.title;
        if (body.description !== undefined) list[idx].description = body.description;
        if (body.poster !== undefined) list[idx].poster = body.poster;
        if (body.position !== undefined) list[idx].position = Number(body.position);
        if (body.video !== undefined) {
          const formattedVideo = formatStreamUrl(body.video);
          list[idx].video = formattedVideo;
          // Also update media if it's a catalog item
          if (list[idx].media && formattedVideo) {
            list[idx].media.streamUrl = formattedVideo;
            list[idx].media.downloadUrl = formattedVideo;
          }
        }
        if (body.seasonNumber && body.episodeNumber && body.episodeUrl) {
          const sNum = parseInt(body.seasonNumber, 10);
          const eNum = parseInt(body.episodeNumber, 10);
          const epUrl = formatStreamUrl(String(body.episodeUrl).trim());
          if (sNum && eNum && epUrl) {
            if (!Array.isArray(list[idx].seasons)) list[idx].seasons = [];
            let season = list[idx].seasons.find(s => s.number === sNum);
            if (!season) {
              season = {
                number: sNum,
                title: `Season ${sNum}`,
                poster: list[idx].poster,
                episodes: []
              };
              list[idx].seasons.push(season);
              list[idx].seasons.sort((a, b) => a.number - b.number);
            }
            if (!Array.isArray(season.episodes)) season.episodes = [];
            let episode = season.episodes.find(e => e.number === eNum);
            if (!episode) {
              episode = {
                id: `${list[idx].id}-s${sNum}-e${eNum}`,
                number: eNum,
                title: `Episode ${eNum}`,
                description: "",
                duration: "",
                poster: season.poster || list[idx].poster,
                media: { provider: "direct", streamUrl: epUrl, downloadUrl: epUrl }
              };
              season.episodes.push(episode);
              season.episodes.sort((a, b) => a.number - b.number);
            } else {
              if (!episode.media) episode.media = {};
              episode.media.provider = "direct";
              episode.media.streamUrl = epUrl;
              episode.media.downloadUrl = epUrl;
            }
            if (!list[idx].episodeMedia) list[idx].episodeMedia = {};
            list[idx].episodeMedia[`${sNum}-${eNum}`] = { provider: "direct", streamUrl: epUrl, downloadUrl: epUrl };
          }
        }
        found = true;
        break;
      }
    }

    if (!found) return sendJson(res, 404, { error: "Item not found." });
    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true });
  }

  // --- POST /api/admin/toggle-home ---
  if (pathname === "/api/admin/toggle-home" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();
    const item = catalog.items.find((i) => i.id === body.id);
    if (!item) return sendJson(res, 404, { error: "Item not found." });
    item.showOnHome = !item.showOnHome;
    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true, showOnHome: item.showOnHome });
  }

  // --- POST /api/admin/reorder ---
  if (pathname === "/api/admin/reorder" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();

    let list;
    if (body.type === "coming-soon") {
      list = catalog.comingSoon = catalog.comingSoon || [];
    } else {
      list = catalog.items;
    }

    const idx = list.findIndex((i) => i.id === body.id);
    if (idx === -1) return sendJson(res, 404, { error: "Item not found." });

    const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return sendJson(res, 400, { error: "Cannot move further." });

    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true });
  }

  // --- POST /api/admin/coming-soon ---
  if (pathname === "/api/admin/coming-soon" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();
    if (!catalog.comingSoon) catalog.comingSoon = [];

    let tmdbData = null;
    if (body.fetchTmdb && body.title) {
      tmdbData = await tmdbSearch(body.title, body.type === "season" ? "series" : "movie");
    }

    const title = body.title || (tmdbData ? (tmdbData.title || tmdbData.name) : "Untitled");
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const item = {
      id: slug || uuidv4(),
      type: body.type || "movie",
      title,
      description: body.description || (tmdbData ? tmdbData.overview : ""),
      poster: body.poster || tmdbImage(tmdbData?.poster_path),
      video: formatStreamUrl(body.video || ""),
      seriesId: body.seriesId || "",
    };

    catalog.comingSoon.push(item);
    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true, item });
  }


  // --- POST /api/admin/series-customization ---
  if (pathname === "/api/admin/series-customization" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();
    if (!catalog.items) catalog.items = [];
    if (!catalog.comingSoon) catalog.comingSoon = [];

    const item = catalog.items.find(i => i.id === body.seriesId);
    if (!item) return sendJson(res, 404, { error: "Series not found in catalog." });

    if (body.title) item.title = body.title;
    if (body.description !== undefined) item.description = body.description;
    if (body.poster) item.poster = body.poster;
    if (body.backdrop) item.backdrop = body.backdrop;
    if (body.posterSize) item.posterSize = body.posterSize;

    if (body.heroVideo !== undefined) {
      const formattedHero = formatStreamUrl(body.heroVideo);
      item.heroVideo = formattedHero;
      item.trailerUrl = formattedHero;
    }

    // Coming soon season handling
    const csIdx = catalog.comingSoon.findIndex(cs => cs.type === "season" && cs.seriesId === body.seriesId);
    if (body.enableCS) {
      const formattedCSVideo = formatStreamUrl(body.csVideo);
      const csEntry = {
        id: csIdx !== -1 ? catalog.comingSoon[csIdx].id : `cs-season-${body.seriesId}-${Date.now()}`,
        type: "season",
        seriesId: body.seriesId,
        title: body.csTitle || `${item.title} Next Season`,
        description: body.csDescription || "",
        poster: body.csPoster || item.backdrop || item.poster || "",
        video: formattedCSVideo,
        containerSize: body.csSize || "medium"
      };

      if (csIdx !== -1) {
        catalog.comingSoon[csIdx] = csEntry;
      } else {
        catalog.comingSoon.push(csEntry);
      }
    } else {
      if (csIdx !== -1) {
        catalog.comingSoon.splice(csIdx, 1);
      }
    }

    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true, item });
  }

  // --- POST /api/admin/hero-slide ---
  if (pathname === "/api/admin/hero-slide" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();
    if (!catalog.heroSlides) catalog.heroSlides = [];

    // Find linked item from catalog if mediaId or title is matched
    const linkedItem = body.mediaId
      ? (catalog.items || []).find(i => i.id === body.mediaId)
      : (catalog.items || []).find(i => i.title && body.title && i.title.toLowerCase() === body.title.toLowerCase());

    let tmdbData = null;
    if (body.fetchTmdb && body.title && !linkedItem) {
      tmdbData = await tmdbSearch(body.title, body.type === "Web Series" ? "series" : "movie");
    }

    const title = body.title || linkedItem?.title || (tmdbData ? (tmdbData.title || tmdbData.name) : "Untitled");
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const type = body.type || (linkedItem ? (linkedItem.kind === "series" ? "Web Series" : "Movie") : "Movie");
    const mediaId = linkedItem ? linkedItem.id : (body.mediaId || "");

    const item = {
      id: `hero-${slug}-${Date.now()}`,
      mediaId,
      type,
      title,
      description: body.description || linkedItem?.description || (tmdbData ? tmdbData.overview : ""),
      poster: body.poster || linkedItem?.backdrop || linkedItem?.poster || tmdbImage(tmdbData?.backdrop_path || tmdbData?.poster_path, "w1280"),
      video: formatStreamUrl(body.video || linkedItem?.video || (linkedItem?.media && linkedItem.media.streamUrl) || ""),
      year: linkedItem?.year || (tmdbData ? String((tmdbData.release_date || tmdbData.first_air_date || "").slice(0, 4)) : ""),
      rating: linkedItem?.rating || (tmdbData ? String(tmdbData.vote_average || "") : ""),
      position: body.position !== undefined ? body.position : catalog.heroSlides.length + 1,
    };

    catalog.heroSlides.push(item);
    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true, item });
  }

  // --- POST /api/admin/hero-slide/reorder ---
  if (pathname === "/api/admin/hero-slide/reorder" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();
    const list = catalog.heroSlides || [];

    const idx = list.findIndex((i) => i.id === body.id);
    if (idx === -1) return sendJson(res, 404, { error: "Hero slide not found." });

    const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return sendJson(res, 400, { error: "Cannot move further." });

    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    catalog.heroSlides = list;
    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true });
  }

  // --- POST /api/admin/settings ---
  if (pathname === "/api/admin/settings" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await parseBody(req);
    const catalog = await readCatalog();
    if (!catalog.settings) catalog.settings = {};

    if (body.movieCardSize) catalog.settings.movieCardSize = body.movieCardSize;
    if (body.seriesCardSize) catalog.settings.seriesCardSize = body.seriesCardSize;
    if (body.songCardSize) catalog.settings.songCardSize = body.songCardSize;
    if (body.csCardSize) catalog.settings.csCardSize = body.csCardSize;
    if (body.seasonCsCardSize) catalog.settings.seasonCsCardSize = body.seasonCsCardSize;

    await writeCatalog(catalog);
    return sendJson(res, 200, { ok: true });
  }

  // --- POST /api/admin/upload-video ---
  if (pathname.startsWith("/api/admin/upload-video") && method === "POST") {
    if (!requireAdmin(req, res)) return;

    const filename = parsedUrl.searchParams.get("filename") || "video.mp4";
    const uploadId = parsedUrl.searchParams.get("uploadId") || uuidv4();
    const offset = parseInt(parsedUrl.searchParams.get("offset") || "0", 10);
    const total = parseInt(parsedUrl.searchParams.get("total") || "0", 10);

    const uploadDir = path.join(UPLOADS_DIR, uploadId);
    await fsPromises.mkdir(uploadDir, { recursive: true });

    const raw = await parseRawBody(req);
    const chunkPath = path.join(uploadDir, `chunk_${offset}`);
    await fsPromises.writeFile(chunkPath, raw);

    const received = offset + raw.length;
    const isComplete = total > 0 && received >= total;

    if (isComplete) {
      // Assemble chunks
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const finalPath = path.join(UPLOADS_DIR, `${uploadId}_${safeName}`);
      const files = await fsPromises.readdir(uploadDir);
      files.sort((a, b) => {
        const aOff = parseInt(a.split("_")[1], 10);
        const bOff = parseInt(b.split("_")[1], 10);
        return aOff - bOff;
      });

      const writeStream = fs.createWriteStream(finalPath);
      for (const f of files) {
        const data = await fsPromises.readFile(path.join(uploadDir, f));
        writeStream.write(data);
      }
      writeStream.end();

      // Clean up chunk directory
      await fsPromises.rm(uploadDir, { recursive: true, force: true });

      const streamUrl = `/data/uploads/${uploadId}_${safeName}`;
      return sendJson(res, 200, {
        ok: true,
        received,
        media: { provider: "local", streamUrl, downloadUrl: streamUrl },
      });
    }

    return sendJson(res, 200, { ok: true, received });
  }

  // --- GET /api/media/:id (redirect to stream URL) ---
  if (pathname.startsWith("/api/media/") && method === "GET") {
    const mediaId = decodeURIComponent(pathname.slice("/api/media/".length));
    const catalog = await readCatalog();
    let mediaObj = null;
    const item = (catalog.items || []).find((i) => i.id === mediaId);
    if (item && item.media) {
      mediaObj = item.media;
    } else {
      for (const it of (catalog.items || [])) {
        for (const s of (it.seasons || [])) {
          const ep = (s.episodes || []).find(e => e.id === mediaId);
          if (ep && ep.media) {
            mediaObj = ep.media;
            break;
          }
        }
        if (mediaObj) break;
      }
    }
    if (!mediaObj) return sendJson(res, 404, { error: "Media not found." });

    if (req.url.includes("info=1")) {
      return sendJson(res, 200, { ok: true, media: mediaObj });
    }

    // Handle local files specially based on provider/filename
    if (mediaObj.provider === "local" && mediaObj.filename) {
        let filePath = path.join(UPLOADS_DIR, mediaObj.filename);
        
        // Auto-serve MP4 version if MKV was requested (for browser seeking support)
        if (filePath.endsWith(".mkv")) {
            const mp4Path = filePath.replace(/\.mkv$/i, ".mp4");
            if (fs.existsSync(mp4Path)) {
                filePath = mp4Path;
            }
        }
        
        return serveStaticFile(res, filePath, req);
    }

    const url = mediaObj.streamUrl || "";
    if (!url) return sendJson(res, 404, { error: "No stream URL." });

    // Legacy fallback for local files that stored absolute path in streamUrl
    if (url.startsWith("/")) {
      const filePath = path.join(__dirname, url);
      return serveStaticFile(res, filePath, req);
    }

    res.writeHead(302, { Location: url });
    return res.end();
  }

  // --- AUTH: POST /api/auth/signup ---
  if (pathname === "/api/auth/signup" && method === "POST") {
    const body = await parseBody(req);
    if (!body.email || !body.password) return sendJson(res, 400, { error: "Email and password are required." });

    const existing = await UserModel.findByEmail(body.email);
    if (existing) return sendJson(res, 409, { error: "Email already registered." });

    const hash = await bcrypt.hash(body.password, 10);
    const user = await UserModel.createUser(body.email, hash, body.name);
    const token = generateToken(user.id);
    return sendJson(res, 201, { token, user: { id: user.id, email: user.email, name: user.name } });
  }

  // --- AUTH: POST /api/auth/login ---
  if (pathname === "/api/auth/login" && method === "POST") {
    const body = await parseBody(req);
    if (!body.email || !body.password) return sendJson(res, 400, { error: "Email and password are required." });

    const user = await UserModel.findByEmail(body.email);
    if (!user) return sendJson(res, 401, { error: "Invalid credentials." });

    const match = await bcrypt.compare(body.password, user.passwordHash);
    if (!match) return sendJson(res, 401, { error: "Invalid credentials." });

    const token = generateToken(user.id);
    return sendJson(res, 200, { token, user: { id: user.id, email: user.email, name: user.name } });
  }

  // --- AUTH: GET /api/auth/me ---
  if (pathname === "/api/auth/me" && method === "GET") {
    // Manually verify JWT
    const authHeader = req.headers["authorization"] || "";
    const jwtToken = authHeader.replace("Bearer ", "");
    if (!jwtToken) return sendJson(res, 401, { error: "No token." });

    const jwt = require("jsonwebtoken");
    const JWT_SECRET = ENV.JWT_SECRET || "default_jwt_secret_please_change";
    try {
      const decoded = jwt.verify(jwtToken, JWT_SECRET);
      const user = await UserModel.findById(decoded.userId);
      if (!user) return sendJson(res, 404, { error: "User not found." });
      return sendJson(res, 200, { id: user.id, email: user.email, name: user.name });
    } catch {
      return sendJson(res, 401, { error: "Invalid or expired token." });
    }
  }

  // --- USER: POST /api/user/downloads/add ---
  if (pathname === "/api/user/downloads/add" && method === "POST") {
    const userId = await authenticateUser(req, res);
    if (!userId) return;
    const body = await parseBody(req);
    const result = await UserModel.addDownload(userId, body);
    return sendJson(res, 200, { ok: true, download: result });
  }

  // --- USER: GET /api/user/downloads ---
  if (pathname === "/api/user/downloads" && method === "GET") {
    const userId = await authenticateUser(req, res);
    if (!userId) return;
    const downloads = await UserModel.listDownloads(userId);
    return sendJson(res, 200, { downloads });
  }

  // --- USER: DELETE /api/user/downloads/:downloadId ---
  if (pathname.startsWith("/api/user/downloads/") && method === "DELETE") {
    const userId = await authenticateUser(req, res);
    if (!userId) return;
    const downloadId = decodeURIComponent(pathname.slice("/api/user/downloads/".length));
    await UserModel.removeDownload(userId, downloadId);
    return sendJson(res, 200, { ok: true });
  }

  // ======================= STATIC FILES =======================
  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);
  return serveStaticFile(res, filePath, req);
}

/* =========================================================
   AUTH HELPER
========================================================= */
async function authenticateUser(req, res) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    sendJson(res, 401, { error: "Not authenticated." });
    return null;
  }
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = ENV.JWT_SECRET || "default_jwt_secret_please_change";
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    sendJson(res, 401, { error: "Invalid or expired token." });
    return null;
  }
}

/* =========================================================
   STATIC FILE SERVER
========================================================= */
function serveStaticFile(res, filePath, req) {
  // Prevent directory traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(__dirname))) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const mime = getMime(resolved);
    const fileSize = stats.size;

    // Support range requests for streaming (video/audio/large files)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      
      // Limit chunk size to 3MB at a time to prevent TV memory/buffer crashes
      const CHUNK_SIZE = 3 * 1024 * 1024;
      
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Cap the end byte
      if (end - start + 1 > CHUNK_SIZE) {
        end = start + CHUNK_SIZE - 1;
      }
      if (end >= fileSize) {
        end = fileSize - 1;
      }
      
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": mime,
      });
      fs.createReadStream(resolved, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Type": mime,
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes"
      });
      fs.createReadStream(resolved).pipe(res);
    }
  });
}

/* =========================================================
   START SERVER
========================================================= */
const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal server error." });
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✅ WebMovies server running at http://localhost:${PORT}\n`);
  console.log(`  📁 Serving files from: ${__dirname}`);
  console.log(`  🎬 Admin panel: http://localhost:${PORT}/admin.html\n`);
});
