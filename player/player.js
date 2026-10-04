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
   MULTI-PART TIMELINE HELPERS
========================================================= */

function getPartUrl(index) {
    if (!playerData.video) return "";
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


videoContainer.addEventListener(
    "touchstart",
    function () {

        showControls();

    },
    {
        passive: true
    }
);


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
    fit: { label: "Fit", className: "video-size-fit" },
    fill: { label: "Fill", className: "video-size-fill" },
    wide: { label: "Wide", className: "video-size-wide" },
    classic: { label: "4:3", className: "video-size-classic" }
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

function renderAudioTracks() {

    audioTracks.innerHTML = "";

    const tracks =
        Array.isArray(
            playerData.audioTracks
        )
            ? playerData.audioTracks
            : [];


    if (!tracks.length) {

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "selection-item active";

        button.innerHTML = `
            <span>Original</span>
            <span>✓</span>
        `;

        audioTracks.appendChild(
            button
        );

        return;

    }


    tracks.forEach(
        function (track, index) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "selection-item" +
                (
                    index === 0
                        ? " active"
                        : ""
                );

            const name =
                typeof track === "string"
                    ? track
                    : track.name ||
                    track.language ||
                    `Audio ${index + 1}`;


            button.innerHTML = `
                <span>${escapeHtml(name)}</span>
                <span>
                    ${index === 0 ? "✓" : ""}
                </span>
            `;


            button.addEventListener(
                "click",
                function () {

                    selectAudioTrack(
                        track,
                        button
                    );

                }
            );


            audioTracks.appendChild(
                button
            );

        }
    );

}


function selectAudioTrack(
    track,
    button
) {

    /*
       This is intentionally prepared
       for multiple audio tracks.

       Browser video elements do not
       automatically switch between
       separate audio files.

       Later we can connect this to
       HLS/DASH or our backend player.
    */

    document
        .querySelectorAll(
            "#audioTracks .selection-item"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );

    button.classList.add(
        "active"
    );

}


/* =========================================================
   SUBTITLE TRACKS
========================================================= */

function renderSubtitleTracks() {

    subtitleTracks.innerHTML = "";

    const offButton =
        document.createElement(
            "button"
        );

    offButton.type =
        "button";

    offButton.className =
        "selection-item active";

    offButton.innerHTML = `
        <span>Off</span>
        <span>✓</span>
    `;


    offButton.addEventListener(
        "click",
        function () {

            disableSubtitles();

            setActiveSubtitleButton(
                offButton
            );

        }
    );


    subtitleTracks.appendChild(
        offButton
    );


    const tracks =
        Array.isArray(
            playerData.subtitleTracks
        )
            ? playerData.subtitleTracks
            : [];


    tracks.forEach(
        function (track, index) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "selection-item";


            const name =
                typeof track === "string"
                    ? track
                    : track.name ||
                    track.language ||
                    `Subtitle ${index + 1}`;


            button.innerHTML = `
                <span>${escapeHtml(name)}</span>
                <span></span>
            `;


            button.addEventListener(
                "click",
                function () {

                    selectSubtitleTrack(
                        track,
                        button
                    );

                }
            );


            subtitleTracks.appendChild(
                button
            );

        }
    );

}


function selectSubtitleTrack(
    track,
    button
) {

    const trackUrl =
        typeof track === "string"
            ? track
            : track.url;


    if (!trackUrl) {

        return;

    }


    const existingTracks =
        videoPlayer.querySelectorAll(
            "track"
        );


    existingTracks.forEach(
        item => item.remove()
    );


    const subtitleTrack =
        document.createElement(
            "track"
        );


    subtitleTrack.kind =
        "subtitles";

    subtitleTrack.label =
        typeof track === "string"
            ? track
            : (
                track.name ||
                track.language ||
                "Subtitle"
            );

    subtitleTrack.src =
        trackUrl;

    subtitleTrack.default =
        true;


    videoPlayer.appendChild(
        subtitleTrack
    );


    if (
        subtitleTrack.track
    ) {

        subtitleTrack.track.mode =
            "showing";

    }


    setActiveSubtitleButton(
        button
    );

}


function disableSubtitles() {

    const tracks =
        videoPlayer.textTracks;

    for (
        let i = 0;
        i < tracks.length;
        i++
    ) {

        tracks[i].mode =
            "disabled";

    }

}


function setActiveSubtitleButton(
    activeButton
) {

    document
        .querySelectorAll(
            "#subtitleTracks .selection-item"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

                const check =
                    button.querySelector(
                        "span:last-child"
                    );

                if (check) {
                    check.textContent = "";
                }

            }
        );


    activeButton.classList.add(
        "active"
    );


    const check =
        activeButton.querySelector(
            "span:last-child"
        );

    if (check) {

        check.textContent =
            "✓";

    }

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
    partCount = playerData.parts || 1;
    isMultiPart = partCount > 1;
    currentPartIndex = 0;
    partDurations = new Array(partCount).fill(0);
    totalCombinedDuration = 0;

    activePlayer = videoPlayer;
    inactivePlayer = secondaryVideoPlayer;

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
