/* =========================================================
   WEBMOVIES
   COMPLETE JAVASCRIPT
========================================================= */

"use strict";

/* =========================================================
   DATA
========================================================= */

const movies = [
    {
        id: "avengers-endgame",
        title: "Avengers: Endgame",
        type: "Movie",
        year: "2019",
        rating: "8.4",
        description: "The Avengers make one final attempt to undo the devastation caused by Thanos.",
        poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: "3h 1m"
    },
    {
        id: "spider-man-brand-new-day",
        title: "Spider-Man: Brand New Day",
        type: "Movie",
        year: "2026",
        rating: "",
        description: "Peter Parker begins a new chapter as Spider-Man.",
        poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: ""
    },
    {
        id: "inception",
        title: "Inception",
        type: "Movie",
        year: "2010",
        rating: "8.8",
        description: "A skilled team enters the dreams of others to perform an impossible mission.",
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        duration: "2h 28m"
    },
    {
        id: "dark-knight",
        title: "The Dark Knight",
        type: "Movie",
        year: "2008",
        rating: "9.0",
        description: "Batman faces a criminal mastermind who throws Gotham into chaos.",
        poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: "2h 32m"
    }
];

const series = [
    {
        id: "breaking-bad",
        title: "Breaking Bad",
        type: "Web Series",
        year: "2008",
        rating: "9.5",
        description: "A chemistry teacher enters the dangerous world of manufacturing.",
        poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        seasons: 5
    },
    {
        id: "game-of-thrones",
        title: "Game of Thrones",
        type: "Web Series",
        year: "2011",
        rating: "9.2",
        description: "Powerful families fight for control of the Iron Throne.",
        poster: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        seasons: 8
    }
];

const songs = [
    {
        id: "song-1",
        title: "Kesariya",
        artist: "Arijit Singh",
        type: "Song",
        poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
        audio: ""
    },
    {
        id: "song-2",
        title: "Apna Bana Le",
        artist: "Arijit Singh",
        type: "Song",
        poster: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
        audio: ""
    }
];


/* =========================================================
   HERO SLIDES
========================================================= */

const defaultDemoHeroSlides = [
    {
        id: "hero-demo-inception",
        title: "Inception",
        type: "Movie",
        year: "2010",
        rating: "8.8",
        quality: "4K",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        playback: "",
        isComingSoon: false
    },
    {
        id: "hero-demo-dark-knight",
        title: "The Dark Knight",
        type: "Movie",
        year: "2008",
        rating: "9.0",
        quality: "HD",
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
        poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        playback: "",
        isComingSoon: false
    },
    {
        id: "hero-demo-avengers",
        title: "Avengers: Endgame",
        type: "Movie",
        year: "2019",
        rating: "8.4",
        quality: "4K",
        description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.",
        poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        playback: "",
        isComingSoon: false
    }
];

const heroSlides = [...defaultDemoHeroSlides];


/* =========================================================
   DOM
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   HERO ELEMENTS
========================================================= */

const heroTrack = document.getElementById("heroTrack");
const heroDots = $("#heroDots");
const heroMedia = document.querySelector("#heroSlider .hero-media");

const heroPrevious = $("#heroPrevious");
const heroNext = $("#heroNext");
const heroPlayButton = $("#heroPlayButton");
const heroSoundButton = $("#heroSoundButton");

const canHoverHero = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
);


let currentHeroIndex = 0;
let heroHoverTimer = null;
let heroMuted = true;
let heroPreviewStarted = false;
let heroAutoSlideTimer = null;
const HERO_AUTO_SLIDE_DELAY = 8000;

function initHeroTrack() {
    if (!heroTrack) return;
    heroTrack.innerHTML = "";
    
    heroSlides.forEach((item, index) => {
        const slide = document.createElement("div");
        slide.className = "hero-slide";
        slide.dataset.index = index;
        
        slide.innerHTML = `
            <img class="hero-poster" src="${item.poster}" alt="${escapeHtml(item.title)}">
            ${item.video ? `<video class="hero-video" src="${item.video}" muted playsinline preload="metadata"></video>` : ""}
            <div class="hero-gradient"></div>
            <div class="hero-content">
                <p class="hero-kicker">${item.isComingSoon ? 'COMING SOON' : 'FEATURED'}</p>
                <h1>${escapeHtml(item.title)}</h1>
                <div class="hero-meta">
                    ${item.rating ? `<span>★ ${item.rating}</span>` : ""}
                    ${item.year ? `<span>${item.year}</span>` : ""}
                    ${item.type ? `<span>${item.type}</span>` : ""}
                    ${item.quality ? `<span>${item.quality}</span>` : ""}
                </div>
                <p class="hero-description">${escapeHtml(item.description)}</p>
            </div>
        `;
        heroTrack.appendChild(slide);
    });
}

function renderHero(index) {
    if (!heroSlides.length) return;

    currentHeroIndex = (index + heroSlides.length) % heroSlides.length;

    // Slide track smoothly
    if (heroTrack) {
        heroTrack.style.transform = `translateX(-${currentHeroIndex * 100}%)`;
    }

    const item = heroSlides[currentHeroIndex];

    // Toggle play button
    if (heroPlayButton) {
        heroPlayButton.style.display = item.isComingSoon ? 'none' : '';
    }

    // Toggle sound button
    if (heroSoundButton) {
        heroSoundButton.style.display = item.video ? '' : 'none';
        heroSoundButton.textContent = heroMuted ? "🔇" : "🔊";
    }

    // Render dots
    if (heroDots) {
        heroDots.innerHTML = "";
        heroSlides.forEach((_, dotIndex) => {
            const dot = document.createElement("button");
            dot.className = "hero-dot" + (dotIndex === currentHeroIndex ? " active" : "");
            dot.setAttribute("aria-label", `Go to slide ${dotIndex + 1}`);
            dot.addEventListener("click", () => {
                stopHeroPreview();
                renderHero(dotIndex);
            });
            heroDots.appendChild(dot);
        });
    }

    // Stop previous video previews
    stopHeroPreview();

    // Auto-play Coming Soon video if present
    const slides = document.querySelectorAll(".hero-slide");
    const activeSlide = slides[currentHeroIndex];
    if (activeSlide) {
        const activeVideo = activeSlide.querySelector(".hero-video");
        if (activeVideo) {
            activeVideo.muted = heroMuted;
            if (item.isComingSoon) {
                const playPromise = activeVideo.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            heroPreviewStarted = true;
                            activeSlide.classList.add("preview-playing");
                        })
                        .catch(e => console.warn("Coming soon auto-play failed:", e));
                }

                // Slide immediately when video ends
                activeVideo.onended = () => {
                    nextHero();
                };
            }
        }
    }

    scheduleNextHeroSlide();
}

function scheduleNextHeroSlide() {
    clearTimeout(heroAutoSlideTimer);
    
    // Always schedule auto-slide after 8s fallback timer so slider NEVER stalls
    heroAutoSlideTimer = setTimeout(() => {
        nextHero();
    }, HERO_AUTO_SLIDE_DELAY);
}

function stopHeroAutoSlide() {
    clearTimeout(heroAutoSlideTimer);
    heroAutoSlideTimer = null;
}

function nextHero() {
    stopHeroPreview();
    renderHero(currentHeroIndex + 1);
}

function previousHero() {
    stopHeroPreview();
    renderHero(currentHeroIndex - 1);
}

if (heroNext) {
    heroNext.addEventListener("click", nextHero);
}

if (heroPrevious) {
    heroPrevious.addEventListener("click", previousHero);
}


/* =========================================================
   HERO HOVER VIDEO
========================================================= */

function startHeroPreview() {
    const item = heroSlides[currentHeroIndex];
    if (!item || item.isComingSoon) return;

    if (!item.video) return;

    const slides = document.querySelectorAll(".hero-slide");
    const activeSlide = slides[currentHeroIndex];
    if (!activeSlide) return;

    const activeVideo = activeSlide.querySelector(".hero-video");
    if (!activeVideo) return;

    activeVideo.currentTime = 0;
    activeVideo.muted = heroMuted;

    if (heroSoundButton) {
        heroSoundButton.style.display = "";
        heroSoundButton.textContent = heroMuted ? "🔇" : "🔊";
    }

    const playPromise = activeVideo.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                heroPreviewStarted = true;
                activeSlide.classList.add("preview-playing");
                if (heroMedia) {
                    heroMedia.classList.add("preview-playing");
                }
            })
            .catch((e) => {
                console.warn("Hero hover play failed:", e);
                heroPreviewStarted = false;
            });
    }
}

function stopHeroPreview() {
    clearTimeout(heroHoverTimer);
    heroPreviewStarted = false;

    if (heroMedia) {
        heroMedia.classList.remove("preview-playing");
    }

    const slides = document.querySelectorAll(".hero-slide");
    slides.forEach(slide => {
        slide.classList.remove("preview-playing");
        const video = slide.querySelector(".hero-video");
        if (video) {
            video.pause();
            video.onended = null;
        }
    });

    if (heroSoundButton) {
        const item = heroSlides[currentHeroIndex];
        if (item && !item.isComingSoon) {
            heroSoundButton.style.display = "none";
        }
    }
}


if (heroMedia) {
    heroMedia.addEventListener(
        "mouseenter",
        () => {
            stopHeroAutoSlide();
            heroHoverTimer = setTimeout(
                startHeroPreview,
                250
            );
        }
    );

    heroMedia.addEventListener(
        "mouseleave",
        () => {
            stopHeroPreview();
            scheduleNextHeroSlide();
        }
    );
}


/* =========================================================
   SOUND
========================================================= */

if (heroSoundButton) {
heroSoundButton.addEventListener(
    "click",
    (event) => {
        event.stopPropagation();

        const slides = document.querySelectorAll(".hero-slide");
        const activeSlide = slides[currentHeroIndex];
        if (!activeSlide) return;

        const activeVideo = activeSlide.querySelector(".hero-video");
        if (!activeVideo) return;

        if (!heroPreviewStarted && !heroSlides[currentHeroIndex].isComingSoon) {
            startHeroPreview();
            return;
        }

        heroMuted = !heroMuted;
        activeVideo.muted = heroMuted;
        heroSoundButton.textContent = heroMuted ? "🔇" : "🔊";
    }
);
}


/* =========================================================
HERO PLAY
========================================================= */
if (heroPlayButton) {
heroPlayButton.addEventListener(
    "click",
    () => {

        const item =
            heroSlides[currentHeroIndex];

        // Series → open the series page instead of the player
        if (item.type === "Web Series" && item.mediaId) {
            window.location.href = `series.html?id=${encodeURIComponent(item.mediaId)}`;
            return;
        }

        const playbackUrl =
            item.playback ||
            (item.playbackAvailable && item.id
                ? `/api/media/${encodeURIComponent(item.id)}`
                : "") ||
            item.video ||
            "";

        openPlayer(
            item.title,
            playbackUrl,
            item
        );

    }
);
}
/* =========================================================
   CARD CREATION
========================================================= */

function createMediaCard(item) {

    if (!item || !item.title) {
        return null;
    }

    const card =
        document.createElement("article");

    card.className =
        "media-card";


    const showDownloadButton = Boolean(item.download || item.video || item.audio);

    card.innerHTML = `

        <div class="media-card-image">

            <img
                src="${item.poster}"
                alt="${escapeHtml(item.title)}"
                loading="lazy"
            >

            <div class="card-overlay">

                ${showDownloadButton ? `
                    <button
                        class="card-download"
                        aria-label="Download ${escapeHtml(item.title)}"
                        title="Download"
                    >
                        ↓
                    </button>
                ` : ""}

                <button
                    class="card-play"
                    aria-label="Play ${escapeHtml(item.title)}"
                >
                    ▶
                </button>

            </div>

        </div>


        <div class="media-card-info">

            <div class="media-card-title">
                ${escapeHtml(item.title)}
            </div>

            <div class="media-card-subtitle">
                ${escapeHtml(item.subtitle || item.type || "")}
                ${!item.subtitle && item.year ? ` • ${item.year}` : ""}
            </div>

        </div>

    `;


    const playButton =
        card.querySelector(".card-play");


    playButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            openPlayer(
                item.title,
                item.video || item.audio || "",
                item
            );

        }
    );


    const downloadButton =
        card.querySelector(".card-download");

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();
                downloadMedia(item, downloadButton);
            }
        );

    }


    card.addEventListener(
        "click",
        () => {

            openPlayer(
                item.title,
                item.video || item.audio || "",
                item
            );

        }
    );


    return card;

}


async function downloadMedia(item, btnElement = null) {
    if (!window.auth.getToken()) {
        showAuthModal();
        return;
    }

    if (!item.id) {
        alert("This item cannot be downloaded (missing ID).");
        return;
    }

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = `<span class="dl-progress">0%</span>`;
    }

    try {
        const url = `/api/download/${encodeURIComponent(item.id)}`;
        const response = await window.auth.apiFetch(url);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        let loaded = 0;
        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            loaded += value.length;
            
            if (total && btnElement) {
                const percent = Math.round((loaded / total) * 100);
                btnElement.innerHTML = `<span class="dl-progress">${percent}%</span>`;
            }
        }

        const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' });
        const blobKey = `dl_${item.id}_${Date.now()}`;
        
        // Save to IndexedDB
        await window.db.saveFile(blobKey, blob);
        
        // Save metadata to server
        const meta = {
            downloadId: blobKey,
            title: item.title,
            poster: item.poster,
            size: blob.size,
            blobKey: blobKey,
            addedAt: Date.now()
        };
        await window.auth.apiFetch("/api/user/downloads/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meta)
        });

        if (btnElement) {
            btnElement.innerHTML = `✓`;
            btnElement.classList.add('dl-complete');
        }
        alert(`"${item.title}" has been downloaded for offline viewing.`);

    } catch (err) {
        console.error("Download failed:", err);
        alert(`Failed to download "${item.title}".`);
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = `↓`;
        }
    }
}


/* =========================================================
   RENDER HOME ROWS
========================================================= */

function formatTimeLeft(seconds) {

    if (!Number.isFinite(seconds) || seconds <= 0) {
        return "Almost done";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m left`;
    }

    return `${minutes}m left`;

}


function getContinueWatchingItems() {

    const libraryItems = [...movies, ...series];
    const entries = [];

    for (let index = 0; index < localStorage.length; index++) {

        const key = localStorage.key(index);

        if (!key || !key.startsWith("webmovies-progress-")) {
            continue;
        }

        let saved;

        try {
            saved = JSON.parse(localStorage.getItem(key));
        } catch {
            continue;
        }

        if (
            !saved ||
            typeof saved.position !== "number" ||
            typeof saved.duration !== "number"
        ) {
            continue;
        }

        if (saved.duration <= 0 || saved.position >= saved.duration * 0.95) {
            continue;
        }

        const mediaId = key.slice("webmovies-progress-".length);
        const item = libraryItems.find(entry => entry.id === mediaId);

        if (!item) {
            continue;
        }

        entries.push({
            ...item,
            subtitle: formatTimeLeft(saved.duration - saved.position),
            progress: Math.round((saved.position / saved.duration) * 100),
            updatedAt: saved.updatedAt || 0
        });

    }

    return entries
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6);

}


function renderRows() {

    const moviesRow =
        $("#moviesRow");

    const seriesRow =
        $("#seriesRow");

    const continueRow =
        $("#continueWatchingRow");

    const songsRow =
        $("#songsRow");

    if (!moviesRow || !seriesRow || !continueRow || !songsRow) {
        return;
    }



    moviesRow.innerHTML = "";
    seriesRow.innerHTML = "";
    continueRow.innerHTML = "";
    songsRow.innerHTML = "";


    movies
        .forEach(item => {

            const card = createMediaCard(item);
            if (card) {
                moviesRow.appendChild(card);
            }

        });


    series
        .forEach(item => {

            const card = createMediaCard(item);
            if (card) {
                seriesRow.appendChild(card);
            }

        });


    const continueItems = getContinueWatchingItems();

    continueItems
        .forEach(item => {

            const card =
                createMediaCard(item);

            if (!card) {
                return;
            }


            const info =
                card.querySelector(
                    ".media-card-info"
                );


            const progress =
                document.createElement("div");


            progress.className =
                "progress-bar";


            progress.innerHTML = `

                <div
                    class="progress-fill"
                    style="width:${item.progress}%"
                ></div>

            `;


            info.appendChild(progress);


            continueRow.appendChild(card);

        });


    const continueSection = continueRow.closest(".content-section");
    if (continueSection) {
        continueSection.hidden = continueItems.length === 0;
    }


    songs
        .forEach(song => {

            const card = createMediaCard({
                ...song,
                poster: song.poster,
                type: song.artist
            });

            if (card) {
                songsRow.appendChild(card);
            }

        });




}


/* =========================================================
   LIBRARY PAGES
========================================================= */

function renderLibraries() {

    const moviesLibrary = $("#moviesLibrary");
    const seriesLibrary = $("#seriesLibrary");
    const songsLibrary = $("#songsLibrary");
    const downloadsLibrary = $("#downloadsLibrary");

    if (!moviesLibrary && !seriesLibrary && !songsLibrary && !downloadsLibrary) {
        return;
    }

    if(moviesLibrary) moviesLibrary.innerHTML = "";
    if(seriesLibrary) seriesLibrary.innerHTML = "";
    if(songsLibrary) songsLibrary.innerHTML = "";
    if(downloadsLibrary) downloadsLibrary.innerHTML = "";

    movies.forEach(item => {
        if(moviesLibrary) moviesLibrary.appendChild(createMediaCard(item));
    });

    series.forEach(item => {
        if(seriesLibrary) seriesLibrary.appendChild(createMediaCard(item));
    });

    [...movies, ...series].filter(item => item.download).forEach(item => {
        if(downloadsLibrary) downloadsLibrary.appendChild(createMediaCard(item));
    });


    songs.forEach(song => {

        const row =
            document.createElement("div");

        row.className =
            "song-item";


        row.innerHTML = `

            <img
                class="song-cover"
                src="${song.poster}"
                alt="${escapeHtml(song.title)}"
            >

            <div class="song-details">

                <div class="song-title">
                    ${escapeHtml(song.title)}
                </div>

                <div class="song-artist">
                    ${escapeHtml(song.artist)}
                </div>

            </div>

            <button class="song-play">
                ▶
            </button>

        `;


        row.addEventListener(
            "click",
            () => {

                /*
                   Songs will later use the
                   custom music player.
                */

                if (song.audio) {

                    openPlayer(
                        song.title,
                        song.audio,
                        song
                    );

                } else {

                    alert(
                        `Audio file for "${song.title}" has not been added yet.`
                    );

                }

            }
        );


        songsLibrary.appendChild(row);

    });

}


/* =========================================================
   NAVIGATION
========================================================= */

const sections = {

    home: $("#homeSection"),
    movies: $("#moviesSection"),
    series: $("#seriesSection"),
    songs: $("#songsSection"),
    downloads: $("#downloadsSection")

};


$$(".nav-link").forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                switchSection(button.dataset.section);

            }
        );

    }
);


function switchSection(sectionName) {

    if (!sections[sectionName]) {
        return;
    }

    if (sectionName === "downloads") {
        if (!window.auth.getToken()) {
            showAuthModal();
            return;
        }
        if (typeof renderDownloadsLibrary === "function") {
            renderDownloadsLibrary();
        }
    }

    Object
        .values(sections)
        .forEach(
            item =>
                item.classList.remove(
                    "active-section"
                )
        );

    sections[sectionName].classList.add("active-section");

    $$(".nav-link").forEach(nav => {
        nav.classList.toggle(
            "active",
            nav.dataset.section === sectionName
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


const logo = $("#logo");

if (logo) {

    logo.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            switchSection("home");

        }
    );

}


$$(".see-all").forEach(button => {

    button.addEventListener(
        "click",
        () => {

            switchSection(button.dataset.section || "home");

        }
    );

});


/* =========================================================
   SEARCH
========================================================= */

const searchButton =
    $("#searchButton");

const searchPanel =
    $("#searchPanel");

const searchInput =
    $("#searchInput");

const closeSearch =
    $("#closeSearch");

const searchResults =
    $("#searchResults");


if (searchButton && searchPanel && searchInput && closeSearch && searchResults) {
    searchButton.addEventListener(
        "click",
        () => {

            searchPanel.classList.add(
                "open"
            );

            setTimeout(
                () => searchInput.focus(),
                50
            );

        }
    );


    closeSearch.addEventListener(
        "click",
        () => {

            searchPanel.classList.remove(
                "open"
            );

            searchInput.value = "";

            showSearchMessage(
                "Start typing to search your library."
            );

        }
    );


    searchInput.addEventListener(
        "input",
        () => {

            performSearch(
                searchInput.value.trim()
            );

        }
    );
}


function performSearch(query) {

    if (!query) {

        showSearchMessage(
            "Start typing to search your library."
        );

        return;

    }


    const allItems = [

        ...movies,

        ...series,

        ...songs

    ];


    const results =
        allItems.filter(
            item => {

                const searchable = `

                    ${item.title || ""}

                    ${item.type || ""}

                    ${item.artist || ""}

                    ${item.year || ""}

                `.toLowerCase();


                return searchable.includes(
                    query.toLowerCase()
                );

            }
        );


    searchResults.innerHTML = "";


    if (!results.length) {

        showSearchMessage(
            "Nothing found in your library."
        );

        return;

    }


    results.forEach(item => {

        const result =
            document.createElement("div");

        result.className =
            "search-result";


        result.innerHTML = `

            <img
                src="${item.poster}"
                alt="${escapeHtml(item.title)}"
            >

            <div>

                <div class="search-result-title">
                    ${escapeHtml(item.title)}
                </div>

                <div class="search-result-type">
                    ${escapeHtml(item.type || item.artist || "")}
                </div>

            </div>

        `;


        result.addEventListener(
            "click",
            () => {

                searchPanel.classList.remove(
                    "open"
                );

                openPlayer(
                    item.title,
                    item.video ||
                    item.audio ||
                    "",
                    item
                );

            }
        );


        searchResults.appendChild(result);

    });

}


function showSearchMessage(message) {
    if (!searchResults) return;

    searchResults.innerHTML = `

        <p class="search-message">
            ${escapeHtml(message)}
        </p>

    `;

}


/* =========================================================
   PROFILE
========================================================= */

const profileButton =
    $("#profileButton");

const profileOverlay =
    $("#profileOverlay");

const closeProfile =
    $("#closeProfile");

const profileAvatar =
    $("#profileAvatar");

const headerAvatar =
    $("#headerAvatar");

const editableName =
    $("#editableName");

const profileHeading =
    $("#profileHeading");

const headerProfileName =
    $("#headerProfileName");

const saveProfile =
    $("#saveProfile");

const profileImageInput =
    $("#profileImageInput");


let profileData = {

    name:
        localStorage.getItem(
            "webmovies-profile-name"
        ) || "User",

    image:
        localStorage.getItem(
            "webmovies-profile-image"
        ) || ""

};


/* =========================================================
   PROFILE DISPLAY
========================================================= */

function updateProfileDisplay() {

    const name =
        profileData.name || "User";

    if (editableName) {
        editableName.textContent = name;
    }

    if (profileHeading) {
        profileHeading.textContent = name;
    }

    if (headerProfileName) {
        headerProfileName.textContent = name;
    }


    if (profileData.image) {

        if (profileAvatar) {
            profileAvatar.innerHTML = `
                <img
                    src="${profileData.image}"
                    alt="Profile picture"
                >
            `;
        }

        if (headerAvatar) {
            headerAvatar.innerHTML = `
                <img
                    src="${profileData.image}"
                    alt="Profile picture"
                >
            `;
        }

    } else {

        const letter =
            name.charAt(0)
                .toUpperCase() || "W";

        if (profileAvatar) {
            profileAvatar.textContent = letter;
        }

        if (headerAvatar) {
            headerAvatar.textContent = letter;
        }

    }

}


/* =========================================================
   OPEN PROFILE
========================================================= */

if (profileButton && profileOverlay && closeProfile && editableName && profileAvatar && profileImageInput && saveProfile) {
profileButton.addEventListener(
    "click",
    (e) => {
        if (!window.auth.getToken()) {
            e.stopPropagation();
            if (typeof showAuthModal === "function") showAuthModal();
            return;
        }

        profileOverlay.classList.add(
            "open"
        );

        updateProfileDisplay();

    }
);


closeProfile.addEventListener(
    "click",
    () => {

        profileOverlay.classList.remove(
            "open"
        );

    }
);


profileOverlay.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            profileOverlay
        ) {

            profileOverlay.classList.remove(
                "open"
            );

        }

    }
);
}


/* =========================================================
    DOUBLE CLICK NAME
    ========================================================= */

if (editableName) {
    editableName.addEventListener(
        "dblclick",
        () => {

            editableName.contentEditable =
                "true";

            editableName.classList.add(
                "editing"
            );

            editableName.focus();


            const range =
                document.createRange();

            range.selectNodeContents(
                editableName
            );


            const selection =
                window.getSelection();

            selection.removeAllRanges();

            selection.addRange(range);

        }
    );


    editableName.addEventListener(
        "blur",
        () => {

            editableName.contentEditable =
                "false";

            editableName.classList.remove(
                "editing"
            );

        }
    );
}


/* =========================================================
    DOUBLE CLICK PROFILE PICTURE
    ========================================================= */

if (profileAvatar && profileImageInput) {
    profileAvatar.addEventListener(
        "dblclick",
        () => {

            profileImageInput.click();

        }
    );


    profileImageInput.addEventListener(
        "change",
        () => {

            const file =
                profileImageInput.files[0];


            if (!file) {
                return;
            }


            if (!file.type.startsWith("image/")) {

                alert(
                    "Please choose an image file."
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    profileData.image =
                        event.target.result;


                    updateProfileDisplay();

                };


            reader.readAsDataURL(file);

        }
    );
}


/* =========================================================
    SAVE PROFILE
    ========================================================= */

if (saveProfile && editableName) {
    saveProfile.addEventListener(
        "click",
        () => {
            const name =
                editableName.textContent.trim();


            profileData.name =
                name || "User";


            localStorage.setItem(
                "webmovies-profile-name",
                profileData.name
            );


            if (profileData.image) {

                localStorage.setItem(
                    "webmovies-profile-image",
                    profileData.image
                );

            }


            updateProfileDisplay();


            saveProfile.textContent =
                "Saved ✓";


            setTimeout(
                () => {

                    saveProfile.textContent =
                        "Save Profile";

                },
                1500
            );

        }
    );
}

/* =========================================================
   SERVER CATALOG
========================================================= */

function replaceItems(target, nextItems) {

    target.splice(
        0,
        target.length,
        ...nextItems
    );

}


function toClientItem(item) {

    const mediaUrl =
        item.playbackAvailable
            ? `/api/media/${encodeURIComponent(item.id)}`
            : "";

    // Series are always "downloadable" (episodes have their own streams)
    const isDownloadable = item.kind === "series" || Boolean(mediaUrl);

    return {
        ...item,
        type:
            item.kind === "series"
                ? "Web Series"
                : item.kind === "song"
                    ? "Song"
                    : "Movie",
        video: item.kind === "song" ? "" : mediaUrl,
        audio: item.kind === "song" ? mediaUrl : "",
        download: isDownloadable ? (mediaUrl || "series") : ""
    };

}


let csCurrentOffset = 0;
let csResizeHandler = null;

function renderComingSoonSlider(items, settings) {
    const section = document.getElementById("comingSoonSection");
    const track = document.getElementById("csTrack");
    const prevBtn = document.getElementById("csPrev");
    const nextBtn = document.getElementById("csNext");

    if (!section || !track) return;

    if (section) {
        section.classList.remove("cs-size-small", "cs-size-medium", "cs-size-large", "cs-size-xlarge");
        section.classList.add(`cs-size-${(settings && settings.csCardSize) || "medium"}`);
    }

    if (!items || items.length === 0) {
        section.hidden = true;
        return;
    }

    section.hidden = false;
    track.innerHTML = "";
    csCurrentOffset = 0;
    track.style.transform = `translateX(0px)`;

    const isWide = (settings && (settings.csCardSize === 'large' || settings.csCardSize === 'xlarge'));

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "cs-card";
        
        let imageSrc = item.poster;
        if (isWide && item.backdrop) {
            imageSrc = item.backdrop;
        }
        imageSrc = imageSrc || "https://placehold.co/780x1170/170d12/ff1744?text=COMING+SOON";
        
        let displayTitle = item.title;
        if (item.type === "season" && item.seriesId && typeof series !== "undefined") {
            const parentSeries = series.find(s => s.id === item.seriesId);
            if (parentSeries) {
                displayTitle = `${parentSeries.title} - ${displayTitle}`;
            }
        }
        
        if (item.video) {
            card.classList.add("has-video");
            card.style.aspectRatio = "auto";
            card.style.backgroundColor = "var(--panel-light)";

            card.innerHTML = `
                <div class="cs-video-wrapper">
                    <img class="cs-card-poster" src="${imageSrc}" alt="${escapeHtml(displayTitle)}" loading="lazy">
                    <video class="cs-card-video" src="${item.video}" playsinline preload="metadata" loop muted></video>
                    <button class="cs-unmute-btn" type="button" aria-label="Unmute preview">🔇</button>
                </div>
                <div class="cs-info-below">
                    <div class="cs-card-badge">COMING SOON</div>
                    <div class="cs-card-title">${escapeHtml(displayTitle)}</div>
                    <div class="cs-card-desc">${escapeHtml(item.description || '')}</div>
                </div>
            `;

            const videoEl = card.querySelector(".cs-card-video");
            const muteBtn = card.querySelector(".cs-unmute-btn");

            const setPreviewState = (playing) => {
                card.classList.toggle("preview-playing", playing);
                if (playing) {
                    muteBtn.style.opacity = "1";
                    muteBtn.style.visibility = "visible";
                } else {
                    muteBtn.style.opacity = "0";
                    muteBtn.style.visibility = "hidden";
                }
            };

            card.addEventListener("mouseenter", () => {
                if (!videoEl) return;
                videoEl.currentTime = 0;
                videoEl.muted = true;
                muteBtn.textContent = "🔇";
                setPreviewState(true);
                videoEl.play().catch(() => {});
            });

            card.addEventListener("mouseleave", () => {
                if (!videoEl) return;
                videoEl.pause();
                videoEl.currentTime = 0;
                setPreviewState(false);
            });

            muteBtn.addEventListener("click", event => {
                event.stopPropagation();
                if (!videoEl) return;
                videoEl.muted = !videoEl.muted;
                muteBtn.textContent = videoEl.muted ? "🔇" : "🔊";
            });
        } else {
            // Fallback layout when there is no video (Poster with gradient overlay)
            card.innerHTML = `
                <img class="cs-card-poster" src="${imageSrc}" alt="${escapeHtml(displayTitle)}" loading="lazy">
                <div class="cs-card-gradient"></div>
                <div class="cs-card-info">
                    <div class="cs-card-badge">COMING SOON</div>
                    <div class="cs-card-title">${escapeHtml(displayTitle)}</div>
                    <div class="cs-card-desc">${escapeHtml(item.description || '')}</div>
                </div>
            `;
        }
        
        track.appendChild(card);
    });

    function updateCSArrows() {
        const visibleWidth = track.parentElement.getBoundingClientRect().width;
        const totalWidth = track.scrollWidth;
        
        prevBtn.disabled = csCurrentOffset >= 0;
        nextBtn.disabled = csCurrentOffset <= -(totalWidth - visibleWidth) || totalWidth <= visibleWidth;
    }

    function doCSScroll(direction) {
        const firstCard = track.firstElementChild;
        if (!firstCard) return;
        
        const cardWidth = firstCard.getBoundingClientRect().width + 18;
        const visibleWidth = track.parentElement.getBoundingClientRect().width;
        const totalWidth = track.scrollWidth;
        
        const step = cardWidth * Math.max(1, Math.floor(visibleWidth / cardWidth) - 1);
        
        csCurrentOffset -= direction * step;
        
        const maxOffset = -(totalWidth - visibleWidth);
        if (csCurrentOffset > 0) csCurrentOffset = 0;
        if (csCurrentOffset < maxOffset) csCurrentOffset = maxOffset;
        
        track.style.transform = `translateX(${csCurrentOffset}px)`;
        updateCSArrows();
    }

    prevBtn.onclick = () => doCSScroll(-1);
    nextBtn.onclick = () => doCSScroll(1);

    setTimeout(updateCSArrows, 100);

    if (csResizeHandler) {
        window.removeEventListener("resize", csResizeHandler);
    }

    csResizeHandler = () => {
        updateCSArrows();
        const visibleWidth = track.parentElement.getBoundingClientRect().width;
        const totalWidth = track.scrollWidth;
        const maxOffset = -(totalWidth - visibleWidth);
        if (csCurrentOffset < maxOffset) {
            csCurrentOffset = maxOffset;
            if (csCurrentOffset > 0) csCurrentOffset = 0;
            track.style.transform = `translateX(${csCurrentOffset}px)`;
        }
    };

    window.addEventListener("resize", csResizeHandler);
}


async function loadServerCatalog() {

    try {

        const response = await fetch("/api/catalog", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Catalog request failed (${response.status}).`);
        }

        const catalog = await response.json();
        const items = Array.isArray(catalog.items) ? catalog.items : [];
        const comingSoonItems = Array.isArray(catalog.comingSoon)
            ? catalog.comingSoon.filter(item => item.type !== 'season')
            : [];
        const rawHeroSlides = Array.isArray(catalog.heroSlides) ? catalog.heroSlides : [];

        if (items.length) {
            const clientItems = items.map(toClientItem);
            replaceItems(movies, clientItems.filter(item => item.kind === 'movie' && item.showOnHome !== false));
            replaceItems(series, clientItems.filter(item => item.kind === 'series' && item.showOnHome !== false));
            replaceItems(songs, clientItems.filter(item => item.kind === 'song' && item.showOnHome !== false));
        }

        // Custom Hero Posters added by admin
        const customHeroSlides = rawHeroSlides.map(item => {
            const linkedItem = item.mediaId
                ? items.find(entry => entry.id === item.mediaId)
                : items.find(
                    entry =>
                        entry.title &&
                        item.title &&
                        entry.title.toLowerCase() === item.title.toLowerCase()
                );

            const playback = linkedItem && linkedItem.playbackAvailable
                ? `/api/media/${encodeURIComponent(linkedItem.id)}`
                : "";

            return {
                id: linkedItem?.id || item.id,
                title: item.title,
                type: item.type || "Featured",
                year: item.year || "",
                rating: item.rating || "",
                quality: item.quality || "HD",
                description: item.description,
                poster: item.poster,
                video: item.video || "",
                playback,
                playbackAvailable: Boolean(linkedItem && linkedItem.playbackAvailable),
                isComingSoon: false
            };
        });

        // Regular catalog slides
        const regularSlides = (movies.length || series.length)
            ? [...movies, ...series].slice(0, 5).map(item => ({ ...item, quality: 'HD', isComingSoon: false }))
            : defaultDemoHeroSlides;

        const finalSlides = customHeroSlides.length
            ? [...customHeroSlides, ...regularSlides]
            : regularSlides;

        if (finalSlides.length) {
            replaceItems(heroSlides, finalSlides);
        }

        initHeroTrack();
        renderHero(0);
        renderRows();
        renderLibraries();

        // Render the dedicated Coming Soon section
        renderComingSoonSlider(comingSoonItems, catalog.settings);

        // Apply poster sizes from admin settings
        const sizeSettings = catalog.settings || {};
        const sizeClasses = ["size-small", "size-medium", "size-large", "size-xlarge"];

        const applySize = (rowId, settingKey) => {
            const row = document.getElementById(rowId);
            if (row) {
                row.classList.remove(...sizeClasses);
                const val = sizeSettings[settingKey] || "medium";
                row.classList.add("size-" + val);
            }
        };

        applySize("moviesRow", "movieCardSize");
        applySize("seriesRow", "seriesCardSize");
        applySize("songsRow", "songCardSize");

        console.log("WebMovies server catalog loaded.");

    } catch (error) {

        console.info(
            "WebMovies is using local demo data until the server catalog is available.",
            error.message
        );

        if (heroSlides.length) {
            initHeroTrack();
            renderHero(0);
        }
        renderRows();
        renderLibraries();

    }

}


/* =========================================================
   PLAYER / SERIES OPENING
========================================================= */

function openPlayer(title, video = "", item = null) {

    if (item && item.type === "Web Series") {

        const seriesUrl =
            `series.html?seriesId=${encodeURIComponent(item.id)}`;

        window.location.href = seriesUrl;

        return;
    }

    const playerUrl =
        new URL("player/player.html", window.location.href);

    const playerData = {
        id: item?.id || title || "webmovies-video",
        title: title || "WebMovies",
        type: item?.type || "Movie",
        year: item?.year || "",
        rating: item?.rating || "",
        description: item?.description || "",
        poster: item?.poster || "",
        video: video || "",
        download: item?.download || video || "",
        parts: item?.parts || 1
    };

    playerUrl.searchParams.set(
        "data",
        JSON.stringify(playerData)
    );

    window.location.href =
        playerUrl.href;
}

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function initializeWebMovies() {

    console.log("WebMovies starting...");


    /* HOME ROWS */

    if (
        $("#moviesRow") &&
        $("#seriesRow") &&
        $("#songsRow") &&
        $("#continueWatchingRow")
    ) {

        renderRows();

    }


    /* LIBRARY */

    if (
        $("#moviesLibrary") &&
        $("#seriesLibrary") &&
        $("#songsLibrary")
    ) {
        renderLibraries();
    }

    /* PROFILE */
    if (typeof updateProfileDisplay === "function") {
        updateProfileDisplay();
    }

    void loadServerCatalog();
    
    // Auth
    initAuthUI();
}

/* =========================================================
   START WEBMOVIES
========================================================================= */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWebMovies);
} else {
    initializeWebMovies();
}

/* =========================================================
   AUTH UI
========================================================================= */
let isSignupMode = false;
let currentUser = null;

function showAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) {
        modal.style.display = "flex";
        document.getElementById("authEmail").value = "";
        document.getElementById("authPassword").value = "";
        const nameInput = document.getElementById("authName");
        if (nameInput) nameInput.value = "";
        const nameGroup = document.getElementById("authNameGroup");
        if (nameGroup) nameGroup.style.display = isSignupMode ? "block" : "none";
        document.getElementById("authError").style.display = "none";
    }
}

function hideAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
}

async function initAuthUI() {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    
    const cancelBtn = document.getElementById("authCancel");
    const submitBtn = document.getElementById("authSubmit");
    const toggleBtn = document.getElementById("authToggleMode");
    const title = document.getElementById("authModalTitle");
    const errorDiv = document.getElementById("authError");
    const nameGroup = document.getElementById("authNameGroup");
    
    cancelBtn.onclick = hideAuthModal;
    
    toggleBtn.onclick = (e) => {
        e.preventDefault();
        isSignupMode = !isSignupMode;
        title.textContent = isSignupMode ? "Sign Up" : "Login";
        submitBtn.textContent = isSignupMode ? "Sign Up" : "Login";
        toggleBtn.textContent = isSignupMode ? "Already have an account? Login" : "Need an account? Sign up";
        if (nameGroup) nameGroup.style.display = isSignupMode ? "block" : "none";
        errorDiv.style.display = "none";
    };
    
    submitBtn.onclick = async () => {
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;
        const nameInput = document.getElementById("authName");
        const name = nameInput ? nameInput.value.trim() : "";
        
        if (!email || !password) {
            errorDiv.textContent = "Please fill all fields";
            errorDiv.style.display = "block";
            return;
        }
        if (isSignupMode && password.length < 6) {
            errorDiv.textContent = "Password must be at least 6 characters";
            errorDiv.style.display = "block";
            return;
        }
        
        try {
            submitBtn.disabled = true;
            if (isSignupMode) {
                await window.auth.signup(email, password, name);
            } else {
                await window.auth.login(email, password);
            }
            hideAuthModal();
            window.location.reload();
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = "block";
            submitBtn.disabled = false;
        }
    };
    
    // Check if logged in
    const user = await window.auth.getMe();
    if (user) {
        currentUser = user;
        
        // Sync backend user name to local profile data if it exists
        if (user.name && !localStorage.getItem("webmovies-profile-name")) {
            profileData.name = user.name;
            localStorage.setItem("webmovies-profile-name", user.name);
        }
        
        if (typeof updateProfileDisplay === "function") {
            updateProfileDisplay();
        }
        
        // Wire up logout button in profile modal
        const logoutBtn = document.getElementById("logoutProfileBtn");
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                if (confirm("Do you want to log out?")) {
                    window.auth.logout();
                }
            };
        }
    } else {
        const profileName = document.getElementById("headerProfileName");
        if (profileName) profileName.textContent = "Login";
        const avatar = document.getElementById("headerAvatar");
        if (avatar) avatar.textContent = "?";
    }
}

async function renderDownloadsLibrary() {
    const container = document.getElementById("downloadsLibrary");
    if (!container) return;
    
    container.innerHTML = "<p>Loading your downloads...</p>";
    
    try {
        const res = await window.auth.apiFetch("/api/user/downloads");
        if (!res.ok) throw new Error("Could not load downloads");
        
        const data = await res.json();
        const downloads = data.downloads || [];
        
        container.innerHTML = "";
        
        if (downloads.length === 0) {
            container.innerHTML = "<p>You haven't downloaded any media yet.</p>";
            return;
        }
        
        downloads.forEach(dl => {
            const card = document.createElement("article");
            card.className = "media-card";
            
            // For size formatting
            const mb = (dl.size / (1024 * 1024)).toFixed(1);
            
            card.innerHTML = `
                <div class="media-card-image">
                    <img src="${dl.poster}" alt="${escapeHtml(dl.title)}" loading="lazy">
                    <div class="card-overlay">
                        <button class="card-play" aria-label="Play ${escapeHtml(dl.title)}">▶</button>
                    </div>
                </div>
                <div class="media-card-info">
                    <div class="media-card-title">${escapeHtml(dl.title)}</div>
                    <div class="media-card-subtitle">${mb} MB</div>
                    <button class="remove-dl-btn" style="margin-top:0.5rem; background:red; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">Remove</button>
                </div>
            `;
            
            const playBtn = card.querySelector(".card-play");
            playBtn.onclick = async (e) => {
                e.stopPropagation();
                try {
                    const blob = await window.db.getFile(dl.blobKey);
                    if (!blob) throw new Error("File missing from local storage.");
                    const url = URL.createObjectURL(blob);
                    
                    const item = { id: dl.downloadId, title: dl.title };
                    openPlayer(dl.title, url, item);
                } catch (err) {
                    alert("Could not play offline file: " + err.message);
                }
            };
            
            const rmBtn = card.querySelector(".remove-dl-btn");
            rmBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete ${dl.title} from downloads?`)) return;
                
                rmBtn.disabled = true;
                try {
                    await window.db.deleteFile(dl.blobKey);
                    await window.auth.apiFetch(`/api/user/downloads/${dl.downloadId}`, { method: "DELETE" });
                    card.remove();
                } catch (err) {
                    alert("Failed to delete.");
                    rmBtn.disabled = false;
                }
            };
            
            container.appendChild(card);
        });
        
    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
}