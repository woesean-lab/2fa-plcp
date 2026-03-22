import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import http from "node:http";

const port = Number(process.env.PORT || 3000);
const distDir = join(process.cwd(), "dist");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(response, filePath) {
  const extension = extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
}

function sendNotBuilt(response) {
  response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Build output was not found. `npm run build` must run first.");
}

const server = http.createServer((request, response) => {
  const requestedPath = request.url ? request.url.split("?")[0] : "/";
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(distDir, safePath === "/" ? "index.html" : safePath);

  if (!existsSync(distDir)) {
    sendNotBuilt(response);
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(response, filePath);
    return;
  }

  const fallback = join(distDir, "index.html");
  if (existsSync(fallback)) {
    sendFile(response, fallback);
    return;
  }

  sendNotBuilt(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Static server listening on ${port}`);
});
