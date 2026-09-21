const https = require("https");
const fs = require("fs");

const ids = [
  "N5fvV08uRDY", "hmsebjbRb1k", "khbeNdxgEVs", "_b8qt1fRtnM", "lKSvy2jP1gc",
  "9WGtuzEyb4s", "AvMgfjv14B0", "BLNHOgy_HCI", "9EtV6Bb7Vfg", "fj1KcQdlV9Y",
  "9kTlI-9o84Q", "Gef1KePPRoI", "1WZHvPhWx1E", "DaXGQ7JaOhQ", "NDcfq0RgYtg",
  "wItpqhhOFXE", "rBQ4cGuwohM", "BddP6PYo2gs", "1mDWhw54yC4", "hBqxCILVLxQ", "vhwmR4LcHpM"
];

async function getMeta(id) {
  return new Promise((resolve) => {
    https.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ id, title: parsed.title, author: parsed.author_name });
        } catch {
          resolve({ id, title: "Track " + id, author: "Bollywood" });
        }
      });
    }).on("error", () => resolve({ id, title: "Track " + id, author: "Bollywood" }));
  });
}

(async () => {
  const results = [];
  for (const id of ids) {
    results.push(await getMeta(id));
  }
  fs.writeFileSync("user_songs.json", JSON.stringify(results, null, 2));
  console.log("Fetched " + results.length + " songs successfully.");
})();
