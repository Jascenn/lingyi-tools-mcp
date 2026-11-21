import { TOOL_DEFS, callTool, getToolCount, getCategoryCount } from "./tools.mjs";

export const SERVER_INFO = { name: "lingyi-tools-mcp", version: "1.3.0" };
export const DEFAULT_PROTOCOL = "2025-03-26";

function ok(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function err(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function toolResult(payload) {
  return { content: [{ type: "text", text: JSON.stringify(payload) }], isError: false };
}

function toolError(message) {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
}

// Handle one parsed JSON-RPC message.
// Returns: response object, null for notifications (no response).
export function handleMessage(msg) {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const isNotification = msg.id === undefined;

  try {
    switch (msg.method) {
      case "initialize": {
        const p = msg.params || {};
        return ok(msg.id, {
          protocolVersion: p.protocolVersion || DEFAULT_PROTOCOL,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });
      }
      case "notifications/initialized":
        return null;
      case "ping":
        return ok(msg.id, {});
      case "tools/list":
        return ok(msg.id, { tools: TOOL_DEFS });
      case "tools/call": {
        const params = msg.params || {};
        if (!params.name) return err(msg.id, -32602, "Invalid params: tools/call requires 'name'");
        try {
          const payload = callTool(params.name, params.arguments || {});
          return ok(msg.id, toolResult(payload));
        } catch (e) {
          return ok(msg.id, toolError(e.message));
        }
      }
      default:
        if (isNotification) return null;
        return err(msg.id, -32601, `Method not found: ${msg.method}`);
    }
  } catch (e) {
    if (isNotification) return null;
    return err(msg.id, -32603, `Internal error: ${e.message}`);
  }
}

// Handle the body of a Streamable-HTTP POST. Accepts a single JSON-RPC
// message object or an array (batch). Returns a single response object /
// array, or null when there is nothing to reply to (pure notifications).
export function handleJsonRpc(body) {
  if (Array.isArray(body)) {
    const responses = body.map(handleMessage).filter((r) => r !== null);
    return responses.length ? responses : null;
  }
  return handleMessage(body);
}

export function healthPayload() {
  return {
    ok: true,
    service: SERVER_INFO.name,
    version: SERVER_INFO.version,
    tools: getToolCount(),
    categories: getCategoryCount(),
  };
}
