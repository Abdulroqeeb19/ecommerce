import { execFile } from "child_process";
import path from "path";

const ffmpeg = "ffmpeg";
const dir = "C:\\Users\\user\\Desktop\\2in1 Ecommerce\\deliverables";
const shotDir = path.join(dir, "screenshots");
const shots = [
  "title-intro.png",
  path.join(shotDir, "01-home.png"),
  path.join(shotDir, "02-shop.png"),
  path.join(shotDir, "03-school-mini-store.png"),
  path.join(shotDir, "04-product-detail.png"),
  path.join(shotDir, "05-checkout.png"),
  path.join(shotDir, "06-account.png"),
  path.join(shotDir, "07-wishlist.png"),
  path.join(shotDir, "08-compare.png"),
  path.join(shotDir, "09-contact.png"),
  path.join(shotDir, "10-admin-login.png"),
  path.join(shotDir, "11-admin-dashboard.png"),
  "title-outro.png",
];

const FPS = 25;
const FADE = 0.5;
const SHOT_DUR = 1.6;
const CARD_DUR = 2.0;

const inputs = [];
const durations = shots.map((s, i) => (i === 0 || i === shots.length - 1 ? CARD_DUR : SHOT_DUR));
const parts = [];

for (let i = 0; i < shots.length; i++) {
  inputs.push("-i", shots[i].includes(path.sep) ? shots[i] : path.join(dir, shots[i]));
  const d = Math.round(durations[i] * FPS);
  parts.push(
    `[${i}:v]scale=5760:3240:force_original_aspect_ratio=increase,crop=5760:3240,` +
    `zoompan=z='1+0.0012*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:s=1920x1080:fps=${FPS},setsar=1[v${i}]`
  );
}

let last = "v0";
let offset = durations[0] - FADE;
for (let k = 1; k < shots.length; k++) {
  const out = k === shots.length - 1 ? "vout" : `vx${k}`;
  parts.push(`[${last}][v${k}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}[${out}]`);
  offset += durations[k] - FADE;
  last = out;
}

const filterComplex = parts.join(";");
const args = [
  "-y",
  ...inputs,
  "-filter_complex", filterComplex,
  "-map", "[vout]",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "20",
  "-pix_fmt", "yuv420p",
  "-r", String(FPS),
  "-movflags", "+faststart",
  path.join(dir, "gadget-hub-status.mp4"),
];

const out = path.join(dir, "gadget-hub-status.mp4");
const totalDur = durations.reduce((a, b) => a + b, 0) - (shots.length - 1) * FADE;
console.log(`Rendering ${totalDur.toFixed(1)}s video, ${shots.length} segments...`);

execFile(ffmpeg, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
  if (err) {
    console.error("FFMPEG FAILED:", err.message);
    console.error(stderr.split("\n").filter((l) => /error/i.test(l)).slice(-15).join("\n"));
    process.exit(1);
  }
  console.log("Video written: " + out);
});
