// convert-mkv.js – Converts all MKV files in data/uploads to seekable MP4
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { spawn } = require("child_process");

const UPLOADS_DIR = path.join(__dirname, "data", "uploads");

async function convertAll() {
  const files = fs.readdirSync(UPLOADS_DIR);
  const mkvFiles = files.filter(f => f.endsWith(".mkv") && fs.statSync(path.join(UPLOADS_DIR, f)).size > 1000);
  
  if (mkvFiles.length === 0) {
    console.log("No MKV files to convert.");
    return;
  }

  console.log(`\nFound ${mkvFiles.length} MKV file(s) to convert using ffmpeg at ${ffmpegPath}:\n`);

  for (const mkv of mkvFiles) {
    const inputPath = path.join(UPLOADS_DIR, mkv);
    const mp4Name = mkv.replace(/\.mkv$/i, ".mp4");
    const outputPath = path.join(UPLOADS_DIR, mp4Name);

    // Skip if MP4 already exists
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      console.log(`  ✅ SKIP ${mkv} → ${mp4Name} (already converted)`);
      continue;
    }

    const sizeMB = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(0);
    console.log(`  🔄 Converting ${mkv} (${sizeMB} MB) → ${mp4Name} ...`);

    try {
      await new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, [
          "-i", inputPath,
          "-c", "copy",
          "-movflags", "+faststart",
          outputPath,
          "-y"
        ], { stdio: "inherit" });

        proc.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg exited with code ${code}`));
        });
      });
      
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        console.log(`  ✅ Done: ${mp4Name}`);
        // Optionally delete the original MKV to save space:
        // fs.unlinkSync(inputPath);
      } else {
        console.log(`  ❌ Failed: output file is too small or missing`);
      }
    } catch (err) {
      console.error(`  ❌ Error converting ${mkv}:`, err.message);
    }
  }

  console.log("\n--- Conversion complete ---\n");
}

convertAll();
