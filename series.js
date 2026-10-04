"use strict";

/*
 * WebMovies catalog server
 *
 * This server is intentionally dependency-free. It keeps provider credentials
 * off the public website and produces short-lived playback/download redirects.
 */

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");
const { Readable } = require("node:stream");
const bcrypt = require("bcryptjs");
const auth = require("./auth");
const userModel = require("./userModel");

const ROOT_DIRECTORY = __dirname;
const CATALOG_PATH = path.join(ROOT_DIRECTORY, "data", "catalog.json");
const UPLOADS_DIRECTORY = path.join(ROOT_DIRECTORY, "data", "uploads");
const ENV_PATH = path.join(ROOT_DIRECTORY, ".env");
const PORT = Number(process.env.PORT || 3000);
const MAX_REQUEST_BODY_SIZE = 1024 * 1024;

const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
};

function parseEnvironment(text) {

    return text.split(/\r?\n/).reduce((environment, line) => {

        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#")) {
            return environment;
        }

        const separator = trimmedLine.indexOf("=");

        if (separator < 1) {
            return environment;
        }

        const key = trimmedLine.slice(0, separator).trim();
        const value = trimmedLine.slice(separator + 1).trim();

        environment[key] = value.replace(/^['"]|['"]$/g, "");

        return environment;

    }, {});
}

async function getConfiguration() {

    let fileEnvironment = {};

    try {
        fileEnvironment = parseEnvironment(await fs.readFile(ENV_PATH, "utf8"));
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }

    return {
        adminToken: process.env.ADMIN_TOKEN || fileEnvironment.ADMIN_TOKEN || "",
        teraBoxAccessToken:
            process.env.TERABOX_ACCESS_TOKEN ||
            fileEnvironment.TERABOX_ACCESS_TOKEN ||
            "",
        tmdbBearerToken:
            process.env.TMDB_BEARER_TOKEN ||
            fileEnvironment.TMDB_BEARER_TOKEN ||
            ""
    };
}

function sendJson(response, statusCode, payload) {

    response.writeHead(statusCode, {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8"
    });

    response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {

    sendJson(response, statusCode, { error: message });
}

async function readCatalog() {

    try {
        let raw = await fs.readFile(CATALOG_PATH, "utf8");
        // Strip BOM if present (Windows PowerShell sometimes adds it)
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        const catalog = JSON.parse(raw);

        return {
            items: Array.isArray(catalog.items) ? catalog.items : [],
            comingSoon: Array.isArray(catalog.comingSoon) ? catalog.comingSoon : [],
            heroSlides: Array.isArray(catalog.heroSlides) ? catalog.heroSlides : [],
            settings: catalog.settings || { csCardSize: "medium" }
        };
    } catch (error) {
        if (error.code === "ENOENT") {
            return { items: [], comingSoon: [], heroSlides: [], settings: { csCardSize: "medium" } };
        }

        throw error;
    }
}

async function writeCatalog(catalog) {

    await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true });
    await fs.writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

function getPublicItem(item) {

    const publicItem = { ...item };

    publicItem.playbackAvailable = Boolean(
        item.media && item.media.provider
    );

    if (item.media && typeof item.media.path === "string") {
        publicItem.parts = item.media.path.split(",").map(p => p.trim()).filter(Boolean).length || 1;
    } else if (item.media && typeof item.media.streamUrl === "string") {
        publicItem.parts = item.media.streamUrl.split(",").map(p => p.trim()).filter(Boolean).length || 1;
    } else {
        publicItem.parts = 1;
    }

    delete publicItem.media;

    if (Array.isArray(item.seasons)) {
        publicItem.seasons = item.seasons.map(season => ({
            ...season,
            episodes: (season.episodes || []).map(episode => {
                const publicEpisode = { ...episode };
                publicEpisode.playbackAvailable = Boolean(
                    episode.media && episode.media.provider
                );
                if (episode.media && typeof episode.media.path === "string") {
                    publicEpisode.parts = episode.media.path.split(",").map(p => p.trim()).filter(Boolean).length || 1;
                } else if (episode.media && typeof episode.media.streamUrl === "string") {
                    publicEpisode.parts = episode.media.streamUrl.split(",").map(p => p.trim()).filter(Boolean).length || 1;
                } else {
                    publicEpisode.parts = 1;
                }
                delete publicEpisode.media;
                return publicEpisode;
            })
        }));
    }

    return publicItem;
}

function findMediaItem(catalog, mediaId) {

    for (const item of catalog.items) {

        if (item.id === mediaId) {
            return item;
        }

        for (const season of item.seasons || []) {
            const episode = (season.episodes || []).find(
                entry => entry.id === mediaId
            );

            if (episode) {
                return episode;
            }
        }
    }

    return null;
}

function isAdminRequest(request, configuration) {

    return Boolean(configuration.adminToken) &&
        request.headers["x-admin-token"] === configuration.adminToken;
}

async function readRequestJson(request) {

    let body = "";

    for await (const chunk of request) {
        body += chunk;

        if (body.length > MAX_REQUEST_BODY_SIZE) {
            throw new Error("Request is too large.");
        }
    }

    return JSON.parse(body || "{}");
}

function posterUrl(filePath) {

    return filePath
        ? `https://image.tmdb.org/t/p/w780${filePath}`
        : "";
}

function makeId(prefix, value) {

    return `${prefix}-${String(value)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function slugify(value) {

    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function normalizeMedia(media) {

    if (!media || !media.provider) {
        return media || {};
    }

    if (media.provider === "direct") {
        const streamUrl =
            media.streamUrl ||
            media.downloadUrl ||
            media.url ||
            "";

        return {
            provider: "direct",
            streamUrl,
            downloadUrl: media.downloadUrl || streamUrl
        };
    }

    if (media.provider === "local") {
        return {
            provider: "local",
            filename: path.basename(media.filename || "")
        };
    }

    return media;
}

async function tmdbRequest(endpoint, configuration) {

    if (!configuration.tmdbBearerToken) {
        throw new Error("TMDB_BEARER_TOKEN is missing from .env.");
    }

    let response;
    try {
        response = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
            headers: {
                Authorization: `Bearer ${configuration.tmdbBearerToken}`,
                accept: "application/json"
            }
        });
    } catch (error) {
        throw new Error(`TMDb connection failed: ${error.message}. Check internet access and TMDB_BEARER_TOKEN.`);
    }

    if (!response.ok) {
        throw new Error(`TMDb request failed (${response.status}).`);
    }

    return response.json();
}

async function findTmdbMatch(title, kind, configuration) {

    const endpoint = kind === "series" ? "/search/tv" : "/search/movie";
    const result = await tmdbRequest(
        `${endpoint}?query=${encodeURIComponent(title)}`,
        configuration
    );

    if (!result.results || !result.results[0]) {
        throw new Error("No matching TMDb title was found.");
    }

    return result.results[0];
}

async function searchTmdb(title, kind, configuration) {

    const match = await findTmdbMatch(title, kind, configuration);
    return match.id;
}

async function createMovie(payload, configuration) {

    const tmdbId = payload.tmdbId || await searchTmdb(
        payload.title,
        "movie",
        configuration
    );

    const details = await tmdbRequest(`/movie/${tmdbId}`, configuration);

    return {
        id: slugify(details.title),
        kind: "movie",
        title: details.title,
        year: (details.release_date || "").slice(0, 4),
        rating: Number(details.vote_average || 0).toFixed(1),
        description: details.overview || "",
        poster: payload.customPoster || posterUrl(details.poster_path),
        backdrop: posterUrl(details.backdrop_path),
        duration: details.runtime ? `${details.runtime}m` : "",
        media: normalizeMedia(payload.media || {})
    };
}

async function createSeries(payload, configuration) {

    const tmdbId = payload.tmdbId || await searchTmdb(
        payload.title,
        "series",
        configuration
    );

    const details = await tmdbRequest(`/tv/${tmdbId}`, configuration);
    const suppliedEpisodeMedia = payload.episodeMedia || {};
    const seasons = [];

    for (const season of details.seasons || []) {

        if (!season.season_number) {
            continue;
        }

        const seasonDetails = await tmdbRequest(
            `/tv/${tmdbId}/season/${season.season_number}`,
            configuration
        );

        seasons.push({
            number: season.season_number,
            title: season.name || `Season ${season.season_number}`,
            poster: posterUrl(season.poster_path) || posterUrl(details.poster_path),
            episodes: (seasonDetails.episodes || []).map(episode => {
                const key = `${season.season_number}-${episode.episode_number}`;

                return {
                    id: `${slugify(details.name)}-s${season.season_number}-e${episode.episode_number}`,
                    number: episode.episode_number,
                    title: episode.name || `Episode ${episode.episode_number}`,
                    description: episode.overview || "",
                    duration: episode.runtime ? `${episode.runtime}m` : "",
                    poster:
                        posterUrl(episode.still_path) ||
                        posterUrl(season.poster_path) ||
                        posterUrl(details.backdrop_path),
                    media: normalizeMedia(suppliedEpisodeMedia[key] || {})
                };
            })
        });
    }

    return {
        id: slugify(details.name),
        kind: "series",
        title: details.name,
        year: (details.first_air_date || "").slice(0, 4),
        rating: Number(details.vote_average || 0).toFixed(1),
        description: details.overview || "",
        poster: payload.customPoster || posterUrl(details.poster_path),
        backdrop: posterUrl(details.backdrop_path),
        seasons
    };
}

async function createCatalogItem(payload, configuration) {

    if (!payload || !payload.title || !["movie", "series"].includes(payload.kind)) {
        throw new Error("Provide a title and a kind of movie or series.");
    }

    return payload.kind === "series"
        ? createSeries(payload, configuration)
        : createMovie(payload, configuration);
}

async function getTeraBoxDownloadUrl(media, configuration, partIndex = 0) {

    if (!configuration.teraBoxAccessToken) {
        throw new Error("TERABOX_ACCESS_TOKEN is missing from .env.");
    }

    if (!media.path) {
        throw new Error("This media item needs a TeraBox path.");
    }

    const paths = media.path.split(",").map(p => p.trim()).filter(Boolean);
    const targetPath = paths[partIndex];

    if (!targetPath) {
        throw new Error(`The specified video part (${partIndex}) was not found.`);
    }

    const query = new URLSearchParams({
        access_tokens: configuration.teraBoxAccessToken,
        target: JSON.stringify([targetPath]),
        dlink: "1"
    });

    const response = await fetch(
        `https://www.terabox.com/openapi/api/filemetas?${query}`
    );

    if (!response.ok) {
        throw new Error(`TeraBox file lookup failed (${response.status}).`);
    }

    const result = await response.json();
    const downloadUrl = result.list && result.list[0] && result.list[0].dlink;

    if (!downloadUrl) {
        throw new Error("TeraBox did not return a downloadable file URL.");
    }

    const url = new URL(downloadUrl);

    if (!url.searchParams.has("access_tokens")) {
        url.searchParams.set("access_tokens", configuration.teraBoxAccessToken);
    }

    return url.toString();
}

async function resolveMediaUrl(media, configuration, partIndex = 0) {

    if (!media || !media.provider) {
        throw new Error("No media file has been connected to this title yet.");
    }

    if (media.provider === "direct") {
        const urls = (media.downloadUrl || media.streamUrl || media.url || "")
            .split(",")
            .map(u => u.trim())
            .filter(Boolean);
        const directUrl = urls[partIndex];

        if (!directUrl) {
            throw new Error(`The specified direct media URL part (${partIndex}) was not found.`);
        }

        return directUrl;
    }

    if (media.provider === "local") {
        if (!media.filename) {
            throw new Error("This local media item has no uploaded file.");
        }
        return `/api/uploads/${encodeURIComponent(path.basename(media.filename))}`;
    }

    if (media.provider === "terabox") {
        return getTeraBoxDownloadUrl(media, configuration, partIndex);
    }

    throw new Error("This media provider is not supported.");
}

async function serveStaticFile(response, pathname) {

    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const resolvedPath = path.resolve(ROOT_DIRECTORY, `.${requestedPath}`);

    if (!resolvedPath.startsWith(`${ROOT_DIRECTORY}${path.sep}`) ||
        resolvedPath === ENV_PATH ||
        resolvedPath === CATALOG_PATH) {
        sendError(response, 404, "Not found.");
        return;
    }

    try {
        const file = await fs.readFile(resolvedPath);
        const contentType = MIME_TYPES[path.extname(resolvedPath).toLowerCase()] ||
            "application/octet-stream";

        response.writeHead(200, {
            "Content-Type": contentType,
            "X-Content-Type-Options": "nosniff"
        });
        response.end(file);
    } catch (error) {
        if (error.code === "ENOENT") {
            sendError(response, 404, "Not found.");
            return;
        }

        throw error;
    }
}

const server = http.createServer(async (request, response) => {

    try {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }

        const requestUrl = new URL(request.url, 'http://' + request.headers.host);
        const pathname = decodeURIComponent(requestUrl.pathname);
        console.log('Incoming request:', request.method, pathname);
        const configuration = await getConfiguration();

        if (request.method === "GET" && pathname === "/api/catalog") {
            const catalog = await readCatalog();
            sendJson(response, 200, {
                items: catalog.items.map(getPublicItem),
                comingSoon: catalog.comingSoon || [],
                heroSlides: catalog.heroSlides || [],
                settings: catalog.settings || { csCardSize: "medium" }
            });
            return;
        }

        if (request.method === "GET" && pathname.startsWith("/api/media/")) {
            const catalog = await readCatalog();
            const mediaId = pathname.slice("/api/media/".length);
            const mediaItem = findMediaItem(catalog, mediaId);

            if (!mediaItem) {
                sendError(response, 404, "Media item not found.");
                return;
            }

            const partParam = requestUrl.searchParams.get("part");
            const partIndex = partParam ? parseInt(partParam, 10) : 0;

            const mediaUrl = await resolveMediaUrl(mediaItem.media, configuration, partIndex);
            response.writeHead(302, {
                "Cache-Control": "no-store",
                Location: mediaUrl
            });
            response.end();
            return;
        }

        if (request.method === "GET" && pathname.startsWith("/api/uploads/")) {
            const filename = path.basename(pathname.slice("/api/uploads/".length));
            const filePath = path.join(UPLOADS_DIRECTORY, filename);
            const fileStats = await fs.stat(filePath).catch(() => null);

            if (!fileStats || !fileStats.isFile()) {
                sendError(response, 404, "Uploaded video not found.");
                return;
            }

            const range = request.headers.range;
            const contentType = MIME_TYPES[path.extname(filename).toLowerCase()] ||
                "application/octet-stream";
            const baseHeaders = {
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "Connection": "keep-alive",
                "Content-Type": contentType
            };

            if (!range) {
                response.writeHead(200, { ...baseHeaders, "Content-Length": fileStats.size });
                require("node:fs").createReadStream(filePath).pipe(response);
                return;
            }

            const match = /^bytes=(\d*)-(\d*)$/.exec(range);
            if (!match) {
                response.writeHead(416, { "Content-Range": `bytes */${fileStats.size}` });
                response.end();
                return;
            }

            const start = match[1] ? Number(match[1]) : 0;
            const requestedEnd = match[2] ? Number(match[2]) : fileStats.size - 1;
            const end = Math.min(requestedEnd, fileStats.size - 1);
            if (start > end || start >= fileStats.size) {
                response.writeHead(416, { "Content-Range": `bytes */${fileStats.size}` });
                response.end();
                return;
            }

            response.writeHead(206, {
                ...baseHeaders,
                "Content-Length": end - start + 1,
                "Content-Range": `bytes ${start}-${end}/${fileStats.size}`
            });
            require("node:fs").createReadStream(filePath, { start, end }).pipe(response);
            return;
        }

        // --- User Auth Routes ---
        if (request.method === "POST" && pathname === "/api/auth/signup") {
            const payload = await readRequestJson(request);
            if (!payload.email || !payload.password) {
                sendError(response, 400, "Email and password required");
                return;
            }
            if (payload.password.length < 6) {
                sendError(response, 400, "Password must be at least 6 characters");
                return;
            }
            const existing = await userModel.findByEmail(payload.email);
            if (existing) {
                sendError(response, 400, "User already exists");
                return;
            }
            const hash = await bcrypt.hash(payload.password, 10);
            const displayName = payload.name || payload.email.split("@")[0];
            const newUser = await userModel.createUser(payload.email, hash, displayName);
            const token = auth.generateToken(newUser.id);
            sendJson(response, 201, { token, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
            return;
        }

        if (request.method === "POST" && pathname === "/api/auth/login") {
            const payload = await readRequestJson(request);
            if (!payload.email || !payload.password) {
                sendError(response, 400, "Email and password required");
                return;
            }
            const user = await userModel.findByEmail(payload.email);
            if (!user) {
                sendError(response, 401, "Invalid credentials");
                return;
            }
            const valid = await bcrypt.compare(payload.password, user.passwordHash);
            if (!valid) {
                sendError(response, 401, "Invalid credentials");
                return;
            }
            const token = auth.generateToken(user.id);
            sendJson(response, 200, { token, user: { id: user.id, email: user.email } });
            return;
        }

        if (request.method === "GET" && pathname === "/api/auth/me") {
            auth.verifyToken(request, response, async () => {
                const user = await userModel.findById(request.userId);
                if (!user) {
                    sendError(response, 404, "User not found");
                    return;
                }
                sendJson(response, 200, { id: user.id, email: user.email, name: user.name || user.email });
            });
            return;
        }

        // --- User Downloads Routes ---
        if (request.method === "GET" && pathname === "/api/user/downloads") {
            auth.verifyToken(request, response, async () => {
                const downloads = await userModel.listDownloads(request.userId);
                sendJson(response, 200, { downloads });
            });
            return;
        }

        if (request.method === "POST" && pathname === "/api/user/downloads/add") {
            auth.verifyToken(request, response, async () => {
                const payload = await readRequestJson(request);
                const info = await userModel.addDownload(request.userId, payload);
                sendJson(response, 201, { download: info });
            });
            return;
        }

        if (request.method === "DELETE" && pathname.startsWith("/api/user/downloads/")) {
            auth.verifyToken(request, response, async () => {
                const downloadId = pathname.slice("/api/user/downloads/".length);
                const success = await userModel.removeDownload(request.userId, downloadId);
                sendJson(response, success ? 200 : 404, { success });
            });
            return;
        }

        if (request.method === "GET" && pathname.startsWith("/api/download/")) {
            auth.verifyToken(request, response, async () => {
                try {
                    const catalog = await readCatalog();
                    const mediaId = pathname.slice("/api/download/".length);
                    const mediaItem = findMediaItem(catalog, mediaId);
                    if (!mediaItem) {
                        sendError(response, 404, "Media item not found");
                        return;
                    }
                    const mediaUrl = await resolveMediaUrl(mediaItem.media, configuration, 0);

                    const proxyRes = await fetch(mediaUrl);
                    if (!proxyRes.ok) {
                        sendError(response, 502, "Upstream error");
                        return;
                    }

                    // For CORS headers on downloads
                    response.setHeader("Access-Control-Allow-Origin", "*");
                    response.setHeader("Access-Control-Expose-Headers", "Content-Length");

                    response.writeHead(200, {
                        "Content-Type": proxyRes.headers.get("content-type") || "application/octet-stream",
                        "Content-Length": proxyRes.headers.get("content-length") || "",
                        "Content-Disposition": `attachment; filename="${mediaItem.title.replace(/[^a-z0-9]/gi, '_')}.mp4"`
                    });

                    if (proxyRes.body) {
                        Readable.fromWeb(proxyRes.body).pipe(response);
                    } else {
                        response.end();
                    }
                } catch (err) {
                    sendError(response, 500, err.message);
                }
            });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/verify") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Invalid admin token.");
                return;
            }
            sendJson(response, 200, { ok: true });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/import") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const item = await createCatalogItem(payload, configuration);
            const catalog = await readCatalog();
            const existingIndex = catalog.items.findIndex(entry => entry.id === item.id);

            if (existingIndex >= 0) {
                catalog.items[existingIndex] = item;
            } else {
                catalog.items.push(item);
            }

            await writeCatalog(catalog);
            sendJson(response, 201, { item: getPublicItem(item) });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/upload-video") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const originalName = requestUrl.searchParams.get("filename") || "video.mp4";
            const extension = path.extname(originalName).toLowerCase() || ".mp4";
            await fs.mkdir(UPLOADS_DIRECTORY, { recursive: true });
            const uploadId = (requestUrl.searchParams.get("uploadId") || "")
                .replace(/[^a-zA-Z0-9-]/g, "");
            const offset = Number(requestUrl.searchParams.get("offset") || 0);
            const total = Number(requestUrl.searchParams.get("total") || 0);

            if (!uploadId || !Number.isSafeInteger(offset) || offset < 0 ||
                !Number.isSafeInteger(total) || total <= 0 || offset > total) {
                sendError(response, 400, "Invalid upload chunk metadata.");
                return;
            }

            const partialPath = path.join(UPLOADS_DIRECTORY, `${uploadId}.part`);
            const existingStats = await fs.stat(partialPath).catch(() => null);
            const existingBytes = existingStats ? existingStats.size : 0;
            if (existingBytes !== offset) {
                sendError(response, 409, `Upload offset mismatch. Expected ${existingBytes}.`);
                return;
            }

            await new Promise((resolve, reject) => {
                const output = require("node:fs").createWriteStream(partialPath, { flags: "a" });
                request.pipe(output);
                request.on("error", reject);
                output.on("error", reject);
                output.on("finish", resolve);
            });

            const received = (await fs.stat(partialPath)).size;
            if (received > total) {
                await fs.rm(partialPath, { force: true });
                sendError(response, 400, "Uploaded data is larger than the selected file.");
                return;
            }

            if (received < total) {
                sendJson(response, 200, { received });
                return;
            }

            const safeName = `${uploadId}${extension}`;
            await fs.rename(partialPath, path.join(UPLOADS_DIRECTORY, safeName));
            sendJson(response, 201, {
                received,
                media: { provider: "local", filename: safeName }
            });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/coming-soon") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const catalog = await readCatalog();

            if (!catalog.comingSoon) {
                catalog.comingSoon = [];
            }

            let title = payload.title || "";
            let description = payload.description || "";
            let poster = payload.poster || "";

            // Auto-fetch from TMDB if tmdbQuery is provided or poster is missing
            const query = payload.tmdbQuery || title;
            if (query && (!poster || payload.fetchTmdb)) {
                const searchKind = payload.type === "series" ? "series" : "movie";
                try {
                    const tmdbItem = await findTmdbMatch(query, searchKind, configuration);
                    if (tmdbItem) {
                        title = title || tmdbItem.title || tmdbItem.name;
                        description = description || tmdbItem.overview || "";
                        poster = poster || posterUrl(tmdbItem.poster_path || tmdbItem.backdrop_path);
                    }
                } catch (err) {
                    console.warn("TMDB Coming Soon lookup failed:", err.message);
                }
            }

            const newItem = {
                id: makeId("cs", Date.now()),
                title: title || "Untitled",
                type: payload.type || "movie",
                poster: poster || "",
                video: payload.video || "",
                description: description || "",
                seriesId: payload.seriesId || ""
            };

            catalog.comingSoon.push(newItem);

            await writeCatalog(catalog);
            sendJson(response, 201, { success: true, item: newItem });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/hero-slide") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const catalog = await readCatalog();

            if (!catalog.heroSlides) {
                catalog.heroSlides = [];
            }

            let title = payload.title || "";
            let description = payload.description || "";
            let poster = payload.poster || "";
            let year = payload.year || "";
            let rating = payload.rating || "";

            // Auto-fetch from TMDB if title provided and poster is missing
            const query = payload.tmdbQuery || title;
            if (query && (!poster || payload.fetchTmdb)) {
                const searchKind = payload.type === "series" ? "series" : "movie";
                try {
                    const tmdbItem = await findTmdbMatch(query, searchKind, configuration);
                    if (tmdbItem) {
                        title = title || tmdbItem.title || tmdbItem.name;
                        description = description || tmdbItem.overview || "";
                        poster = poster || posterUrl(tmdbItem.backdrop_path || tmdbItem.poster_path);
                        year = year || (tmdbItem.release_date || tmdbItem.first_air_date || "").slice(0, 4);
                        rating = rating || (tmdbItem.vote_average ? String(tmdbItem.vote_average.toFixed(1)) : "");
                    }
                } catch (err) {
                    console.warn("TMDB Hero Slide lookup failed:", err.message);
                }
            }

            const position = typeof payload.position === 'number' ? payload.position : catalog.heroSlides.length;

            const newSlide = {
                id: makeId("hero", Date.now()),
                title: title || "Untitled",
                description: description || "",
                poster: poster || "",
                video: payload.video || "",
                mediaId: payload.mediaId || "",
                year: year,
                rating: rating,
                type: payload.type || "Movie",
                quality: payload.quality || "HD",
                position: position
            };

            catalog.heroSlides.splice(position, 0, newSlide);
            // Re-index positions
            catalog.heroSlides.forEach((s, i) => { s.position = i; });

            await writeCatalog(catalog);
            sendJson(response, 201, { success: true, item: newSlide });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/reorder") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const { id, direction, type } = payload;
            if (!id || !direction) {
                sendError(response, 400, "Item ID and direction are required.");
                return;
            }

            const catalog = await readCatalog();

            if (type === "coming-soon") {
                if (!catalog.comingSoon) catalog.comingSoon = [];
                const index = catalog.comingSoon.findIndex(s => s.id === id);
                if (index === -1) {
                    sendError(response, 404, "Coming soon item not found.");
                    return;
                }
                const targetIndex = direction === "up" ? index - 1 : index + 1;
                if (targetIndex >= 0 && targetIndex < catalog.comingSoon.length) {
                    const temp = catalog.comingSoon[index];
                    catalog.comingSoon[index] = catalog.comingSoon[targetIndex];
                    catalog.comingSoon[targetIndex] = temp;
                    await writeCatalog(catalog);
                    sendJson(response, 200, { success: true });
                } else {
                    sendError(response, 400, "Cannot move in that direction.");
                }
            } else if (type === "hero") {
                if (!catalog.heroSlides) catalog.heroSlides = [];
                const index = catalog.heroSlides.findIndex(s => s.id === id);
                if (index === -1) {
                    sendError(response, 404, "Hero slide not found.");
                    return;
                }
                const targetIndex = direction === "up" ? index - 1 : index + 1;
                if (targetIndex >= 0 && targetIndex < catalog.heroSlides.length) {
                    const temp = catalog.heroSlides[index];
                    catalog.heroSlides[index] = catalog.heroSlides[targetIndex];
                    catalog.heroSlides[targetIndex] = temp;
                    catalog.heroSlides.forEach((s, i) => { s.position = i; });
                    await writeCatalog(catalog);
                    sendJson(response, 200, { success: true });
                } else {
                    sendError(response, 400, "Cannot move in that direction.");
                }
            } else {
                if (!catalog.items) catalog.items = [];
                const index = catalog.items.findIndex(item => item.id === id);
                if (index === -1) {
                    sendError(response, 404, "Item not found in catalog.");
                    return;
                }
                const kind = catalog.items[index].kind;

                let targetIndex = -1;
                if (direction === "up") {
                    for (let i = index - 1; i >= 0; i--) {
                        if (catalog.items[i].kind === kind) {
                            targetIndex = i;
                            break;
                        }
                    }
                } else if (direction === "down") {
                    for (let i = index + 1; i < catalog.items.length; i++) {
                        if (catalog.items[i].kind === kind) {
                            targetIndex = i;
                            break;
                        }
                    }
                }

                if (targetIndex !== -1) {
                    const temp = catalog.items[index];
                    catalog.items[index] = catalog.items[targetIndex];
                    catalog.items[targetIndex] = temp;
                    await writeCatalog(catalog);
                    sendJson(response, 200, { success: true });
                } else {
                    sendError(response, 400, "Cannot move further in this direction.");
                }
            }
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/toggle-home") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const { id } = payload;
            if (!id) {
                sendError(response, 400, "Item ID is required.");
                return;
            }

            const catalog = await readCatalog();
            let updated = false;

            if (Array.isArray(catalog.items)) {
                const item = catalog.items.find(i => i.id === id);
                if (item) {
                    item.showOnHome = item.showOnHome !== false ? false : true;
                    updated = true;
                }
            }

            if (!updated) {
                sendError(response, 404, "Item not found in catalog.");
                return;
            }

            await writeCatalog(catalog);
            sendJson(response, 200, { success: true });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/hero-slide/reorder") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const { id, direction } = payload;
            if (!id || !direction) {
                sendError(response, 400, "Item ID and direction are required.");
                return;
            }

            const catalog = await readCatalog();
            if (!catalog.heroSlides) {
                catalog.heroSlides = [];
            }

            const index = catalog.heroSlides.findIndex(s => s.id === id);
            if (index === -1) {
                sendError(response, 404, "Hero slide not found.");
                return;
            }

            const targetIndex = direction === "up" ? index - 1 : index + 1;
            if (targetIndex >= 0 && targetIndex < catalog.heroSlides.length) {
                const temp = catalog.heroSlides[index];
                catalog.heroSlides[index] = catalog.heroSlides[targetIndex];
                catalog.heroSlides[targetIndex] = temp;
                catalog.heroSlides.forEach((s, i) => { s.position = i; });
                await writeCatalog(catalog);
                sendJson(response, 200, { success: true });
            } else {
                sendError(response, 400, "Cannot move in that direction.");
            }
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/settings") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const catalog = await readCatalog();

            if (!catalog.settings) {
                catalog.settings = {};
            }

            if (payload.csCardSize) catalog.settings.csCardSize = payload.csCardSize;
            if (payload.seasonCsCardSize) catalog.settings.seasonCsCardSize = payload.seasonCsCardSize;
            if (payload.movieCardSize) catalog.settings.movieCardSize = payload.movieCardSize;
            if (payload.seriesCardSize) catalog.settings.seriesCardSize = payload.seriesCardSize;
            if (payload.songCardSize) catalog.settings.songCardSize = payload.songCardSize;

            await writeCatalog(catalog);
            sendJson(response, 200, { success: true, settings: catalog.settings });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/delete") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const { id } = payload;
            if (!id) {
                sendError(response, 400, "Item ID is required.");
                return;
            }

            const catalog = await readCatalog();
            let deleted = false;

            if (Array.isArray(catalog.items)) {
                const index = catalog.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    catalog.items.splice(index, 1);
                    deleted = true;
                }
            }

            if (!deleted && Array.isArray(catalog.comingSoon)) {
                const index = catalog.comingSoon.findIndex(item => item.id === id);
                if (index !== -1) {
                    catalog.comingSoon.splice(index, 1);
                    deleted = true;
                }
            }

            if (!deleted && Array.isArray(catalog.heroSlides)) {
                const index = catalog.heroSlides.findIndex(item => item.id === id);
                if (index !== -1) {
                    catalog.heroSlides.splice(index, 1);
                    // Re-index positions
                    catalog.heroSlides.forEach((s, i) => { s.position = i; });
                    deleted = true;
                }
            }

            if (!deleted) {
                sendError(response, 404, "Item not found in catalog.");
                return;
            }

            await writeCatalog(catalog);
            sendJson(response, 200, { success: true });
            return;
        }

        if (request.method === "POST" && pathname === "/api/admin/update") {
            if (!isAdminRequest(request, configuration)) {
                sendError(response, 401, "Admin access is required.");
                return;
            }

            const payload = await readRequestJson(request);
            const { id, title, description, poster, video } = payload;

            if (!id) {
                sendError(response, 400, "Item ID is required.");
                return;
            }

            const catalog = await readCatalog();
            let updated = false;

            // Search in items
            if (Array.isArray(catalog.items)) {
                const item = catalog.items.find(i => i.id === id);
                if (item) {
                    if (title !== undefined) item.title = title;
                    if (description !== undefined) item.description = description;
                    if (poster !== undefined) item.poster = poster;
                    // For library items, video isn't as simple, but we can update media.streamUrl if direct
                    if (video !== undefined && item.media && item.media.provider === "direct") {
                        item.media.streamUrl = video;
                        item.media.downloadUrl = video;
                    }
                    updated = true;
                }
            }

            // Search in comingSoon
            if (!updated && Array.isArray(catalog.comingSoon)) {
                const item = catalog.comingSoon.find(i => i.id === id);
                if (item) {
                    if (title !== undefined) item.title = title;
                    if (description !== undefined) item.description = description;
                    if (poster !== undefined) item.poster = poster;
                    if (video !== undefined) item.video = video;
                    updated = true;
                }
            }

            // Search in heroSlides
            if (!updated && Array.isArray(catalog.heroSlides)) {
                const item = catalog.heroSlides.find(i => i.id === id);
                if (item) {
                    if (title !== undefined) item.title = title;
                    if (description !== undefined) item.description = description;
                    if (poster !== undefined) item.poster = poster;
                    if (video !== undefined) item.video = video;
                    updated = true;
                }
            }

            if (!updated) {
                sendError(response, 404, "Item not found in catalog.");
                return;
            }

            await writeCatalog(catalog);
            sendJson(response, 200, { success: true });
            return;
        }

        if (request.method === "GET" || request.method === "HEAD") {
            await serveStaticFile(response, pathname);
            return;
        }

        sendError(response, 405, "Method not allowed.");
    } catch (error) {
        console.error(error);
        sendError(response, 500, error.message || "Unexpected server error.");
    }
});

// Video uploads may take much longer than Node's default five-minute request limit.
server.requestTimeout = 0;
server.timeout = 0;

server.listen(PORT, async () => {
    console.log(`WebMovies is running at http://localhost:${PORT}`);
    // Ensure demo Coming Soon items exist for first-time users
    try {
        const configuration = await getConfiguration();
        const catalog = await readCatalog();
        if (!Array.isArray(catalog.comingSoon) || catalog.comingSoon.length === 0) {
            catalog.comingSoon = [];
            // Demo Movie
            try {
                const movie = await findTmdbMatch("Inception", "movie", configuration);
                if (movie) {
                    catalog.comingSoon.push({
                        id: makeId("cs", Date.now()),
                        title: movie.title,
                        type: "movie",
                        poster: posterUrl(movie.poster_path),
                        video: "",
                        description: movie.overview || "Coming soon movie.",
                        seriesId: ""
                    });
                }
            } catch (demoError) {
                console.warn("Demo Coming Soon movie lookup failed:", demoError.message);
            }
            // Demo Season for Breaking Bad (if present)
            const seriesItem = (catalog.items || []).find(
                item => item.id === "breaking-bad" || slugify(item.title || "") === "breaking-bad"
            );
            if (seriesItem) {
                catalog.comingSoon.push({
                    id: makeId("cs", Date.now() + 1),
                    title: "Season 6",
                    type: "season",
                    poster: seriesItem.poster || "",
                    video: "",
                    description: "The next season is on its way.",
                    seriesId: seriesItem.id
                });
            }
            await writeCatalog(catalog);
            console.log('Demo Coming Soon items added.');
        }
    } catch (e) {
        console.warn('Failed to add demo Coming Soon items:', e.message);
    }
});
