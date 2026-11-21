# lingyi-tools-mcp

[![mcptry](https://mcptry.com/badge/io.github.Jascenn/lingyi-tools-mcp)](https://mcptry.com/servers/io.github.Jascenn/lingyi-tools-mcp)

MCP server for the LingYi Tools AI directory (https://lingyi.tools): 171 curated AI tools with bilingual (zh/en) descriptions.

这是 LingYi 工具导航站的 MCP Server，把 171 个 AI 工具目录数据做成 AI 可调用的工具。

## Tools (5)

- `search_tools` — search by keyword (matched against name, zh/en descriptions and tags), optional `category` id, `pricing`, `limit` (default 10, max 25); featured tools ranked first
- `get_tool` — full entry by `id` or `name`, including zh/en detail page links
- `list_categories` — all 16 categories with tool counts
- `list_featured` — featured tools, optional `limit`
- `latest_tools` — latest tools by listing date (falls back to id order), optional `limit`

Data source: https://lingyi.tools (built-in snapshot in `data/`, 171 tools / 16 categories).

## Connect

Remote (Streamable HTTP, recommended — requires the deployment step to be done):

```json
{
  "mcpServers": {
    "lingyi-tools": {
      "url": "https://lingyi-tools-mcp.vercel.app/api/mcp"
    }
  }
}
```

Local stdio via npx: upcoming — the npm package is not published yet. After publish you will be able to use:

```json
{
  "mcpServers": {
    "lingyi-tools": {
      "command": "npx",
      "args": ["-y", "lingyi-tools-mcp"]
    }
  }
}
```

## Local test

Zero dependencies, Node 20+ only.

```sh
npm run start:http            # start local server on :3000
curl -s -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Or stdio:

```sh
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.0.0"}}}' \
 | npm run --silent start:stdio
```

## Registry submission

`server.json` follows the MCP Registry schema (2025-12-11) and is ready for `mcp-publisher publish`. The `remotes[0].url` is a placeholder — verify the actual deployment domain before publishing.

## License

MIT
