import fs from "node:fs";
import path from "node:path";
import http from "node:http";
const html = fs.readFileSync("index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const p = match[1];
  if (/^(https?:|tel:|mailto:)/.test(p)) continue;
  if (!fs.existsSync(p)) throw new Error("Missing asset: " + p);
}
for (const anchor of html.matchAll(/href="#([^"]+)"/g))
  if (!html.includes(`id="${anchor[1]}"`))
    throw new Error("Missing anchor: " + anchor[1]);
fs.mkdirSync("dist", { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "favicon.svg",
  "CREDITS.md",
])
  fs.copyFileSync(file, path.join("dist", file));
fs.cpSync("assets", "dist/assets", { recursive: true });
console.log("Production build passed: local assets and anchors validated.");
if (process.argv.includes("--serve")) {
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".md": "text/plain",
  };
  http
    .createServer((req, res) => {
      const f = path.resolve(
        "dist",
        "." +
          decodeURIComponent(
            req.url.split("?")[0] === "/"
              ? "/index.html"
              : req.url.split("?")[0],
          ),
      );
      if (!f.startsWith(path.resolve("dist") + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      try {
        res.setHeader(
          "Content-Type",
          types[path.extname(f)] || "application/octet-stream",
        );
        res.end(fs.readFileSync(f));
      } catch {
        res.writeHead(404).end("Not found");
      }
    })
    .listen(4173, () => console.log("http://localhost:4173"));
}
