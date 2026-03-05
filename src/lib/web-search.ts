/**
 * Web search utility for IndiaGPT.
 *
 * Uses DuckDuckGo HTML lite (no API key required) to fetch search results
 * and injects them as context for the LLM. This gives IndiaGPT awareness
 * of real-time information like news, weather, scores, and current events.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// ---------------------------------------------------------------------------
// Search implementation
// ---------------------------------------------------------------------------

const DDG_URL = "https://html.duckduckgo.com/html/";

/**
 * Perform a web search via DuckDuckGo HTML lite and return parsed results.
 */
export async function webSearch(
  query: string,
  maxResults = 5
): Promise<SearchResult[]> {
  try {
    const response = await fetch(DDG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: new URLSearchParams({ q: query + " India", b: "" }).toString(),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!response.ok) {
      console.error(`[WebSearch] DuckDuckGo returned ${response.status}`);
      return [];
    }

    const html = await response.text();
    return parseDDGResults(html, maxResults);
  } catch (error) {
    console.error("[WebSearch] Search failed:", error);
    return [];
  }
}

/**
 * Parse DuckDuckGo HTML lite response to extract result titles, URLs,
 * and snippets.
 */
function parseDDGResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // DuckDuckGo lite wraps each result in a <div class="result ...">
  // The link is in <a class="result__a"> and snippet in <a class="result__snippet">
  const resultBlocks = html.split(/class="result\s/);

  for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
    const block = resultBlocks[i];

    // Extract URL from result__a href (DDG redirects through uddg= param)
    const hrefMatch = block.match(/class="result__a"[^>]*href="([^"]*)"/);
    if (!hrefMatch) continue;

    let url = hrefMatch[1];
    // Decode the DDG redirect URL
    const uddgMatch = url.match(/uddg=([^&]*)/);
    if (uddgMatch) {
      url = decodeURIComponent(uddgMatch[1]);
    }

    // Extract title text
    const titleMatch = block.match(
      /class="result__a"[^>]*>([\s\S]*?)<\/a>/
    );
    const title = titleMatch
      ? stripHtml(titleMatch[1]).trim()
      : "";

    // Extract snippet
    const snippetMatch = block.match(
      /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/
    );
    const snippet = snippetMatch
      ? stripHtml(snippetMatch[1]).trim()
      : "";

    if (title && url && !url.startsWith("//duckduckgo.com")) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}

/** Strip HTML tags from a string. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Query classification — does this query need a web search?
// ---------------------------------------------------------------------------

/** Keywords that indicate the user wants current/real-time information. */
const REALTIME_KEYWORDS = [
  // Time-sensitive
  "today", "tonight", "yesterday", "tomorrow",
  "this week", "this month", "this year",
  "latest", "recent", "current", "now",
  "2024", "2025", "2026",
  // News & events
  "news", "update", "announcement", "election", "result",
  "score", "match", "ipl", "cricket", "football",
  // Weather
  "weather", "temperature", "rain", "forecast", "monsoon today",
  // Finance (live data)
  "stock price", "share price", "sensex", "nifty", "market today",
  "gold price", "petrol price", "diesel price", "exchange rate",
  // Explicit search intent
  "search for", "look up", "find me", "google",
  "what happened", "who won", "is it true",
];

/** Phrases that do NOT need web search even if they contain realtime keywords. */
const EXCLUDE_PATTERNS = [
  /^(hi|hello|hey|namaste|good morning|good evening)/i,
  /^(thank|thanks|dhanyavaad|shukriya)/i,
  /^(ok|okay|sure|yes|no|bye)/i,
  /^translate/i,
  /^(what is|explain|define|tell me about)\s+(a |an |the )?(concept|meaning|definition)/i,
];

/**
 * Determine whether the user's query would benefit from a live web search.
 *
 * This is intentionally conservative — it only triggers for queries that
 * clearly reference real-time or current information.
 */
export function needsWebSearch(message: string): boolean {
  const lower = message.toLowerCase().trim();

  // Skip very short messages
  if (lower.split(/\s+/).length <= 2) return false;

  // Skip excluded patterns (greetings, thanks, etc.)
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(lower)) return false;
  }

  // Check for realtime keywords
  for (const keyword of REALTIME_KEYWORDS) {
    if (lower.includes(keyword)) return true;
  }

  // Check for question patterns about recent events
  if (/\b(when|where) (is|was|are|were|will)\b/.test(lower) && lower.includes("?")) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Format search results for LLM context
// ---------------------------------------------------------------------------

/**
 * Format search results into a context block that gets prepended to the
 * system prompt or injected as a user message.
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const formatted = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    ${r.snippet}\n    Source: ${r.url}`
    )
    .join("\n\n");

  return (
    `WEB SEARCH RESULTS (use these to provide up-to-date information):\n` +
    `─────────────────────────────────────────────────────────────────\n` +
    `${formatted}\n` +
    `─────────────────────────────────────────────────────────────────\n` +
    `INSTRUCTIONS: Use the above search results to answer the user's question ` +
    `with current, accurate information. Cite sources when appropriate by ` +
    `mentioning the source name. If the search results don't contain relevant ` +
    `information, rely on your existing knowledge but mention that the ` +
    `information may not be the most current.`
  );
}
