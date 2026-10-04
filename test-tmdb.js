const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/TMDB_BEARER_TOKEN\s*=\s*"?([^"\n]+)"?/);
if (!match) {
    console.log("No token found");
    process.exit(1);
}
const token = match[1].trim();

fetch('https://api.themoviedb.org/3/search/movie?query=Inception', {
    headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    if (data.status_code) {
        console.log("TMDB Error:", data.status_message);
    } else if (data.results) {
        console.log("TMDB Success! Found:", data.results.length);
    } else {
        console.log("Unknown response:", data);
    }
})
.catch(console.error);
