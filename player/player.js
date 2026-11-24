/* =========================================================
   WEBMOVIES PLAYER
   COMPLETE PLAYER JAVASCRIPT
========================================================= */

"use strict";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const videoContainer = document.getElementById("videoContainer");

const videoPlayer = document.getElementById("mainVideoPlayer");
const secondaryVideoPlayer = document.getElementById("secondaryVideoPlayer");

let activePlayer = videoPlayer;
let inactivePlayer = secondaryVideoPlayer;

let partCount = 1;
let currentPartIndex = 0;
let partDurations = [];
let totalCombinedDuration = 0;
let isMultiPart = false;

const videoPoster = document.getElementById("videoPoster");

const videoLoader = document.getElementById("videoLoader");

const centerPlayButton =
    document.getElementById("centerPlayButton");

const videoControls =
    document.getElementById("videoControls");

const playPauseButton =
    document.getElementById("playPauseButton");

const rewindButton =
    document.getElementById("rewindButton");

const forwardButton =
    document.getElementById("forwardButton");

const muteButton =
    document.getElementById("muteButton");

const progressBar =
    document.getElementById("progressBar");

const timeDisplay =
    document.getElementById("timeDisplay");

const fullscreenButton =
    document.getElementById("fullscreenButton");

const settingsButton =
    document.getElementById("settingsButton");

const audioButton =
    document.getElementById("audioButton");

const subtitleButton =
    document.getElementById("subtitleButton");

const volumeSlider =
    document.getElementById("volumeSlider");

const settingsPanel =
    document.getElementById("settingsPanel");

const audioPanel =
    document.getElementById("audioPanel");

const subtitlePanel =
    document.getElementById("subtitlePanel");

const qualityPanel =
    document.getElementById("qualityPanel");

const closeSettings =
    document.getElementById("closeSettings");

const closeAudio =
    document.getElementById("closeAudio");

const closeSubtitles =
    document.getElementById("closeSubtitles");

const closeQuality =
    document.getElementById("closeQuality");

const playerBack =
    document.getElementById("playerBack");

const playerDownload =
    document.getElementById("playerDownload");

const downloadOption =
    document.getElementById("downloadOption");

const videoTitle =
    document.getElementById("videoTitle");

const videoType =
    document.getElementById("videoType");

const videoYear =
    document.getElementById("videoYear");

const videoRating =
    document.getElementById("videoRating");

const videoQuality =
    document.getElementById("videoQuality");

const videoDescription =
    document.getElementById("videoDescription");

const seriesInformation =
    document.getElementById("seriesInformation");

const seriesTitle =
    document.getElementById("seriesTitle");

const seasonTitle =
    document.getElementById("seasonTitle");

const episodeTitle =
    document.getElementById("episodeTitle");

const previousEpisode =
    document.getElementById("previousEpisode");

const nextEpisode =
    document.getElementById("nextEpisode");

const resumeInformation =
    document.getElementById("resumeInformation");

const qualityOption =
    document.getElementById("qualityOption");

const qualityValue =
    document.getElementById("qualityValue");

const playbackSpeedOption =
    document.getElementById("playbackSpeedOption");

const videoSizeOption =
    document.getElementById("videoSizeOption");

const videoSizeValue =
    document.getElementById("videoSizeValue");

const videoSizePanel =
    document.getElementById("videoSizePanel");

const closeVideoSize =
    document.getElementById("closeVideoSize");

const speedValue =
    document.getElementById("speedValue");

const audioTracks =
    document.getElementById("audioTracks");

const subtitleTracks =
    document.getElementById("subtitleTracks");


/* =========================================================
   PLAYER DATA
========================================================= */

const defaultPlayerData = {
    id: "test-video",
    title: "WebMovies Test Video",
    type: "Movie",
    year: "2026",
    rating: "8.5",
    quality: "HD",
    description: "This is the WebMovies standalone player.",
    poster: "",
    video: "test.mp4",
    download: "",
    series: false,
    seriesName: "",
    season: 1,
    episode: 1,
    episodeName: "",
    previousEpisodeUrl: "",
    nextEpisodeUrl: "",
    parts: 1,
    audioTracks: [],
    subtitleTracks: []
};

/* =========================================================
   READ PLAYER DATA
========================================================= */

function getPlayerData() {

    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");

    if (encodedData) {

        try {

            const decoded =
                JSON.parse(encodedData);

            return {
                ...defaultPlayerData,
                ...decoded
            };

        } catch (error) {

            console.warn(
                "WebMovies: Could not read player data.",
                error
            );

        }

    }


    const hasDirectPlayerData =
        [
            "title",
            "video",
            "poster",
            "series",
            "seriesId"
        ].some(
            key => params.has(key)
        );

    if (hasDirectPlayerData) {

        const seriesName =
            params.get("series") || "";

        const seriesId =
            params.get("seriesId") || "";

        const episodeTitle =
            params.get("title") || "";

        return {
            ...defaultPlayerData,
            id:
                params.get("id") ||
                [seriesId, params.get("season"), params.get("episode")]
                    .filter(Boolean)
                    .join("-") ||
                episodeTitle ||
                "webmovies-video",
            title: episodeTitle || defaultPlayerData.title,
            type:
                seriesName || seriesId
                    ? "Web Series"
                    : params.get("type") || defaultPlayerData.type,
            poster: params.get("poster") || "",
            video: params.get("video") || "",
            download:
                params.get("download") ||
                params.get("video") ||
                "",
            series: Boolean(seriesName || seriesId),
            seriesName,
            season: Number(params.get("season")) || 1,
            episode: Number(params.get("episode")) || 1,
            episodeName: episodeTitle,
            parts: Number(params.get("parts")) || 1
        };

    }


    const savedData =
        localStorage.getItem(
            "webmovies-current-player"
        );

    if (savedData) {

        try {

            return {
                ...defaultPlayerData,
                ...JSON.parse(savedData)
            };

        } catch (error) {

            console.warn(
                "WebMovies: Saved player data is invalid.",
                error
            );

        }

    }


    return {
        ...defaultPlayerData
    };
}


let playerData =
    getPlayerData();


/* =========================================================
   PLAYBACK STORAGE
========================================================= */

function getProgressKey() {

    return (
        "webmovies-progress-" +
        String(
            playerData.id ||
            playerData.title ||
            "video"
        )
    );

}


function savePlaybackPosition() {

    if (!videoPlayer.duration) {
        return;
    }

    const position =
        videoPlayer.currentTime;

    localStorage.setItem(
        getProgressKey(),
        JSON.stringify({
            position: position,
            duration: videoPlayer.duration,
            updatedAt: Date.now()
        })
    );

}


function getSavedPlaybackPosition() {

    const saved =
        localStorage.getItem(
            getProgressKey()
        );

    if (!saved) {
        return null;
    }

    try {

        const data =
            JSON.parse(saved);

        if (
            typeof data.position !== "number"
        ) {
            return null;
        }

        return data;

    } catch (error) {

        return null;

    }

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {

        return "00:00";

    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return String(hours).padStart(2, "0") + ":" +
            String(minutes).padStart(2, "0") + ":" +
            String(secs).padStart(2, "0");
    }

    return String(minutes).padStart(2, "0") + ":" +
        String(secs).padStart(2, "0");
}

/* =========================================================
   GOOGLE DRIVE HELPERS
========================================================= */

const driveEmbedFrame = document.getElementById("driveEmbedFrame");
let isDriveEmbed = false;

function getDriveFileId(url) {
    if (!url) return null;
    const str = String(url).trim().replace(/['"]/g, "");
    const ucMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (ucMatch) return ucMatch[1];
    const fdMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fdMatch) return fdMatch[1];
    if (!str.includes("://") && !str.includes("/") && !str.includes(" ") && /^[a-zA-Z0-9_-]{20,}$/.test(str)) {
        return str;
    }
    return null;
}


function isYouTubeUrl(url) {
    if (!url) return false;
    return !!(url.includes("youtube.com") || url.includes("youtu.be"));
}

function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? "https://www.youtube-nocookie.com/embed/" + match[1] + "?autoplay=1&rel=0" : null;
}

function isDriveUrl(url) {
    if (!url) return false;
    return !!(url.includes("drive.google.com") || getDriveFileId(url));
}

function getDriveEmbedUrl(url) {
    const id = getDriveFileId(url);
    if (!id) return null;
    return "https://drive.google.com/file/d/" + id + "/preview";
}

/* =========================================================
   MULTI-PART TIMELINE HELPERS
========================================================= */

function getPartUrl(index) {
    if (!playerData.video) return "";
    if (!isMultiPart) return playerData.video;
    return playerData.video.includes("?")
        ? `${playerData.video}&part=${index}`
        : `${playerData.video}?part=${index}`;
}

function getCombinedCurrentTime() {
    if (!isMultiPart) {
        return activePlayer.currentTime || 0;
    }
    let elapsedBefore = 0;
    for (let i = 0; i < currentPartIndex; i++) {
        elapsedBefore += (partDurations[i] || 0);
    }
    return elapsedBefore + (activePlayer.currentTime || 0);
}

function parseDurationString(str) {
    if (!str) return 0;
    let totalSeconds = 0;
    const hoursMatch = str.match(/(\d+)h/i);
    const minsMatch = str.match(/(\d+)m/i);
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    if (minsMatch) totalSeconds += parseInt(minsMatch[1], 10) * 60;
    return totalSeconds;
}

function getCombinedTotalDuration() {
    if (!isMultiPart) {
        let d = activePlayer.duration;
        if (!d || d === Infinity || isNaN(d)) {
            d = parseDurationString(playerData.duration);
        }
        return d || 0;
    }
    return totalCombinedDuration || activePlayer.duration || parseDurationString(playerData.duration) || 0;
}

/* =========================================================
   UPDATE TIME & PROGRESS (multi-part aware)
========================================================= */

function updateTimeDisplay() {
    const current = formatTime(getCombinedCurrentTime());
    const duration = formatTime(getCombinedTotalDuration());
    timeDisplay.textContent = `${current} / ${duration}`;
}

function updateProgress() {
    const total = getCombinedTotalDuration();
    if (!total) {
        progressBar.value = 0;
        progressBar.style.setProperty("--progress", "0%");
        return;
    }
    const percentage = (getCombinedCurrentTime() / total) * 100;
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    progressBar.value = clampedPercentage;
    progressBar.style.setProperty("--progress", `${clampedPercentage}%`);
}

function seekCombinedTime(targetTime) {
    const duration = getCombinedTotalDuration();
    
    // If duration is invalid or Infinity, let the browser handle clamping. 
    // Otherwise, we accidentally clamp to 0 and seeking fails completely.
    let clampedTarget = Math.max(0, targetTime);
    if (duration && duration !== Infinity) {
        clampedTarget = Math.min(duration, clampedTarget);
    }

    if (!isMultiPart) {
        activePlayer.currentTime = clampedTarget;
        updateTimeDisplay();
        updateProgress();
        return;
    }

    let accumulated = 0;
    let targetIndex = 0;
    let offsetInPart = 0;

    for (let i = 0; i < partCount; i++) {
        const partDur = partDurations[i] || 0;
        if (clampedTarget <= accumulated + partDur || i === partCount - 1) {
            targetIndex = i;
            offsetInPart = clampedTarget - accumulated;
            break;
        }
        accumulated += partDur;
    }

    if (targetIndex === currentPartIndex) {
        activePlayer.currentTime = offsetInPart;
    } else {
        const wasPlaying = !activePlayer.paused;
        activePlayer.pause();
        activePlayer.style.display = "none";

        currentPartIndex = targetIndex;

        activePlayer.src = getPartUrl(currentPartIndex);
        activePlayer.style.display = "block";
        activePlayer.currentTime = offsetInPart;

        if (wasPlaying) {
            playVideo();
        }

        if (currentPartIndex + 1 < partCount) {
            inactivePlayer.src = getPartUrl(currentPartIndex + 1);
            inactivePlayer.load();
        }
    }

    updateTimeDisplay();
    updateProgress();
}

function handleVideoEnded() {
    if (isMultiPart && currentPartIndex < partCount - 1) {
        currentPartIndex++;

        activePlayer.pause();
        activePlayer.style.display = "none";

        inactivePlayer.style.display = "block";

        const temp = activePlayer;
        activePlayer = inactivePlayer;
        inactivePlayer = temp;

        activePlayer.currentTime = 0;
        playVideo();

        if (currentPartIndex + 1 < partCount) {
            inactivePlayer.src = getPartUrl(currentPartIndex + 1);
            inactivePlayer.load();
        }

        updateTimeDisplay();
        updateProgress();
    } else {
        updatePlayButton();
    }
}

/* =========================================================
   PLAY / PAUSE CONTROLS
========================================================= */

async function playVideo() {
    try {
        await activePlayer.play();
    } catch (error) {
        console.warn("WebMovies: Video could not start.", error);
    }
}

function pauseVideo() {
    activePlayer.pause();
}

function togglePlay() {
    if (activePlayer.paused) {
        playVideo();
    } else {
        pauseVideo();
    }
}

function updatePlayButton() {
    if (activePlayer.paused) {
        playPauseButton.textContent = "▶";
        playPauseButton.setAttribute("aria-label", "Play");
        centerPlayButton.textContent = "▶";
        centerPlayButton.setAttribute("aria-label", "Play");
    } else {
        playPauseButton.textContent = "❚❚";
        playPauseButton.setAttribute("aria-label", "Pause");
        centerPlayButton.textContent = "❚❚";
        centerPlayButton.setAttribute("aria-label", "Pause");
    }
}


/* =========================================================
   CENTER PLAY BUTTON
========================================================= */

centerPlayButton.addEventListener(
    "click",
    function () {

        togglePlay();

    }
);


/* =========================================================
   PLAY / PAUSE BUTTON
========================================================= */

playPauseButton.addEventListener(
    "click",
    function () {

        togglePlay();

    }
);


/* =========================================================
   DOUBLE CLICK VIDEO
========================================================= */

videoPlayer.addEventListener(
    "dblclick",
    function () {

        toggleFullscreen();

    }
);


/* =========================================================
   REWIND 10 SECONDS
========================================================= */

rewindButton.addEventListener(
    "click",
    function () {

        seekCombinedTime(getCombinedCurrentTime() - 10);
        savePlaybackPosition();

    }
);


/* =========================================================
   FORWARD 10 SECONDS
========================================================= */

forwardButton.addEventListener(
    "click",
    function () {

        seekCombinedTime(getCombinedCurrentTime() + 10);
        savePlaybackPosition();

    }
);


/* =========================================================
   PROGRESS BAR
========================================================= */

progressBar.addEventListener(
    "input",
    function () {

        const duration = getCombinedTotalDuration();
        if (!duration) {
            return;
        }

        const percentage = Number(progressBar.value);
        const targetTime = (percentage / 100) * duration;
        seekCombinedTime(targetTime);

    }
);


progressBar.addEventListener(
    "change",
    function () {

        savePlaybackPosition();

    }
);


/* =========================================================
   MUTE
========================================================= */

function updateMuteButton() {

    if (
        videoPlayer.muted ||
        videoPlayer.volume === 0
    ) {
        muteButton.textContent = "🔇";
        muteButton.setAttribute("aria-label", "Unmute");
        if (volumeSlider && volumeSlider.value != 0) {
            volumeSlider.value = 0;
        }
    } else {
        muteButton.textContent = "🔊";
        muteButton.setAttribute("aria-label", "Mute");
        if (volumeSlider && videoPlayer.volume > 0) {
            volumeSlider.value = videoPlayer.volume;
        }
    }

}


if (volumeSlider) {
    volumeSlider.addEventListener("input", function () {
        const val = parseFloat(volumeSlider.value);
        videoPlayer.volume = val;
        videoPlayer.muted = (val === 0);
        updateMuteButton();
        showControls();
    });
}

muteButton.addEventListener(
    "click",
    function () {

        videoPlayer.muted =
            !videoPlayer.muted;

        updateMuteButton();

    }
);


/* =========================================================
   VOLUME WITH WHEEL
========================================================= */

muteButton.addEventListener(
    "wheel",
    function (event) {

        event.preventDefault();

        let volume =
            videoPlayer.volume;

        if (event.deltaY < 0) {

            volume += 0.05;

        } else {

            volume -= 0.05;

        }

        volume =
            Math.min(
                1,
                Math.max(
                    0,
                    volume
                )
            );

        videoPlayer.volume =
            volume;

        if (volume > 0) {

            videoPlayer.muted =
                false;

        }

        updateMuteButton();

    },
    {
        passive: false
    }
);


/* =========================================================
   FULLSCREEN
========================================================= */

async function toggleFullscreen() {

    try {

        if (!document.fullscreenElement) {

            if (
                videoContainer.requestFullscreen
            ) {

                await videoContainer.requestFullscreen();

            } else if (
                videoContainer.webkitRequestFullscreen
            ) {

                videoContainer.webkitRequestFullscreen();

            }

        } else {

            if (
                document.exitFullscreen
            ) {

                await document.exitFullscreen();

            }

        }

    } catch (error) {

        console.warn(
            "WebMovies: Fullscreen unavailable.",
            error
        );

    }

}


fullscreenButton.addEventListener(
    "click",
    function () {

        toggleFullscreen();

    }
);


/* =========================================================
   FULLSCREEN BUTTON STATE
========================================================= */

document.addEventListener(
    "fullscreenchange",
    function () {

        if (document.fullscreenElement) {

            fullscreenButton.textContent =
                "⛶";

        } else {

            fullscreenButton.textContent =
                "⛶";

        }

    }
);


/* =========================================================
   LOADING STATE
========================================================= */

function showLoader() {

    videoLoader.classList.add(
        "active"
    );

}


function hideLoader() {

    videoLoader.classList.remove(
        "active"
    );

}


/* =========================================================
   VIDEO EVENTS
========================================================= */

videoPlayer.addEventListener(
    "loadstart",
    function () {

        showLoader();

    }
);


videoPlayer.addEventListener(
    "waiting",
    function () {

        showLoader();

    }
);


videoPlayer.addEventListener(
    "canplay",
    function () {

        hideLoader();

    }
);


videoPlayer.addEventListener(
    "playing",
    function () {

        hideLoader();

        videoContainer.classList.add(
            "video-started"
        );

        updatePlayButton();

    }
);


videoPlayer.addEventListener(
    "pause",
    function () {

        updatePlayButton();

    }
);


videoPlayer.addEventListener(
    "play",
    function () {

        videoContainer.classList.add(
            "video-started"
        );

        updatePlayButton();

    }
);


videoPlayer.addEventListener(
    "timeupdate",
    function () {

        updateTimeDisplay();

        updateProgress();

    }
);


videoPlayer.addEventListener(
    "durationchange",
    function () {

        updateTimeDisplay();

    }
);


videoPlayer.addEventListener(
    "loadedmetadata",
    function () {

        hideLoader();

        updateTimeDisplay();

        updateProgress();

        restorePlaybackPosition();

    }
);


videoPlayer.addEventListener(
    "ended",
    function () {

        updatePlayButton();

        savePlaybackPosition();

        showControls();

    }
);


/* =========================================================
   ERROR HANDLING
========================================================= */

videoPlayer.addEventListener(
    "error",
    function () {

        hideLoader();

        console.error(
            "WebMovies: Video could not be loaded."
        );

    }
);


/* =========================================================
   RESTORE PLAYBACK
========================================================= */

function restorePlaybackPosition() {

    const saved =
        getSavedPlaybackPosition();

    if (!saved) {
        return;
    }

    if (!videoPlayer.duration) {
        return;
    }

    /*
       Don't restore a position if the
       saved position is almost at the end.
    */

    if (
        saved.position >=
        videoPlayer.duration - 5
    ) {

        return;

    }

    try {

        videoPlayer.currentTime =
            Math.min(
                saved.position,
                videoPlayer.duration
            );

        resumeInformation.hidden =
            false;

    } catch (error) {

        console.warn(
            "WebMovies: Could not restore position.",
            error
        );

    }

}


/* =========================================================
   AUTO SAVE PLAYBACK
========================================================= */

let lastSavedTime = 0;

videoPlayer.addEventListener(
    "timeupdate",
    function () {

        const now =
            Date.now();

        /*
           Save approximately every
           5 seconds instead of every
           tiny timeupdate event.
        */

        if (
            now - lastSavedTime >=
            5000
        ) {

            savePlaybackPosition();

            lastSavedTime =
                now;

        }

    }
);


window.addEventListener(
    "beforeunload",
    function () {

        savePlaybackPosition();

    }
);


/* =========================================================
   PLAYER CONTROLS VISIBILITY
========================================================= */

let controlsTimer = null;


function showControls() {

    videoContainer.classList.remove(
        "controls-hidden"
    );

    clearTimeout(
        controlsTimer
    );

    if (!videoPlayer.paused) {

        controlsTimer =
            setTimeout(
                hideControls,
                3000
            );

    }

}


function hideControls() {

    if (
        videoPlayer.paused
    ) {

        return;

    }

    closeAllPanels();

    videoContainer.classList.add(
        "controls-hidden"
    );

}


videoContainer.addEventListener(
    "mousemove",
    function () {
        showControls();
    }
);

// Mobile touch gestures: tap to toggle controls, double tap to seek 10s
let lastTapTime = 0;
let lastTapX = 0;
let tapTimeout = null;

function showSeekRipple(direction, seconds) {
    const existing = videoContainer.querySelectorAll(".seek-ripple");
    existing.forEach(el => el.remove());

    const ripple = document.createElement("div");
    ripple.className = "seek-ripple " + direction;
    const badge = document.createElement("div");
    badge.className = "seek-ripple-badge";
    badge.textContent = direction === "left" ? `↶ ${seconds}s` : `${seconds}s ↷`;
    ripple.appendChild(badge);
    videoContainer.appendChild(ripple);

    requestAnimationFrame(() => {
        ripple.style.opacity = "1";
        setTimeout(() => {
            ripple.style.opacity = "0";
            setTimeout(() => ripple.remove(), 250);
        }, 550);
    });
}

videoContainer.addEventListener("click", function (event) {
    // If click was inside controls or popups, don't toggle video controls
    if (event.target.closest("#videoControls") || event.target.closest(".player-popup") || event.target.closest(".center-play-button")) {
        return;
    }

    const now = Date.now();
    const rect = videoContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const isDoubleTap = (now - lastTapTime < 320) && (Math.abs(clickX - lastTapX) < 90);

    if (isDoubleTap) {
        clearTimeout(tapTimeout);
        tapTimeout = null;
        const isLeft = clickX < rect.width * 0.45;
        const isRight = clickX > rect.width * 0.55;

        if (isLeft) {
            seekCombinedTime(getCombinedCurrentTime() - 10);
            showSeekRipple("left", 10);
        } else if (isRight) {
            seekCombinedTime(getCombinedCurrentTime() + 10);
            showSeekRipple("right", 10);
        } else {
            togglePlay();
        }
        showControls();
    } else {
        lastTapTime = now;
        lastTapX = clickX;
        tapTimeout = setTimeout(() => {
            // Single tap: toggle controls visibility
            const isHidden = videoContainer.classList.contains("controls-hidden");
            if (isHidden) {
                showControls();
            } else {
                hideControls();
            }
        }, 280);
    }
});

// Prevent controls hiding while user drags the progress bar
if (progressBar) {
    progressBar.addEventListener("input", () => {
        showControls();
        clearTimeout(controlsTimeout);
    });
    progressBar.addEventListener("change", () => {
        showControls();
    });
}


/* =========================================================
   OPEN / CLOSE PANELS
========================================================= */

function closeAllPanels() {

    settingsPanel.hidden =
        true;

    audioPanel.hidden =
        true;

    subtitlePanel.hidden =
        true;

    if (qualityPanel) {
        qualityPanel.hidden = true;
    }

    if (videoSizePanel) {
        videoSizePanel.hidden = true;
    }

}


settingsButton.addEventListener(
    "click",
    function (event) {

        event.stopPropagation();

        const wasHidden =
            settingsPanel.hidden;

        closeAllPanels();

        settingsPanel.hidden =
            !wasHidden;

        showControls();

    }
);


audioButton.addEventListener(
    "click",
    function (event) {

        event.stopPropagation();

        const wasHidden =
            audioPanel.hidden;

        closeAllPanels();

        audioPanel.hidden =
            !wasHidden;

        showControls();

    }
);


subtitleButton.addEventListener(
    "click",
    function (event) {

        event.stopPropagation();

        const wasHidden =
            subtitlePanel.hidden;

        closeAllPanels();

        subtitlePanel.hidden =
            !wasHidden;

        showControls();

    }
);


closeSettings.addEventListener(
    "click",
    function () {

        settingsPanel.hidden =
            true;

    }
);


closeAudio.addEventListener(
    "click",
    function () {

        audioPanel.hidden =
            true;

    }
);


closeSubtitles.addEventListener(
    "click",
    function () {

        subtitlePanel.hidden =
            true;

    }
);

if (closeQuality) {
    closeQuality.addEventListener("click", function () {
        qualityPanel.hidden = true;
    });
}

const videoSizes = {
    fit: { label: "Best Fit", className: "video-size-fit" },
    fill: { label: "Fill Screen", className: "video-size-fill" },
    wide: { label: "Wide 16:9", className: "video-size-wide" },
    ultrawide: { label: "Ultrawide 21:9", className: "video-size-ultrawide" },
    compact: { label: "Compact", className: "video-size-compact" },
    stretch: { label: "Stretch", className: "video-size-stretch" }
};

function applyVideoSize(sizeName) {
    const size = videoSizes[sizeName] || videoSizes.fit;
    Object.values(videoSizes).forEach(option => {
        videoContainer.classList.remove(option.className);
    });
    videoContainer.classList.add(size.className);
    videoSizeValue.textContent = size.label;
    localStorage.setItem("webmovies-video-size", sizeName);

    document.querySelectorAll("#videoSizeTracks .selection-item").forEach(button => {
        const active = button.dataset.videoSize === sizeName;
        button.classList.toggle("active", active);
        button.querySelector("span:last-child").textContent = active ? "✓" : "";
    });
}

applyVideoSize(localStorage.getItem("webmovies-video-size") || "fit");

videoSizeOption.addEventListener("click", function (event) {
    event.stopPropagation();
    const wasHidden = videoSizePanel.hidden;
    closeAllPanels();
    videoSizePanel.hidden = !wasHidden;
    showControls();
});

closeVideoSize.addEventListener("click", function () {
    videoSizePanel.hidden = true;
});

document.querySelectorAll("#videoSizeTracks .selection-item").forEach(function (button) {
    button.addEventListener("click", function () {
        applyVideoSize(button.dataset.videoSize);
        videoSizePanel.hidden = true;
        showControls();
    });
});

// Quality track selection
document.querySelectorAll("#qualityTracks .selection-item").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
        e.stopPropagation();
        document.querySelectorAll("#qualityTracks .selection-item").forEach(function (b) {
            b.classList.remove("active");
            b.querySelector("span:last-child").textContent = "";
        });
        btn.classList.add("active");
        btn.querySelector("span:last-child").textContent = "\u2713";
        if (qualityPanel) qualityPanel.hidden = true;

        if (typeof qualityValue !== "undefined" && qualityValue) {
            qualityValue.textContent = btn.dataset.quality === "auto" ? "Auto" : btn.dataset.quality;
        }

        showControls();
        console.log("Quality switched to: " + btn.dataset.quality);
    });
});

/* =========================================================
   PLAYBACK SPEED
========================================================= */

const playbackSpeeds = [
    0.5,
    0.75,
    1,
    1.25,
    1.5,
    1.75,
    2
];

let currentSpeedIndex = 2;


playbackSpeedOption.addEventListener(
    "click",
    function () {

        currentSpeedIndex =
            (
                currentSpeedIndex + 1
            ) %
            playbackSpeeds.length;

        const speed =
            playbackSpeeds[
            currentSpeedIndex
            ];

        videoPlayer.playbackRate =
            speed;

        speedValue.textContent =
            `${speed}×`;

    }
);


/* =========================================================
   QUALITY
========================================================= */

/*
   A real quality selector will be connected
   when we provide multiple video sources.

   For now it correctly displays Auto.
*/

qualityOption.addEventListener(
    "click",
    function (event) {
        event.stopPropagation();
        const wasHidden = qualityPanel.hidden;
        closeAllPanels();
        qualityPanel.hidden = !wasHidden;
        showControls();
    }
);


/* =========================================================
   AUDIO TRACKS
========================================================= */

function getAvailableAudioTracks() {
    const list = [];

    // 1. From playerData.audioTracks
    if (Array.isArray(playerData.audioTracks) && playerData.audioTracks.length > 0) {
        playerData.audioTracks.forEach((t, i) => {
            if (typeof t === "string") {
                list.push({ name: t, language: t, id: String(i) });
            } else if (t && typeof t === "object") {
                list.push({
                    name: t.name || t.label || t.language || ("Audio " + (i + 1)),
                    language: t.language || "",
                    url: t.url || t.src || "",
                    id: String(i)
                });
            }
        });
    }

    // 2. From native HTML5 audioTracks (Safari, Edge, and supported browsers)
    const targetPlayer = activePlayer || videoPlayer;
    if (targetPlayer && targetPlayer.audioTracks && targetPlayer.audioTracks.length > 0) {
        for (let i = 0; i < targetPlayer.audioTracks.length; i++) {
            const at = targetPlayer.audioTracks[i];
            const name = at.label || (at.language ? at.language.toUpperCase() : ("Audio Track " + (i + 1)));
            if (!list.some(item => item.name === name)) {
                list.push({
                    name,
                    language: at.language || "",
                    nativeIndex: i,
                    nativeTrack: at,
                    id: "native-" + i
                });
            }
        }
    }

    // 3. If no tracks provided, return empty list (player auto-detects from server)
    return list;

    return list;
}

let currentAudioTrackId = null;

let externalAudioEl = null;

function cleanupExternalAudio() {
    if (externalAudioEl) {
        if (externalAudioEl._syncInterval) clearInterval(externalAudioEl._syncInterval);
        externalAudioEl.pause();
        externalAudioEl.removeAttribute("src");
        externalAudioEl.load();
        externalAudioEl = null;
    }
}

function syncExternalAudio() {
    const target = activePlayer || videoPlayer;
    if (externalAudioEl && target) {
        if (Math.abs(externalAudioEl.currentTime - target.currentTime) > 0.3) {
            externalAudioEl.currentTime = target.currentTime;
        }
    }
}

function renderAudioTracks() {
    if (!audioTracks) return;
    audioTracks.innerHTML = "";

    const tracks = getAvailableAudioTracks();

    // Show audio button if tracks exist (keep button accessible on mobile)
    if (audioButton) {
        audioButton.style.display = tracks.length > 1 ? "flex" : (tracks.length === 1 ? "flex" : "none");
    }

    if (!currentAudioTrackId && tracks.length > 0) {
        currentAudioTrackId = tracks[0].id;
    }

    tracks.forEach(function (track, index) {
        const button = document.createElement("button");
        button.type = "button";
        const isActive = currentAudioTrackId ? (track.id === currentAudioTrackId) : (index === 0);
        button.className = "selection-item" + (isActive ? " active" : "");

        button.innerHTML = `
            <span>${escapeHtml(track.name)}</span>
            <span>${isActive ? "✓" : ""}</span>
        `;

        button.addEventListener("click", function () {
            selectAudioTrack(track, button);
        });

        audioTracks.appendChild(button);
    });
}

function selectAudioTrack(track, button) {
    currentAudioTrackId = track.id;
    const targetPlayer = activePlayer || videoPlayer;

    // Clean up any previously attached external audio
    cleanupExternalAudio();

    // 1. If native audioTracks supported (Safari / modern WebKit)
    if (targetPlayer && targetPlayer.audioTracks && targetPlayer.audioTracks.length > 0) {
        targetPlayer.muted = false;
        const targetIndex = track.nativeIndex !== undefined ? track.nativeIndex : (track.streamIndex !== undefined ? track.streamIndex : 0);
        for (let i = 0; i < targetPlayer.audioTracks.length; i++) {
            targetPlayer.audioTracks[i].enabled = (i === targetIndex);
        }
    } else if (track.url && targetPlayer) {
        // 2. External audio stream sync
        targetPlayer.muted = true;
        externalAudioEl = new Audio(track.url);
        externalAudioEl.currentTime = targetPlayer.currentTime;
        externalAudioEl.volume = targetPlayer.volume || 1;
        if (!targetPlayer.paused) {
            externalAudioEl.play().catch(() => {});
        }
        targetPlayer.addEventListener("seeked", syncExternalAudio);
        targetPlayer.addEventListener("play", function () {
            if (externalAudioEl) {
                externalAudioEl.currentTime = targetPlayer.currentTime;
                externalAudioEl.play().catch(() => {});
            }
        });
        targetPlayer.addEventListener("pause", function () {
            if (externalAudioEl) externalAudioEl.pause();
        });
        targetPlayer.addEventListener("ratechange", function () {
            if (externalAudioEl) externalAudioEl.playbackRate = targetPlayer.playbackRate;
        });
        externalAudioEl._syncInterval = setInterval(syncExternalAudio, 2500);
    } else {
        // Default track
        if (targetPlayer) targetPlayer.muted = false;
    }

    // Update UI active state
    document.querySelectorAll("#audioTracks .selection-item").forEach(item => {
        item.classList.remove("active");
        const chk = item.querySelector("span:last-child");
        if (chk) chk.textContent = "";
    });

    button.classList.add("active");
    const check = button.querySelector("span:last-child");
    if (check) check.textContent = "✓";

    showPlayerToast("Audio: " + track.name);
}

/* =========================================================
   SUBTITLE TRACKS
========================================================= */

function getAvailableSubtitleTracks() {
    const list = [];

    // 1. From playerData.subtitleTracks
    if (Array.isArray(playerData.subtitleTracks) && playerData.subtitleTracks.length > 0) {
        playerData.subtitleTracks.forEach((t, i) => {
            if (typeof t === "string") {
                list.push({ name: t, url: t, id: String(i) });
            } else if (t && typeof t === "object") {
                list.push({
                    name: t.name || t.label || t.language || ("Subtitle " + (i + 1)),
                    language: t.language || "",
                    url: t.url || t.src || "",
                    id: String(i)
                });
            }
        });
    }

    // 2. From embedded textTracks in video player
    const targetPlayer = activePlayer || videoPlayer;
    if (targetPlayer && targetPlayer.textTracks && targetPlayer.textTracks.length > 0) {
        for (let i = 0; i < targetPlayer.textTracks.length; i++) {
            const tt = targetPlayer.textTracks[i];
            const name = tt.label || (tt.language ? tt.language.toUpperCase() : ("Embedded Subtitle " + (i + 1)));
            if (!list.some(item => item.name === name)) {
                list.push({
                    name,
                    language: tt.language || "",
                    nativeIndex: i,
                    id: "textTrack-" + i
                });
            }
        }
    }

    // 3. Only return real detected/provided tracks
    return list;

    return list;
}

let currentSubtitleId = "off";

function renderSubtitleTracks() {
    if (!subtitleTracks) return;
    subtitleTracks.innerHTML = "";

    const tracks = getAvailableSubtitleTracks();

    // Show/hide subtitle button based on whether subtitles exist
    if (subtitleButton) {
        subtitleButton.style.display = tracks.length > 0 ? "flex" : "none";
    }

    const isOffActive = (currentSubtitleId === "off");

    const offButton = document.createElement("button");
    offButton.type = "button";
    offButton.className = "selection-item" + (isOffActive ? " active" : "");
    offButton.innerHTML = `
        <span>Off</span>
        <span>${isOffActive ? "✓" : ""}</span>
    `;

    offButton.addEventListener("click", function () {
        disableSubtitles();
        setActiveSubtitleButton(offButton);
    });

    subtitleTracks.appendChild(offButton);

    tracks.forEach(function (track) {
        const button = document.createElement("button");
        button.type = "button";
        const isActive = (currentSubtitleId === track.id);
        button.className = "selection-item" + (isActive ? " active" : "");

        button.innerHTML = `
            <span>${escapeHtml(track.name)}</span>
            <span>${isActive ? "✓" : ""}</span>
        `;

        button.addEventListener("click", function () {
            selectSubtitleTrack(track, button);
        });

        subtitleTracks.appendChild(button);
    });
}

function selectSubtitleTrack(track, button) {
    currentSubtitleId = track.id;
    const targetPlayer = activePlayer || videoPlayer;

    if (targetPlayer) {
        // 1. If native textTrack exists
        if (track.nativeIndex !== undefined && targetPlayer.textTracks) {
            for (let i = 0; i < targetPlayer.textTracks.length; i++) {
                targetPlayer.textTracks[i].mode = (i === track.nativeIndex) ? "showing" : "hidden";
            }
        } else if (track.url) {
            // 2. External subtitle file (.vtt or .srt)
            const oldTracks = targetPlayer.querySelectorAll("track.custom-subtitle-track");
            oldTracks.forEach(t => t.remove());

            const trackEl = document.createElement("track");
            trackEl.className = "custom-subtitle-track";
            trackEl.kind = "subtitles";
            trackEl.label = track.name || "Subtitles";
            trackEl.srclang = track.language || "en";
            trackEl.src = track.url;
            trackEl.default = true;
            targetPlayer.appendChild(trackEl);

            if (trackEl.track) {
                trackEl.track.mode = "showing";
            }
        } else if (targetPlayer.textTracks && targetPlayer.textTracks.length > 0) {
            // Try enabling first available text track
            targetPlayer.textTracks[0].mode = "showing";
        }
    }

    setActiveSubtitleButton(button);
    showPlayerToast("Subtitles: " + track.name);
}

function disableSubtitles() {
    currentSubtitleId = "off";
    const targetPlayer = activePlayer || videoPlayer;
    if (targetPlayer && targetPlayer.textTracks) {
        for (let i = 0; i < targetPlayer.textTracks.length; i++) {
            targetPlayer.textTracks[i].mode = "hidden";
        }
    }
    if (targetPlayer) {
        const customTracks = targetPlayer.querySelectorAll("track.custom-subtitle-track");
        customTracks.forEach(t => t.remove());
    }
    showPlayerToast("Subtitles: Off");
}

function setActiveSubtitleButton(activeButton) {
    document.querySelectorAll("#subtitleTracks .selection-item").forEach(button => {
        button.classList.remove("active");
        const check = button.querySelector("span:last-child");
        if (check) check.textContent = "";
    });

    activeButton.classList.add("active");
    const check = activeButton.querySelector("span:last-child");
    if (check) check.textContent = "✓";
}

/* =========================================================
   PLAYER TOAST NOTIFICATION
========================================================= */

function showPlayerToast(message) {
    let toast = document.getElementById("playerToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "playerToast";
        toast.style.cssText = "position:absolute; top:24px; left:50%; transform:translateX(-50%); background:rgba(18,18,18,0.92); color:#fff; padding:8px 18px; border-radius:24px; font-size:13px; font-weight:600; letter-spacing:0.3px; border:1px solid rgba(255,255,255,0.18); box-shadow:0 4px 18px rgba(0,0,0,0.6); pointer-events:none; z-index:9999; transition:opacity 0.25s ease; opacity:0;";
        const container = document.getElementById("videoContainer") || document.body;
        container.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = "0";
    }, 2200);
}

/* =========================================================
   DOWNLOAD
========================================================= */

function downloadCurrentMedia() {

    const downloadUrl =
        playerData.download ||
        playerData.video;


    if (!downloadUrl) {

        alert(
            "Download file has not been connected yet."
        );

        return;

    }


    const link =
        document.createElement(
            "a"
        );

    link.href =
        downloadUrl;

    link.download =
        playerData.title ||
        "WebMovies-video";

    link.target =
        "_blank";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

}


playerDownload.addEventListener(
    "click",
    downloadCurrentMedia
);

downloadOption.addEventListener(
    "click",
    downloadCurrentMedia
);


/* =========================================================
   BACK BUTTON
========================================================= */

playerBack.addEventListener(
    "click",
    function () {

        savePlaybackPosition();

        if (
            window.history.length > 1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../index.html";

        }

    }
);


/* =========================================================
   SERIES EPISODE BUTTONS
========================================================= */

previousEpisode.addEventListener(
    "click",
    function () {

        if (
            typeof playerData.previousEpisodeUrl ===
            "string" &&
            playerData.previousEpisodeUrl
        ) {

            window.location.href =
                playerData.previousEpisodeUrl;

        }

    }
);


nextEpisode.addEventListener(
    "click",
    function () {

        if (
            typeof playerData.nextEpisodeUrl ===
            "string" &&
            playerData.nextEpisodeUrl
        ) {

            window.location.href =
                playerData.nextEpisodeUrl;

        }

    }
);

const previousEpisodeInfo =
    document.getElementById("previousEpisodeInfo");

const nextEpisodeInfo =
    document.getElementById("nextEpisodeInfo");

if (previousEpisodeInfo) {

    previousEpisodeInfo.addEventListener("click", () => {
        if (playerData.previousEpisodeUrl) {
            window.location.href = playerData.previousEpisodeUrl;
        }
    });

}

if (nextEpisodeInfo) {

    nextEpisodeInfo.addEventListener("click", () => {
        if (playerData.nextEpisodeUrl) {
            window.location.href = playerData.nextEpisodeUrl;
        }
    });

}


/* =========================================================
   APPLY PLAYER DATA
========================================================= */

function applyPlayerData() {

    document.title =
        `${playerData.title || "WebMovies Player"} - WebMovies`;


    videoTitle.textContent =
        playerData.title ||
        "WebMovies Player";


    videoType.textContent =
        (
            playerData.type ||
            "Movie"
        ).toUpperCase();


    videoYear.textContent =
        playerData.year ||
        "—";


    videoRating.textContent =
        playerData.rating
            ? `★ ${playerData.rating}`
            : "—";


    videoQuality.textContent =
        playerData.quality ||
        "HD";


    videoDescription.textContent =
        playerData.description ||
        "";


    if (playerData.poster) {

        videoPoster.src =
            playerData.poster;

        videoPoster.style.display = "block";
    } else {
        videoPoster.style.display = "none";
    }

    if (playerData.series) {
        seriesInformation.hidden = false;
        seriesTitle.textContent = playerData.seriesName || "Unknown Series";
        seasonTitle.textContent = `Season ${playerData.season || 1}`;
        episodeTitle.textContent = `Episode ${playerData.episode || 1}`;
    } else {
        seriesInformation.hidden = true;
    }

    if (playerData.previousEpisodeUrl) {
        previousEpisode.hidden = false;
        if (previousEpisodeInfo) {
            previousEpisodeInfo.disabled = false;
        }
    } else {
        previousEpisode.hidden = true;
        if (previousEpisodeInfo) {
            previousEpisodeInfo.disabled = true;
        }
    }

    if (playerData.nextEpisodeUrl) {
        nextEpisode.hidden = false;
        if (nextEpisodeInfo) {
            nextEpisodeInfo.disabled = false;
        }
    } else {
        nextEpisode.hidden = true;
        if (nextEpisodeInfo) {
            nextEpisodeInfo.disabled = true;
        }
    }

    renderAudioTracks();
    renderSubtitleTracks();
    prepareMultiPartPlayback();
}

async function prepareMultiPartPlayback() {
    // Track video play event in analytics
    try {
        fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "play", page: "/player" })
        }).catch(() => {});
    } catch (_) {}

    partCount = playerData.parts || 1;
    isMultiPart = partCount > 1;
    currentPartIndex = 0;
    partDurations = new Array(partCount).fill(0);
    totalCombinedDuration = 0;

    activePlayer = videoPlayer;
    inactivePlayer = secondaryVideoPlayer;

    let videoUrl = playerData.video || "";

    // Resolve media info and detected audio/subtitle tracks from server
    const mediaQueryId = playerData.id || (videoUrl.startsWith("/api/media/") ? videoUrl.replace(/^\/api\/media\//, "").split("?")[0] : "");
    if (mediaQueryId) {
        try {
            const infoRes = await fetch(`/api/media/${encodeURIComponent(mediaQueryId)}?info=1`);
            if (infoRes.ok) {
                const infoJson = await infoRes.json();
                if (infoJson.media && infoJson.media.streamUrl) {
                    videoUrl = infoJson.media.streamUrl;
                    playerData.video = videoUrl;
                }
                if (Array.isArray(infoJson.audioTracks) && infoJson.audioTracks.length > 0) {
                    playerData.audioTracks = infoJson.audioTracks;
                }
                if (Array.isArray(infoJson.subtitleTracks) && infoJson.subtitleTracks.length > 0) {
                    playerData.subtitleTracks = infoJson.subtitleTracks;
                }
                renderAudioTracks();
                renderSubtitleTracks();
            }
        } catch (e) {
            console.warn("Could not resolve media info:", e);
        }
    }

    // --- Google Drive detection: use iframe embed instead of <video> ---
    if ((isDriveUrl(videoUrl) || isYouTubeUrl(videoUrl)) && driveEmbedFrame) {
        const embedUrl = isYouTubeUrl(videoUrl) ? getYouTubeEmbedUrl(videoUrl) : getDriveEmbedUrl(videoUrl);
        if (embedUrl) {
            isDriveEmbed = true;
            videoPlayer.style.display = "none";
            secondaryVideoPlayer.style.display = "none";

            // Hide poster and native controls, bring Drive player to front
            if (videoContainer) videoContainer.classList.add("video-started");
            if (videoPoster) videoPoster.style.display = "none";

            driveEmbedFrame.src = embedUrl;
            driveEmbedFrame.style.cssText = "display:block; border:none; background:#000; position:absolute; top:0; left:0; width:100%; height:100%; z-index:10;";

            const vc = document.getElementById("videoControls");
            if (vc) vc.style.display = "none";
            const vl = document.getElementById("videoLoader");
            if (vl) vl.style.display = "none";
            const cp = document.getElementById("centerPlayButton");
            if (cp) cp.style.display = "none";
            return;
        }
    }

    isDriveEmbed = false;
    activePlayer.src = getPartUrl(0);
    activePlayer.style.display = "block";
    inactivePlayer.style.display = "none";

    setupVideoEvents(activePlayer);
    setupVideoEvents(inactivePlayer);

    if (isMultiPart) {
        for (let i = 0; i < partCount; i++) {
            try {
                const dur = await fetchPartDuration(i);
                partDurations[i] = dur;
                totalCombinedDuration += dur;
            } catch (err) {
                console.warn(`Could not fetch duration for part ${i}`, err);
            }
        }
        updateTimeDisplay();
        updateProgress();
        restorePlaybackPosition();
    }
}

function fetchPartDuration(index) {
    return new Promise((resolve, reject) => {
        const tempVid = document.createElement("video");
        tempVid.preload = "metadata";
        tempVid.onloadedmetadata = () => {
            resolve(tempVid.duration);
        };
        tempVid.onerror = reject;
        tempVid.src = getPartUrl(index);
    });
}

function setupVideoEvents(playerEl) {
    playerEl.addEventListener("timeupdate", () => {
        if (playerEl === activePlayer) {
            updateTimeDisplay();
            updateProgress();
        }
    });

    playerEl.addEventListener("ended", () => {
        if (playerEl === activePlayer) {
            handleVideoEnded();
        }
    });

    playerEl.addEventListener("play", () => {
        if (playerEl === activePlayer) {
            hidePoster();
            videoContainer.classList.add("video-started");
            updatePlayButton();
            hideControls();
        }
    });

    playerEl.addEventListener("pause", () => {
        if (playerEl === activePlayer) {
            updatePlayButton();
            showControls();
        }
    });

    playerEl.addEventListener("loadedmetadata", () => {
        if (playerEl === activePlayer && !isMultiPart) {
            restorePlaybackPosition();
        }
        renderAudioTracks();
        renderSubtitleTracks();
    });
}

/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

document.addEventListener("keydown", function (event) {
    const isInput =
        event.target.tagName.toLowerCase() === "input" ||
        event.target.tagName.toLowerCase() === "textarea";

    if (isInput) {
        return;
    }

    showControls();

    switch (event.key) {
        case " ":
        case "k":
        case "K":
            event.preventDefault();
            togglePlay();
            break;

        case "ArrowLeft":
            event.preventDefault();
            seekCombinedTime(getCombinedCurrentTime() - 5);
            break;

        case "ArrowRight":
            event.preventDefault();
            seekCombinedTime(getCombinedCurrentTime() + 5);
            break;

        case "m":
        case "M":
            activePlayer.muted = !activePlayer.muted;
            updateMuteButton();
            break;

        case "f":
        case "F":
            toggleFullscreen();
            break;

        case "Escape":
            closeAllPanels();
            showControls();
            break;
    }
});



/* =========================================================
   ESCAPE CLICK OUTSIDE POPUPS
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const clickedInsidePopup =
            event.target.closest(
                ".player-popup"
            );

        const clickedControl =
            event.target.closest(
                ".control-button"
            );


        if (
            !clickedInsidePopup &&
            !clickedControl
        ) {

            closeAllPanels();

        }

    }
);


/* =========================================================
   ESCAPE WHEN PAGE IS HIDDEN
========================================================= */

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.hidden
        ) {

            savePlaybackPosition();

        }

    }
);


/* =========================================================
   UTILITY: ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializePlayer() {

    videoPlayer.volume =
        1;

    videoPlayer.muted =
        false;

    videoPlayer.playbackRate =
        1;


    updateMuteButton();

    updatePlayButton();

    updateTimeDisplay();

    updateProgress();

    applyPlayerData();

    showControls();

}


/* =========================================================
   START
========================================================= */

initializePlayer();
