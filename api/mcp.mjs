// Vercel Serverless Function — MCP Streamable HTTP (stateless)
import { handleJsonRpc } from "../lib/http-handler.mjs";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve(undefined);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      service: "lingyi-tools-mcp",
      transport: "streamable-http",
      note: "Send a JSON-RPC request via POST with Content-Type: application/json",
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  let body = req.body;
  if (body === undefined || body === null || body === "") {
    try {
      body = await readBody(req);
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
  }
  if (body === undefined) {
    res.status(400).json({ error: "Empty body: expected a JSON-RPC message" });
    return;
  }

  const response = handleJsonRpc(body);
  res.setHeader("Content-Type", "application/json");
  if (response === null) {
    res.status(202).end();
    return;
  }
  res.status(200).send(JSON.stringify(response));
}
