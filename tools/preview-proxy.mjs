// Reverse-proxy для живого UI-тестирования через preview_*: инструмент управляет
// ЭТИМ процессом (:3006), а реальный next dev на :3002 остаётся нетронутым —
// второй next-инстанс на общем .next мог бы его дестабилизировать (Windows).
// Проксирует HTTP и WebSocket-upgrade (HMR), чтобы консоль страницы была чистой.
import http from "node:http";
import net from "node:net";

const UP_HOST = "127.0.0.1";
const UP_PORT = Number(process.env.UPSTREAM_PORT || 3002);
const PORT = Number(process.env.PORT || 3006);

const server = http.createServer((req, res) => {
  const up = http.request(
    {
      host: UP_HOST,
      port: UP_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${UP_HOST}:${UP_PORT}` },
    },
    (ur) => {
      res.writeHead(ur.statusCode ?? 502, ur.headers);
      ur.pipe(res);
    },
  );
  up.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end("upstream :" + UP_PORT + " down");
  });
  req.pipe(up);
});

// WebSocket (/_next/webpack-hmr): после upgrade — сырой TCP-туннель.
server.on("upgrade", (req, socket, head) => {
  const up = net.connect(UP_PORT, UP_HOST, () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const name = req.rawHeaders[i];
      const value =
        name.toLowerCase() === "host" ? `${UP_HOST}:${UP_PORT}` : req.rawHeaders[i + 1];
      lines.push(`${name}: ${value}`);
    }
    up.write(lines.join("\r\n") + "\r\n\r\n");
    if (head?.length) up.write(head);
    socket.pipe(up);
    up.pipe(socket);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, () => {
  console.log(`preview-proxy: http://localhost:${PORT} → http://${UP_HOST}:${UP_PORT}`);
});
