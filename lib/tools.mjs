import tools from "../data/tools-merged.json" with { type: "json" };
import categories from "../data/categories.json" with { type: "json" };

export function getToolCount() {
  return tools.length;
}

export function getCategoryCount() {
  return categories.length;
}

// The directory is published in six languages; every tool page exists in each
const LANGUAGE_PREFIXES = { zh: "", en: "/en", "zh-Hant": "/zh-hant", ja: "/ja", ko: "/ko", es: "/es" };

function pageLinks(id) {
  return Object.fromEntries(
    Object.entries(LANGUAGE_PREFIXES).map(([lang, prefix]) => [lang, `https://lingyi.tools${prefix}/tools/${id}`])
  );
}

function summary(t) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    pricing: t.pricing,
    featured: !!t.featured,
    url: t.url,
    pageLinks: pageLinks(t.id),
    ...(t.listedOn ? { listedOn: t.listedOn } : {}),
    ...(t.languages?.length ? { languages: t.languages } : {}),
  };
}

function fullEntry(t) {
  return { ...summary(t), tags: t.tags, logo: t.logo };
}

function clampLimit(limit, def = 10, max = 25) {
  if (limit === undefined || limit === null) return def;
  const n = Number(limit);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(Math.floor(n), max);
}

function matches(t, q) {
  if (!q) return true;
  const needle = String(q).toLowerCase();
  const hay = [
    t.name,
    t.description?.zh,
    t.description?.en,
    ...(t.tags?.zh || []),
    ...(t.tags?.en || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function search_tools({ query, category, pricing, limit } = {}) {
  let res = tools.filter(
    (t) =>
      matches(t, query) &&
      (!category || t.category === category) &&
      (!pricing || t.pricing === pricing)
  );
  res.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.id - b.id);
  return res.slice(0, clampLimit(limit)).map(summary);
}

export function get_tool({ id, name } = {}) {
  if (id !== undefined && id !== null && id !== "") {
    const t = tools.find((x) => String(x.id) === String(id));
    if (!t) throw new Error(`Tool not found: id=${id}`);
    return fullEntry(t);
  }
  if (name !== undefined && name !== null && name !== "") {
    const needle = String(name).toLowerCase();
    const t = tools.find((x) => String(x.name).toLowerCase() === needle);
    if (!t) throw new Error(`Tool not found: name=${name}`);
    return fullEntry(t);
  }
  throw new Error("get_tool requires one of: id, name");
}

export function list_categories() {
  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    toolCount: tools.filter((t) => t.category === c.id).length,
  }));
}

export function list_featured({ limit } = {}) {
  const res = tools
    .filter((t) => t.featured)
    .sort((a, b) => a.id - b.id);
  return res.slice(0, clampLimit(limit)).map(summary);
}

export function latest_tools({ limit } = {}) {
  const res = [...tools].sort((a, b) => {
    if (a.listedOn && b.listedOn) return b.listedOn < a.listedOn ? -1 : b.listedOn > a.listedOn ? 1 : a.id - b.id;
    if (a.listedOn) return -1;
    if (b.listedOn) return 1;
    return b.id - a.id;
  });
  return res.slice(0, clampLimit(limit)).map((t) => summary(t));
}

// All five tools only read the published directory snapshot: they never
// mutate anything, are safe to repeat, and never reach external systems.
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export const TOOL_DEFS = [
  {
    name: "search_tools",
    description:
      "Search the LingYi Tools AI directory (bilingual zh/en) by keyword, category, or pricing. Featured tools are ranked first.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword matched against name, descriptions and tags (zh + en)" },
        category: { type: "string", description: "Category id, e.g. chatbot, imageGeneration, codeAssistant" },
        pricing: { type: "string", description: "Pricing filter, e.g. free, freemium, paid" },
        limit: { type: "integer", description: "Max results, default 10, max 25" },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "get_tool",
    description: "Get the full entry of one tool by id or name, including zh/en description, tags, and detail page links.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: ["integer", "string"], description: "Tool id (e.g. 1)" },
        name: { type: "string", description: "Exact tool name (e.g. ChatGPT)" },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "list_categories",
    description: "List all 16 tool categories with tool counts in each.",
    inputSchema: { type: "object", properties: {} },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "list_featured",
    description: "List featured tools from the LingYi Tools directory.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max results, default 10, max 25" },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "latest_tools",
    description: "List the latest tools by listing date (falls back to id order when no date is set).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max results, default 10, max 25" },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
];

export function callTool(name, args = {}) {
  switch (name) {
    case "search_tools":
      return search_tools(args);
    case "get_tool":
      return get_tool(args);
    case "list_categories":
      return list_categories();
    case "list_featured":
      return list_featured(args);
    case "latest_tools":
      return latest_tools(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
