// =====================================================
//                  USER LOGIN SECTION
// =====================================================

// Check if a user is logged in using sessionStorage
const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

const userSection = document.getElementById("userSection");
const logoutSection = document.getElementById("logoutSection");

if (loggedInUser) {
    // Hide signup/login buttons
    document.querySelector(".signupbtn").style.display = "none";
    document.querySelector(".loginbtn").style.display = "none";

    // Create avatar and username display
    const avatar = document.createElement("div");
    const name = document.createElement("span");

    avatar.className = "user-avatar";
    avatar.textContent = loggedInUser.username.charAt(0).toUpperCase();
    name.className = "user-name";
    name.textContent = loggedInUser.username;

    userSection.appendChild(avatar);
    userSection.appendChild(name);

    // Toggle logout button
    avatar.addEventListener("click", () => {
        logoutSection.style.display = logoutSection.style.display === "none" ? "block" : "none";
    });

    // Logout button
    document.getElementById("logoutbtn").addEventListener("click", () => {
        sessionStorage.removeItem('loggedInUser'); // Clear login
        window.location.href = "login.html"; // Redirect to login
    });
} else {
    // If no user logged in, hide logout section and show buttons
    logoutSection.style.display = "none";
    document.querySelector(".signupbtn").addEventListener("click", () => {
        window.location.href = "signup.html";
    });
    document.querySelector(".loginbtn").addEventListener("click", () => {
        window.location.href = "login.html";
    });

    // Optional: redirect directly to login if not logged in
    // window.location.href = "login.html";
}

// =====================================================
//                  MUSIC PLAYER VARIABLES
// =====================================================

let currentSong = new Audio();
let songs = [];
let currFolder = "";

// =====================================================
//             UTILITY FUNCTIONS
// =====================================================

// Convert seconds to mm:ss format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2,"0")}:${String(remaining).padStart(2,"0")}`;
}

// =====================================================
//                  GET SONGS FROM FOLDER
// =====================================================

async function getSongs(folder) {
    currFolder = folder;

    let response = await fetch(`/songs/${folder}/`);
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = div.getElementsByTagName("a");
    songs = [];

    for (let a of anchors) {
        if (a.href.endsWith(".mp3")) {
            let songName = a.href.split(`/${folder}/`)[1];
            songs.push(songName);
        }
    }

    // Display songs in playlist UI
    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <div class="info">
                <div>${decodeURIComponent(song).replace(/%20/g, " ")}</div>
                <div>Ali</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
            </div>
        </li>`;
    }

    // Add click event to each song
    Array.from(songUL.getElementsByTagName("li")).forEach(li => {
        li.addEventListener("click", () => {
            const track = li.querySelector(".info div").innerText.trim();
            playMusic(track);
        });
    });

    return songs;
}

// =====================================================
//                  PLAY MUSIC
// =====================================================

function playMusic(track, pause = false) {
    currentSong.src = `/songs/${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track).replace(/%20/g," ");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// =====================================================
//                  DISPLAY ALBUMS
// =====================================================

async function displayAlbums() {
    const response = await fetch("/songs/");
    const text = await response.text();
    const div = document.createElement("div");
    div.innerHTML = text;
    const anchors = div.getElementsByTagName("a");
    const container = document.querySelector(".cardContainer");

    for (let a of anchors) {
        const url = new URL(a.href);
        const parts = url.pathname.split("/").filter(Boolean);

        // Only consider /songs/AlbumName/
        if (parts.length === 2 && parts[0] === "songs") {
            const folder = parts[1];
            try {
                const albumRes = await fetch(`/songs/${folder}/info.json`);
                const album = await albumRes.json();

                container.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <img src="img/play.svg" width="16" height="16"/>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${album.title}</h2>
                    <p>${album.description}</p>
                </div>`;
            } catch (err) {
                console.log(`Missing info.json in ${folder}`);
            }
        }
    }

    // Click event to load album songs
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            await getSongs(folder);
            playMusic(songs[0]);
        });
    });
}

// =====================================================
//                  MAIN FUNCTION
// =====================================================

async function main() {

    // Load default folder
    await getSongs("WWESongs");
    playMusic(songs[0], true);

    displayAlbums();

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update song progress
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = secondsToMinutesSeconds(currentSong.currentTime);
        const duration = secondsToMinutesSeconds(currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar click
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Next / Previous buttons
    next.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });
    previous.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index - 1 >= 0) playMusic(songs[index - 1]);
    });

    // Volume control
    const volumeInput = document.querySelector(".range input");
    volumeInput.addEventListener("input", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        const img = document.querySelector(".volume>img");
        img.src = currentSong.volume === 0 ? img.src.replace("volume.svg","mute.svg") : img.src.replace("mute.svg","volume.svg");
    });

    // Mute / Unmute
    document.querySelector(".volume>img").addEventListener("click", e => {
        const img = e.target;
        if (img.src.includes("volume.svg")) {
            img.src = img.src.replace("volume.svg","mute.svg");
            currentSong.volume = 0;
            volumeInput.value = 0;
        } else {
            img.src = img.src.replace("mute.svg","volume.svg");
            currentSong.volume = 0.1;
            volumeInput.value = 10;
        }
    });

    // Auto-play next song
    currentSong.addEventListener("ended", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
        else playMusic(songs[0]);
    });

    // Hamburger / Close (for mobile)
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
}

// Run everything
main();