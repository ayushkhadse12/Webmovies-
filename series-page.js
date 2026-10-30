/* =========================================================
   SERIES PAGE CLIENT SCRIPT
   Reads ?id= from URL, fetches catalog, renders series details
   ========================================================= */

(function () {
    "use strict";

    /* ── helpers ────────────────────────────────────────── */
    function esc(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function $id(id) { return document.getElementById(id); }

    /* ── read URL param ─────────────────────────────────── */
    const params = new URLSearchParams(window.location.search);
    // support both ?id= (new) and ?seriesId= (legacy)
    const SERIES_ID = params.get("id") || params.get("seriesId") || "";

    // Track series page view
    try {
        fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "view", page: window.location.pathname + window.location.search })
        }).catch(() => {});
    } catch (_) {}


    /* ── DOM refs ───────────────────────────────────────── */
    const posterImg        = $id("seriesPoster");
    const heroVideo        = $id("seriesHeroVideo");
    const soundBtn         = $id("seriesSoundButton");
    const heroImageDiv     = $id("seriesHeroImage");
    const titleEl          = $id("seriesTitle");
    const typeEl           = $id("seriesType");
    const metaEl           = $id("seriesMeta");
    const descEl           = $id("seriesDescription");
    const seasonSelect     = $id("seasonSelect");
    const episodesGrid     = $id("episodesGrid");

    /* ── sound toggle ───────────────────────────────────── */
    let muted = true;
    if (soundBtn && heroVideo) {
        soundBtn.addEventListener("click", () => {
            muted = !muted;
            heroVideo.muted = muted;
            soundBtn.textContent = muted ? "🔇" : "🔊";
        });
    }

    /* ── open player for an episode ─────────────────────── */
    function openEpisodePlayer(episode, seriesItem) {
        const mediaUrl = episode.playbackUrl || "";
        if (!mediaUrl) { alert("No video available for this episode."); return; }

        const playerData = {
            id: episode.id || episode.title,
            title: `${seriesItem.title} – ${episode.title}`,
            type: "Episode",
            year: seriesItem.year || "",
            rating: episode.rating || seriesItem.rating || "",
            description: episode.description || "",
            poster: episode.poster || seriesItem.poster || "",
            video: mediaUrl,
            download: mediaUrl,
            parts: 1
        };

        const playerUrl = new URL("player/player.html", window.location.href);
        playerUrl.searchParams.set("data", JSON.stringify(playerData));
        window.location.href = playerUrl.href;
    }

    /* ── render episodes for a season ───────────────────── */
    function renderEpisodes(season, seriesItem) {
        if (!episodesGrid) return;
        episodesGrid.innerHTML = "";

        const episodes = season.episodes || [];
        if (!episodes.length) {
            episodesGrid.innerHTML = "<p style='color:rgba(255,255,255,0.4);padding:2rem 0'>No episodes yet.</p>";
            return;
        }

        episodes.forEach(ep => {
            const card = document.createElement("div");
            card.className = "episode-card";

            const thumb = ep.poster || seriesItem.backdrop || seriesItem.poster || "";
            const hasPlayback = Boolean(ep.playbackUrl);

            card.innerHTML = `
                <div class="episode-thumbnail">
                    <img src="${esc(thumb)}" alt="${esc(ep.title)}" loading="lazy">
                    <span class="episode-number">EP ${ep.number || ""}</span>
                    ${hasPlayback ? `<button class="episode-play" aria-label="Play ${esc(ep.title)}">▶</button>` : ""}
                </div>
                <div class="episode-info">
                    <h3>${esc(ep.title)}</h3>
                    <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.5;margin-top:6px;">${esc(ep.description || "")}</p>
                    ${ep.duration ? `<span style="color:rgba(255,255,255,0.35);font-size:13px;margin-top:6px;display:block;">${esc(ep.duration)}</span>` : ""}
                </div>
            `;

            card.addEventListener("click", () => {
                if (ep.playbackUrl) openEpisodePlayer(ep, seriesItem);
            });

            const playBtn = card.querySelector(".episode-play");
            if (playBtn) {
                playBtn.addEventListener("click", e => {
                    e.stopPropagation();
                    openEpisodePlayer(ep, seriesItem);
                });
            }

            episodesGrid.appendChild(card);
        });
    }

    /* ── main: fetch catalog & render ───────────────────── */
    async function loadSeriesPage() {
        if (!SERIES_ID) {
            if (titleEl) titleEl.textContent = "Series not found";
            return;
        }

        let catalog;
        try {
            const res = await fetch("/api/catalog", { cache: "no-store" });
            if (!res.ok) throw new Error("Catalog unavailable");
            catalog = await res.json();
        } catch (err) {
            if (titleEl) titleEl.textContent = "Could not load series.";
            return;
        }

        const items = catalog.items || [];
        const raw = items.find(i => i.id === SERIES_ID);

        if (!raw) {
            if (titleEl) titleEl.textContent = "Series not found";
            return;
        }

        /* ── map episode media to playback URLs ─────────── */
        const seasons = (raw.seasons || []).map(season => ({
            ...season,
            episodes: (season.episodes || []).map(ep => {
                const directUrl = (ep.media && (ep.media.streamUrl || ep.media.url || ep.media.downloadUrl)) || "";
                const isDrive = directUrl.includes("drive.google.com") || /^[a-zA-Z0-9_-]{20,}$/.test(directUrl.trim());
                return {
                    ...ep,
                    playbackUrl: (isDrive && directUrl)
                        ? directUrl
                        : (ep.playbackAvailable
                            ? `/api/media/${encodeURIComponent(ep.id)}`
                            : directUrl)
                };
            })
        }));

        /* Expose for openEpisodePlayer */
        const seriesItem = { ...raw, seasons };

        /* ── hero ────────────────────────────────────────── */
        document.title = `${raw.title} – WebMovies`;

        if (titleEl) titleEl.textContent = raw.title;
        if (typeEl) typeEl.textContent = "WEB SERIES";

        if (metaEl) {
            const totalSeasons = seasons.length;
            metaEl.innerHTML = `
                ${raw.rating ? `<span>★ ${esc(raw.rating)}</span>` : ""}
                ${raw.year ? `<span>${esc(raw.year)}</span>` : ""}
                ${totalSeasons ? `<span>${totalSeasons} Season${totalSeasons !== 1 ? "s" : ""}</span>` : ""}
            `;
        }

        if (descEl) descEl.textContent = raw.description || "";

        /* poster / video */
        const posterSrc = raw.backdrop || raw.poster || "";
        if (posterImg) {
            posterImg.src = posterSrc;
            posterImg.alt = raw.title;
        }

        /* hero preview video — use first episode's stream if available */
        let heroVideoUrl = raw.trailerUrl || raw.video || raw.clip || "";
        if (!heroVideoUrl && seasons[0] && seasons[0].episodes[0]) {
            heroVideoUrl = seasons[0].episodes[0].playbackUrl || "";
        }

        if (heroVideo && heroVideoUrl) {
            heroVideo.src = heroVideoUrl;
            heroVideo.muted = true;
            heroVideo.load();
            heroImageDiv && heroImageDiv.classList.add("has-video");
        }

        /* ── season selector ─────────────────────────────── */
        if (seasonSelect) {
            seasonSelect.innerHTML = "";
            seasons.forEach((season, idx) => {
                const opt = document.createElement("option");
                opt.value = idx;
                opt.textContent = season.title || `Season ${season.number || idx + 1}`;
                seasonSelect.appendChild(opt);
            });

            const showSeason = idx => {
                if (seasons[idx]) renderEpisodes(seasons[idx], seriesItem);
            };

            seasonSelect.addEventListener("change", () => showSeason(Number(seasonSelect.value)));
            showSeason(0);
        }

        /* ── coming soon season section ──────────────────── */
        const csSection = $id("seriesComingSoonSection");
        if (csSection) {
            // Find a coming-soon season linked to this series
            const comingSoon = catalog.comingSoon || [];
            const csSeason = comingSoon.find(
                cs => cs.type === "season" && cs.seriesId === SERIES_ID
            );

            if (csSeason) {
                csSection.style.display = "";

                const csPoster = $id("csSeasonPoster");
                const csVideo  = $id("csSeasonVideo");
                const csInfo   = $id("csSeasonPosterInfo");
                const csTitleEl = $id("csSeasonPosterTitle");
                const csDescEl  = $id("csSeasonPosterDesc");
                const csVideoInfo = $id("csSeasonVideoInfo");
                const csVideoTitle = $id("csSeasonTitle");
                const csVideoDesc  = $id("csSeasonDescription");

                if (csTitleEl) csTitleEl.textContent = csSeason.title || "Coming Soon";
                if (csDescEl) csDescEl.textContent = csSeason.description || "";
                if (csVideoTitle) csVideoTitle.textContent = csSeason.title || "Coming Soon";
                if (csVideoDesc) csVideoDesc.textContent = csSeason.description || "";

                const csContainer = $id("csSeasonContainer");
                if (csContainer && csSeason.containerSize) {
                    csContainer.className = "cs-size-" + csSeason.containerSize;
                }

                const csIframe = $id("csSeasonIframe");
                const csSoundBtn = $id("csSeasonSoundButton");

                if (csSeason.video) {
                    const isDrive = csSeason.video.includes("drive.google.com") || /^[a-zA-Z0-9_-]{20,}$/.test(csSeason.video.trim());
                    if (isDrive && csIframe) {
                        if (csPoster) csPoster.style.display = "none";
                        if (csVideo) csVideo.style.display = "none";
                        let fileId = csSeason.video.trim();
                        const m = fileId.match(/[?&]id=([a-zA-Z0-9_-]+)/) || fileId.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (m) fileId = m[1];
                        csIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
                        csIframe.style.display = "block";
                        if (csVideoInfo) csVideoInfo.style.display = "";
                        if (csSoundBtn) csSoundBtn.style.display = "none";
                    } else if (csVideo) {
                        if (csPoster) csPoster.style.display = "none";
                        if (csIframe) csIframe.style.display = "none";
                        csVideo.style.display = "block";
                        csVideo.src = csSeason.video;
                        csVideo.loop = true;
                        csVideo.muted = true;
                        csVideo.load();
                        csVideo.play().catch(() => {});
                        if (csVideoInfo) csVideoInfo.style.display = "";
                        if (csSoundBtn) {
                            csSoundBtn.style.display = "flex";
                            let csMuted = true;
                            csSoundBtn.onclick = () => {
                                csMuted = !csMuted;
                                csVideo.muted = csMuted;
                                csSoundBtn.textContent = csMuted ? "🔇" : "🔊";
                            };
                        }
                    }
                } else if (csSeason.poster && csPoster) {
                    if (csVideo) csVideo.style.display = "none";
                    if (csIframe) csIframe.style.display = "none";
                    if (csSoundBtn) csSoundBtn.style.display = "none";
                    csPoster.src = csSeason.poster;
                    csPoster.style.display = "block";
                    if (csInfo) csInfo.style.display = "";
                }
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadSeriesPage);
    } else {
        loadSeriesPage();
    }

})();
