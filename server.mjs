// Local test server: same MCP Streamable HTTP logic over node:http
// Usage: node server.mjs [port]   (default 3000)
import { createServer } from "node:http";
import { handleJsonRpc, healthPayload } from "./lib/http-handler.mjs";

const PORT = Number(process.argv[2] || process.env.PORT || 3000);

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id",
  });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/api/health")) {
    sendJson(res, 200, healthPayload());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/mcp") {
    sendJson(res, 200, {
      ok: true,
      service: "lingyi-tools-mcp",
      transport: "streamable-http",
      note: "Send a JSON-RPC request via POST with Content-Type: application/json",
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/mcp") {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(data);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body" });
        return;
      }
      const response = handleJsonRpc(body);
      if (response === null) {
        res.writeHead(202);
        res.end();
        return;
      }
      sendJson(res, 200, response);
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`lingyi-tools-mcp listening on http://localhost:${PORT}`);
});
