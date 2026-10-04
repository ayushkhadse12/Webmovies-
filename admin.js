"use strict";

/* â”€â”€â”€ LOGIN GATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const loginGate = document.getElementById("loginGate");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const loginToken = document.getElementById("loginToken");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");
const toggleEye = document.getElementById("toggleLoginToken");

// Restore session if previously authenticated
const savedToken = sessionStorage.getItem("webmovies-admin-token");
if (savedToken) {
    verifyToken(savedToken).then(valid => {
        if (valid) {
            showPanel(savedToken);
        } else {
            sessionStorage.removeItem("webmovies-admin-token");
        }
    });
}

// Toggle password visibility
toggleEye.addEventListener("click", () => {
    const show = loginToken.type === "password";
    loginToken.type = show ? "text" : "password";
    toggleEye.setAttribute("aria-label", show ? "Hide token" : "Show token");
    document.getElementById("eyeIcon").innerHTML = show
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
           a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8
           a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>`;
});

async function verifyToken(token) {
    const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token }
    });

    if (response.status === 401 || response.status === 403) {
        return false;
    }

    if (!response.ok) {
        throw new Error("Server error. Make sure the server is running.");
    }

    const result = await response.json();
    return Boolean(result.ok);
}

loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const token = loginToken.value.trim();
    if (!token) {
        showLoginError("Please enter your admin token.");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Verifyingâ€¦";
    loginMessage.textContent = "";
    loginMessage.className = "login-message";

    try {
        const valid = await verifyToken(token);
        if (!valid) {
            throw new Error("Invalid token. Please check your ADMIN_TOKEN in the .env file.");
        }

        sessionStorage.setItem("webmovies-admin-token", token);
        showPanel(token);

    } catch (err) {
        if (err instanceof TypeError || err.message.includes("Failed to fetch")) {
            showLoginError("Cannot reach the server. Start it with: node server.js");
        } else {
            showLoginError(err.message);
        }
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Unlock Admin Panel";
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("webmovies-admin-token");
    adminPanel.classList.remove("visible");
    loginGate.style.display = "";
    loginToken.value = "";
    loginMessage.textContent = "";
    loginMessage.className = "login-message";
});

function showPanel(token) {
    loginGate.style.display = "none";
    adminPanel.classList.add("visible");
    window._adminToken = token;
    showDashboard();
    loadManageCatalog();
}

function showLoginError(msg) {
    loginMessage.textContent = msg;
    loginMessage.className = "login-message error";
    loginToken.focus();
    loginToken.select();
}

/* â”€â”€â”€ DASHBOARD NAVIGATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const dashHome = document.getElementById("dashHome");
const sectionPages = document.querySelectorAll(".section-page");

function showDashboard() {
    sectionPages.forEach(s => s.classList.remove("active"));
    dashHome.style.display = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSection(sectionId) {
    dashHome.style.display = "none";
    sectionPages.forEach(s => s.classList.remove("active"));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Dashboard card clicks â†’ open section
document.querySelectorAll(".dash-card").forEach(card => {
    card.addEventListener("click", () => {
        const sectionId = card.dataset.section;
        if (sectionId) showSection(sectionId);
    });
});

// Back buttons â†’ go back to dashboard
document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => showDashboard());
});

/* â”€â”€â”€ LOAD CATALOG & STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function loadManageCatalog() {
    const container = document.getElementById("manageList");
    if (!container) return;

    try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load catalog.");

        const catalog = await response.json();
        const items = catalog.items || [];
        const comingSoon = catalog.comingSoon || [];
        const heroSlides = catalog.heroSlides || [];
        const settings = catalog.settings || {};

        // Filter lists
        const moviesList = items.filter(i => i.kind === "movie" || i.kind === "Movie" || (!i.kind && i.type === "Movie"));
        const seriesList = items.filter(i => i.kind === "series" || i.kind === "Series" || (!i.kind && i.type === "Web Series"));
        const songsList = items.filter(i => i.kind === "song" || i.kind === "Song" || (!i.kind && i.type === "Song"));

        const statMovies = document.getElementById("statMovies");
        const statSeries = document.getElementById("statSeries");
        const statCS = document.getElementById("statCS");
        const statHero = document.getElementById("statHero");
        if (statMovies) statMovies.textContent = moviesList.length;
        if (statSeries) statSeries.textContent = seriesList.length;
        if (statCS) statCS.textContent = comingSoon.length;
        if (statHero) statHero.textContent = heroSlides.length;

        // Populate card size settings
        const csInput = document.getElementById("csCardSizeInput");
        const seasonCsInput = document.getElementById("seasonCsCardSizeInput");
        const movieInput = document.getElementById("movieCardSizeInput");
        const seriesInput = document.getElementById("seriesCardSizeInput");
        const songInput = document.getElementById("songCardSizeInput");
        if (csInput && settings.csCardSize) csInput.value = settings.csCardSize;
        if (seasonCsInput && settings.seasonCsCardSize) seasonCsInput.value = settings.seasonCsCardSize;
        if (movieInput && settings.movieCardSize) movieInput.value = settings.movieCardSize;
        if (seriesInput && settings.seriesCardSize) seriesInput.value = settings.seriesCardSize;
        if (songInput && settings.songCardSize) songInput.value = settings.songCardSize;

        if (items.length === 0 && comingSoon.length === 0 && heroSlides.length === 0) {
            container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 20px;">No items in the catalog yet.</p>`;
            return;
        }

        let html = "";

        // Render Coming Soon
        if (comingSoon.length > 0) {
            html += `<h3 class="manage-section-title">Coming Soon (${comingSoon.length})</h3>`;
            comingSoon.forEach((item, index) => {
                const isFirst = index === 0;
                const isLast = index === comingSoon.length - 1;
                const poster = item.poster || "https://placehold.co/100x150/170d12/ff1744?text=CS";
                html += `
                    <div class="manage-item" id="manage-item-${item.id}">
                        <img class="manage-thumb" src="${poster}" alt="${escapeHtml(item.title)}">
                        <div class="manage-info">
                            <span class="manage-badge badge-cs">COMING SOON</span>
                            <div class="manage-title">${escapeHtml(item.title)}</div>
                            <div class="manage-sub">${escapeHtml(item.type || 'Media')} ${item.video ? '• Video attached' : ''}</div>
                        </div>
                        <div class="manage-actions" style="display: flex; gap: 8px; align-items: center;">
                            <button class="move-up-btn arrow-btn" type="button" data-id="${escapeHtml(item.id)}" data-type="coming-soon" ${isFirst ? "disabled" : ""}>↑</button>
                            <button class="move-down-btn arrow-btn" type="button" data-id="${escapeHtml(item.id)}" data-type="coming-soon" ${isLast ? "disabled" : ""}>↓</button>
                            <button class="edit-btn delete-btn" style="border-color: rgba(68,138,255,0.4); background: rgba(68,138,255,0.1); color: #82b1ff;" type="button" data-id="${escapeHtml(item.id)}">Edit</button>
                            <button class="delete-btn" type="button" data-id="${escapeHtml(item.id)}">Delete</button>
                        </div>
                    </div>
                `;
            });
        }

        // Render Hero Slides
        if (heroSlides.length > 0) {
            html += `<h3 class="manage-section-title">Custom Hero Posters (${heroSlides.length})</h3>`;
            heroSlides.forEach((item, index) => {
                const poster = item.poster || "https://placehold.co/100x150/170d12/ff1744?text=HERO";
                const isFirst = index === 0;
                const isLast = index === heroSlides.length - 1;
                html += `
                    <div class="manage-item" id="manage-item-${item.id}">
                        <img class="manage-thumb" src="${poster}" alt="${escapeHtml(item.title)}">
                        <div class="manage-info">
                            <span class="manage-badge badge-hero">HERO POSTER (Pos: ${item.position})</span>
                            <div class="manage-title">${escapeHtml(item.title)}</div>
                            <div class="manage-sub">${item.video ? 'Video attached' : 'Static poster'} ${item.year ? '• ' + item.year : ''}</div>
                        </div>
                        <div class="manage-actions" style="display: flex; gap: 8px; align-items: center;">
                            <button class="move-up-btn arrow-btn" type="button" data-id="${escapeHtml(item.id)}" data-type="hero" ${isFirst ? "disabled" : ""}>↑</button>
                            <button class="move-down-btn arrow-btn" type="button" data-id="${escapeHtml(item.id)}" data-type="hero" ${isLast ? "disabled" : ""}>↓</button>
                            <button class="edit-btn delete-btn" style="border-color: rgba(68,138,255,0.4); background: rgba(68,138,255,0.1); color: #82b1ff;" type="button" data-id="${escapeHtml(item.id)}">Edit</button>
                           <button class="delete-btn" type="button" data-id="${escapeHtml(item.id)}">Delete</button>
                        </div>
                    </div>
                `;
            });
        }

        const renderCatalogList = (list, sectionTitle, badgeText, badgeClass) => {
            if (list.length === 0) return;
            html += `<h3 class="manage-section-title">${sectionTitle} (${list.length})</h3>`;
            list.forEach((item, index) => {
                const poster = item.poster || "https://placehold.co/100x150/170d12/ff1744?text=Media";
                const isFirst = index === 0;
                const isLast = index === list.length - 1;
                const subtitle = item.kind === 'song' ? (item.artist || '') : (item.year ? item.year : '');
                html += `
                    <div class="manage-item" id="manage-item-${item.id}">
                        <img class="manage-thumb" src="${poster}" alt="${escapeHtml(item.title)}">
                        <div class="manage-info">
                            <span class="manage-badge ${badgeClass}">${badgeText}</span>
                            <div class="manage-title">${escapeHtml(item.title)}</div>
                            <div class="manage-sub">${subtitle} ${item.rating ? '• ★ ' + item.rating : ''}</div>
                        </div>
                       <div class="manage-actions" style="display: flex; gap: 8px; align-items: center;">
                           <button class="toggle-home-btn delete-btn" style="border-color: ${item.showOnHome !== false ? '#66dc9e' : '#ff879f'}; background: ${item.showOnHome !== false ? 'rgba(102,220,158,0.1)' : 'rgba(255,135,159,0.1)'}; color: ${item.showOnHome !== false ? '#66dc9e' : '#ff879f'}; padding: 5px 10px;" data-id="${escapeHtml(item.id)}">
                               ${item.showOnHome !== false ? '👁 Active' : '👁 Hidden'}
                           </button>
                           <button class="move-up-btn arrow-btn" type="button" data-id="${escapeHtml(item.id)}" data-type="catalog" ${isFirst ? "disabled" : ""}>↑</button>
                           <button class="move-down-btn arrow-btn" type="button" data-id="${escapeHtml(item.id)}" data-type="catalog" ${isLast ? "disabled" : ""}>↓</button>
                           <button class="edit-btn delete-btn" style="border-color: rgba(68,138,255,0.4); background: rgba(68,138,255,0.1); color: #82b1ff;" type="button" data-id="${escapeHtml(item.id)}">Edit</button>
                           <button class="delete-btn" type="button" data-id="${escapeHtml(item.id)}">Delete</button>
                       </div>
                    </div>
                `;
            });
        };

        renderCatalogList(moviesList, "Movies", "Movie", "badge-catalog");
        renderCatalogList(seriesList, "Web Series", "Web Series", "badge-catalog");
        renderCatalogList(songsList, "Songs", "Song", "badge-catalog");

        container.innerHTML = html;

        // Event listeners binding
        const allManageItems = [...items, ...comingSoon, ...heroSlides];
        container.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", () => {
                const item = allManageItems.find(i => i.id === button.dataset.id);
                if (item) openEditModal(item);
            });
        });

        container.querySelectorAll(".delete-btn:not(.edit-btn):not(.toggle-home-btn)").forEach(button => {
            button.addEventListener("click", () => {
                if (button.dataset.id) {
                    deleteCatalogItem(button.dataset.id);
                }
            });
        });

        container.querySelectorAll(".toggle-home-btn").forEach(button => {
            button.addEventListener("click", () => {
                toggleHomeDisplay(button.dataset.id);
            });
        });

        container.querySelectorAll(".move-up-btn").forEach(button => {
            if (!button.disabled) {
                button.addEventListener("click", () => {
                    reorderItem(button.dataset.id, "up", button.dataset.type);
                });
            }
        });

        container.querySelectorAll(".move-down-btn").forEach(button => {
            if (!button.disabled) {
                button.addEventListener("click", () => {
                    reorderItem(button.dataset.id, "down", button.dataset.type);
                });
            }
        });

    } catch (err) {
        container.innerHTML = `<p style="color: #ff879f; text-align: center;">${err.message}</p>`;
    }
}

async function deleteCatalogItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) {
        return;
    }

    const token = window._adminToken || "";
    if (!token) return alert("Not authenticated.");

    try {
        const response = await fetch("/api/admin/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Token": token
            },
            body: JSON.stringify({ id })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not delete item.");
        }

        loadManageCatalog();

    } catch (err) {
        alert("Error: " + err.message);
    }
}

async function toggleHomeDisplay(id) {
    const token = window._adminToken || "";
    if (!token) return alert("Not authenticated.");

    try {
        const res = await fetch("/api/admin/toggle-home", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Token": token
            },
            body: JSON.stringify({ id })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Toggle failed.");

        loadManageCatalog();

    } catch (err) {
        alert("Error: " + err.message);
    }
}

async function reorderItem(id, direction, type) {
    const token = window._adminToken || "";
    if (!token) return alert("Not authenticated.");

    try {
        const res = await fetch("/api/admin/reorder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Token": token
            },
            body: JSON.stringify({ id, direction, type })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reorder failed.");

        loadManageCatalog();

    } catch (err) {
        alert("Error: " + err.message);
    }
}

/* â”€â”€â”€ IMPORT FORM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const importForm = document.getElementById("importForm");
const importButton = document.getElementById("importButton");
const formMessage = document.getElementById("formMessage");
const mediaKind = document.getElementById("mediaKind");
const mediaProvider = document.getElementById("mediaProvider");
const movieMediaFields = document.getElementById("movieMediaFields");
const seriesMediaFields = document.getElementById("seriesMediaFields");
const teraBoxPathField = document.getElementById("teraBoxPathField");
const directUrlField = document.getElementById("directUrlField");
const localFileField = document.getElementById("localFileField");
const localFileHelp = document.getElementById("localFileHelp");

function setMessage(message, type = "") {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

function updateMediaFields() {
    const isSeries = mediaKind.value === "series";
    const usesTeraBox = mediaProvider.value === "terabox";
    const usesDirectUrl = mediaProvider.value === "direct";
    const usesLocalFile = mediaProvider.value === "local";

    movieMediaFields.hidden = isSeries;
    seriesMediaFields.hidden = !isSeries;
    teraBoxPathField.hidden = !usesTeraBox;
    directUrlField.hidden = !usesDirectUrl;
    localFileField.hidden = !usesLocalFile;
    localFileHelp.hidden = !usesLocalFile;
}

function getMovieMedia() {
    if (mediaProvider.value === "terabox") {
        const path = document.getElementById("teraBoxPath").value.trim();
        return path ? { provider: "terabox", path } : {};
    }
    const streamUrl = document.getElementById("directUrl").value.trim();
    return streamUrl ? { provider: "direct", streamUrl, downloadUrl: streamUrl } : {};
}

async function uploadLocalMovie() {
    const file = document.getElementById("localFile").files[0];
    if (!file) throw new Error("Choose a video file to upload.");

    const chunkSize = 16 * 1024 * 1024;
    const uploadId = crypto.randomUUID();
    let uploadedBytes = 0;
    let completedMedia = null;

    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
        setMessage(`Uploading "${file.name}"... ${Math.round((uploadedBytes / file.size) * 100)}%`);

        let response;
        try {
            response = await fetch(`/api/admin/upload-video?filename=${encodeURIComponent(file.name)}&uploadId=${uploadId}&offset=${offset}&total=${file.size}`, {
                method: "POST",
                headers: {
                    "Content-Type": file.type || "application/octet-stream",
                    "X-Admin-Token": window._adminToken || ""
                },
                body: chunk
            });
        } catch (error) {
            throw new Error(`Video upload failed near ${Math.round((offset / file.size) * 100)}%: ${error.message}.`);
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "The video upload failed.");
        uploadedBytes = result.received || uploadedBytes + chunk.size;
        completedMedia = result.media || completedMedia;
    }

    setMessage(`Uploading "${file.name}"... 100%`);
    if (!completedMedia) throw new Error("The upload did not finish correctly.");
    return completedMedia;
}

function getEpisodeMedia() {
    const input = document.getElementById("episodeMedia").value.trim();
    if (!input) return {};
    try {
        return JSON.parse(input);
    } catch {
        throw new Error("Episode media map must be valid JSON.");
    }
}

mediaKind.addEventListener("change", updateMediaFields);
mediaProvider.addEventListener("change", updateMediaFields);
updateMediaFields();

importForm.addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const token = window._adminToken || "";
        if (!token) throw new Error("Not authenticated. Please sign in first.");

        const kind = mediaKind.value;
        const tmdbId = document.getElementById("tmdbId").value.trim();
        const uploadedMedia = kind === "movie" && mediaProvider.value === "local"
            ? await uploadLocalMovie()
            : null;
        const payload = {
            kind,
            title: document.getElementById("title").value.trim(),
            tmdbId: tmdbId ? Number(tmdbId) : undefined,
            customPoster: document.getElementById("customPoster")?.value.trim() || "",
            media: uploadedMedia || (kind === "movie" ? getMovieMedia() : {}),
            episodeMedia: kind === "series" ? getEpisodeMedia() : {}
        };

        importButton.disabled = true;
        setMessage("Fetching metadata and saving the catalogâ€¦");

        let response;
        try {
            response = await fetch("/api/admin/import", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Admin-Token": token },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            throw new Error(`Catalog request failed: ${error.message}. Confirm that node server.js is running.`);
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "The title could not be added.");

        setMessage(`Added "${result.item.title}". Posters and details are now in the catalog.`, "success");
        loadManageCatalog();

    } catch (error) {
        setMessage(error.message, "error");
    } finally {
        importButton.disabled = false;
    }
});

/* â”€â”€â”€ COMING SOON FORM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const csForm = document.getElementById("comingSoonForm");
const csType = document.getElementById("csType");
const csSeriesIdField = document.getElementById("csSeriesIdField");

if (csForm) {
    csType.addEventListener("change", () => {
        csSeriesIdField.hidden = csType.value !== "season";
    });

    csForm.addEventListener("submit", async event => {
        event.preventDefault();

        const button = document.getElementById("csSubmitButton");
        const message = document.getElementById("csFormMessage");

        try {
            const token = window._adminToken || "";
            if (!token) throw new Error("Not authenticated. Please sign in first.");

            const payload = {
                type: csType.value,
                title: document.getElementById("csTitle").value.trim(),
                description: document.getElementById("csDescription").value.trim(),
                poster: document.getElementById("csPoster").value.trim(),
                video: document.getElementById("csVideo").value.trim(),
                seriesId: document.getElementById("csSeriesId").value.trim(),
                fetchTmdb: true
            };

            button.disabled = true;
            message.textContent = "Adding to coming soonâ€¦";
            message.className = "form-message";

            const response = await fetch("/api/admin/coming-soon", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Admin-Token": token },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not add entry.");

            const addedTitle = result.item ? result.item.title : payload.title;
            message.textContent = `Added "${addedTitle}" to Coming Soon! Poster/details auto-fetched from TMDB.`;
            message.className = "form-message success";
            loadManageCatalog();

        } catch (error) {
            message.textContent = error.message;
            message.className = "form-message error";
        } finally {
            button.disabled = false;
        }
    });
}

/* â”€â”€â”€ HERO SLIDE FORM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const heroSlideForm = document.getElementById("heroSlideForm");

if (heroSlideForm) {
    heroSlideForm.addEventListener("submit", async event => {
        event.preventDefault();

        const button = document.getElementById("heroSubmitButton");
        const message = document.getElementById("heroFormMessage");

        try {
            const token = window._adminToken || "";
            if (!token) throw new Error("Not authenticated. Please sign in first.");

            const positionVal = document.getElementById("heroPositionInput").value;
            const payload = {
                title: document.getElementById("heroTitleInput").value.trim(),
                description: document.getElementById("heroDescInput").value.trim(),
                poster: document.getElementById("heroPosterInput").value.trim(),
                video: document.getElementById("heroVideoInput").value.trim(),
                position: positionVal !== "" ? Number(positionVal) : undefined,
                fetchTmdb: true
            };

            button.disabled = true;
            message.textContent = "Adding hero posterâ€¦";
            message.className = "form-message";

            const response = await fetch("/api/admin/hero-slide", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Admin-Token": token },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not add hero slide.");

            const addedTitle = result.item ? result.item.title : payload.title;
            message.textContent = `Added hero banner for "${addedTitle}"!`;
            message.className = "form-message success";
            heroSlideForm.reset();
            loadManageCatalog();

        } catch (error) {
            message.textContent = error.message;
            message.className = "form-message error";
        } finally {
            button.disabled = false;
        }
    });
}

async function reorderHeroSlide(id, direction) {
    const token = window._adminToken || "";
    if (!token) return alert("Not authenticated.");

    try {
        const res = await fetch("/api/admin/hero-slide/reorder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Token": token
            },
            body: JSON.stringify({ id, direction })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reorder failed.");

        loadManageCatalog();

    } catch (err) {
        alert("Error: " + err.message);
    }
}

/* â”€â”€â”€ SETTINGS FORM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const settingsForm = document.getElementById("settingsForm");
if (settingsForm) {
    settingsForm.addEventListener("submit", async event => {
        event.preventDefault();

        const button = document.getElementById("settingsSubmitButton");
        const message = document.getElementById("settingsFormMessage");

        try {
            const token = window._adminToken || "";
            if (!token) throw new Error("Not authenticated. Please sign in first.");

            const payload = {
                movieCardSize: document.getElementById("movieCardSizeInput").value,
                seriesCardSize: document.getElementById("seriesCardSizeInput").value,
                songCardSize: document.getElementById("songCardSizeInput").value,
                csCardSize: document.getElementById("csCardSizeInput").value,
                seasonCsCardSize: document.getElementById("seasonCsCardSizeInput").value
            };

            button.disabled = true;
            message.textContent = "Saving settingsâ€¦";
            message.className = "form-message";

            const response = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Admin-Token": token },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not save settings.");

            message.textContent = "Settings saved successfully!";
            message.className = "form-message success";
            loadManageCatalog();

        } catch (error) {
            message.textContent = error.message;
            message.className = "form-message error";
        } finally {
            button.disabled = false;
        }
    });
}
function openEditModal(item) {
    const editModal = document.getElementById("editModal");
    const titleInput = document.getElementById("editTitle");
    const descInput = document.getElementById("editDescription");
    const posterInput = document.getElementById("editPoster");
    const videoInput = document.getElementById("editVideo");
    const idInput = document.getElementById("editItemId");
    const message = document.getElementById("editFormMessage");

    message.textContent = "";
    message.className = "form-message";

    idInput.value = item.id;
    titleInput.value = item.title || "";
    descInput.value = item.description || "";
    posterInput.value = item.poster || "";

    if (item.video) {
        videoInput.value = item.video;
    } else if (item.media && item.media.provider === "direct") {
        videoInput.value = item.media.streamUrl || "";
    } else {
        videoInput.value = "";
    }

    editModal.style.display = "flex";
}

document.getElementById("closeEditModal")?.addEventListener("click", () => {
    document.getElementById("editModal").style.display = "none";
});

document.getElementById("editForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = window._adminToken || "";
    if (!token) return alert("Not authenticated.");

    const id = document.getElementById("editItemId").value;
    const btn = document.getElementById("editSubmitBtn");
    const message = document.getElementById("editFormMessage");

    const payload = {
        id,
        title: document.getElementById("editTitle").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        poster: document.getElementById("editPoster").value.trim(),
        video: document.getElementById("editVideo").value.trim()
    };

    try {
        btn.disabled = true;
        message.textContent = "Saving changes...";
        message.className = "form-message";

        const res = await fetch("/api/admin/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Token": token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed.");

        message.textContent = "Changes saved!";
        message.className = "form-message success";
        setTimeout(() => {
            document.getElementById("editModal").style.display = "none";
            loadManageCatalog();
        }, 800);

    } catch (err) {
        message.textContent = err.message;
        message.className = "form-message error";
    } finally {
        btn.disabled = false;
    }
});




function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
