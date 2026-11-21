#!/usr/bin/env node
// lingyi-tools-mcp — stdio transport (MCP JSON-RPC over stdio)
import { createInterface } from "node:readline";
import { handleMessage } from "../lib/http-handler.mjs";

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", (line) => {
  const text = line.trim();
  if (!text) return;
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n");
    return;
  }
  const res = handleMessage(msg);
  if (res !== null) {
    process.stdout.write(JSON.stringify(res) + "\n");
  }
});
