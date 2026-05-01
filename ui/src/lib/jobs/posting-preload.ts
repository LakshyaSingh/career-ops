export interface EvaluatePrompt {
  text: string;
  commandForLog: string;
  preflightLog?: string;
}

interface ExtractedPosting {
  source: "greenhouse" | "ashby" | "lever";
  title?: string;
  company?: string;
  location?: string;
  text: string;
}

const JD_FETCH_TIMEOUT_MS = 8_000;
const MAX_PRELOADED_JD_CHARS = 32_000;

export async function buildEvaluatePrompt(url: string): Promise<EvaluatePrompt> {
  return buildPreloadedPrompt({
    url,
    fallbackPrompt: url,
    fallbackCommandForLog: `claude -p "${url}"`,
    preloadedCommandLabel: (source) => `<preloaded ${source} JD: ${url}>`,
    promptPrefix: `/career-ops ${url}`,
    instruction: "Use the pre-extracted job description below as the source JD for the evaluation, report, tracker entry, and any generated PDF. Do not spend time refetching or rendering the URL unless this text is obviously incomplete. Preserve the original URL in the report header.",
  });
}

export async function buildPdfPrompt(url: string): Promise<EvaluatePrompt> {
  return buildPreloadedPrompt({
    url,
    fallbackPrompt: `/career-ops pdf ${url}`,
    fallbackCommandForLog: `claude -p "/career-ops pdf ${url}"`,
    preloadedCommandLabel: (source) => `<preloaded ${source} JD for PDF: ${url}>`,
    promptPrefix: `/career-ops pdf ${url}`,
    instruction: "Use the pre-extracted job description below as the source JD for tailoring the ATS PDF. Do not spend time refetching or rendering the URL unless this text is obviously incomplete. Preserve the same output quality, template, keyword injection rules, and ethical constraints from modes/pdf.md.",
  });
}

async function buildPreloadedPrompt(options: {
  url: string;
  fallbackPrompt: string;
  fallbackCommandForLog: string;
  preloadedCommandLabel: (source: ExtractedPosting["source"]) => string;
  promptPrefix: string;
  instruction: string;
}): Promise<EvaluatePrompt> {
  let posting: ExtractedPosting | null = null;
  let preloadError: string | null = null;
  const supportedUrl = isSupportedPostingUrl(options.url);
  try {
    posting = await extractPosting(options.url);
  } catch (error) {
    preloadError = error instanceof Error ? error.message : "unknown preload error";
  }

  if (!posting) {
    return {
      text: options.fallbackPrompt,
      commandForLog: options.fallbackCommandForLog,
      preflightLog: preloadError
        ? `▸ Fast JD preload unavailable (${preloadError}); falling back to URL.`
        : supportedUrl
          ? "▸ Fast JD preload found no active posting data; falling back to URL."
        : undefined,
    };
  }

  const metadata = [
    posting.company ? `Company: ${posting.company}` : null,
    posting.title ? `Role: ${posting.title}` : null,
    posting.location ? `Location: ${posting.location}` : null,
  ].filter(Boolean).join("\n");

  const body = posting.text.slice(0, MAX_PRELOADED_JD_CHARS);
  const truncated = posting.text.length > body.length
    ? "\n\n[Truncated to keep the prompt bounded. Use the original URL only if critical details are missing.]"
    : "";

  return {
    text: `${options.promptPrefix}

The job URL is: ${options.url}
${metadata ? `\n${metadata}\n` : ""}
${options.instruction}

<job_description>
${body}${truncated}
</job_description>`,
    commandForLog: `claude -p "${options.preloadedCommandLabel(posting.source)}"`,
    preflightLog: `▸ Preloaded JD via ${posting.source} (${posting.text.length.toLocaleString()} chars).`,
  };
}

function isSupportedPostingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("jobs.lever.co") ||
      parsed.hostname === "boards.greenhouse.io" ||
      parsed.hostname === "job-boards.greenhouse.io" ||
      parsed.hostname.endsWith("jobs.ashbyhq.com");
  } catch {
    return false;
  }
}

async function extractPosting(url: string): Promise<ExtractedPosting | null> {
  const parsed = new URL(url);

  if (parsed.hostname.endsWith("jobs.lever.co")) {
    return extractLeverPosting(parsed);
  }

  if (parsed.hostname === "boards.greenhouse.io" || parsed.hostname === "job-boards.greenhouse.io") {
    return extractGreenhousePosting(parsed);
  }

  if (parsed.hostname.endsWith("jobs.ashbyhq.com")) {
    return extractAshbyPosting(parsed, url);
  }

  return null;
}

async function extractLeverPosting(url: URL): Promise<ExtractedPosting | null> {
  const parts = url.pathname.split("/").filter(Boolean);
  const [company, postingId] = parts;
  if (!company || !postingId) return null;

  const posting = await fetchJson(
    `https://api.lever.co/v0/postings/${encodeURIComponent(company)}/${encodeURIComponent(postingId)}`,
  );
  const title = asString(posting.text);
  const location = asString(asRecord(posting.categories).location);
  const sections = [posting.description, posting.descriptionPlain].map(asString);

  for (const item of asArray(posting.lists)) {
    const list = asRecord(item);
    const heading = asString(list.text);
    const content = asString(list.content);
    if (heading || content) sections.push(`${heading}\n${htmlToText(content)}`.trim());
  }

  return {
    source: "lever",
    title,
    company,
    location,
    text: compactText([title, location, ...sections].join("\n\n")),
  };
}

async function extractGreenhousePosting(url: URL): Promise<ExtractedPosting | null> {
  const parts = url.pathname.split("/").filter(Boolean);
  const company = parts[0];
  const jobIndex = parts.indexOf("jobs");
  const postingId = jobIndex >= 0 ? parts[jobIndex + 1] : undefined;
  if (!company || !postingId) return null;

  if (url.hostname === "job-boards.greenhouse.io") {
    return extractGreenhousePostingHtml(url, company);
  }

  const posting = await fetchJson(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company)}/jobs/${encodeURIComponent(postingId)}?questions=true`,
  );

  const title = asString(posting.title);
  const location = asString(asRecord(posting.location).name);
  const sections = [
    title,
    location,
    htmlToText(asString(posting.content)),
    ...asArray(posting.departments).map((d) => asString(asRecord(d).name)).filter(Boolean),
    ...asArray(posting.questions).map((q) => asString(asRecord(q).label)).filter(Boolean),
  ];

  return {
    source: "greenhouse",
    title,
    company,
    location,
    text: compactText(sections.join("\n\n")),
  };
}

async function extractGreenhousePostingHtml(url: URL, company: string): Promise<ExtractedPosting | null> {
  const html = await fetchText(url.toString());
  const title = htmlDecode(extractMeta(html, "og:title"));
  const location = htmlDecode(extractMeta(html, "og:description"));
  const companyName = htmlDecode(extractJsonString(html, "company_name")) || company;
  const descriptionHtml = extractBetween(
    html,
    /<div class="job__description body">/,
    /<div class="job-alert|<div class="divider"/,
  );
  const description = htmlToText(descriptionHtml);

  if (!title || !description) return null;

  return {
    source: "greenhouse",
    title,
    company: companyName,
    location,
    text: compactText([title, location, description].join("\n\n")),
  };
}

async function extractAshbyPosting(url: URL, originalUrl: string): Promise<ExtractedPosting | null> {
  const parts = url.pathname.split("/").filter(Boolean);
  const company = parts[0];
  if (!company) return null;

  const board = await fetchJson(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company)}?includeCompensation=true`,
  );
  const jobs = asArray(board.jobs);
  const posting = jobs.map(asRecord).find((job) => {
    const jobUrl = asString(job.jobUrl);
    return jobUrl === originalUrl || normalizeUrl(jobUrl) === normalizeUrl(originalUrl);
  });
  if (!posting) return null;

  const title = asString(posting.title);
  const location = asString(posting.location);
  const sections = [
    title,
    location,
    htmlToText(asString(posting.descriptionHtml)),
    asString(posting.descriptionPlain),
    asString(posting.compensationTierSummary),
    ...asArray(posting.compensationTiers).map((tier) => compactText([
      asString(asRecord(tier).title),
      asString(asRecord(tier).summary),
    ].join("\n"))),
  ];

  return {
    source: "ashby",
    title,
    company,
    location,
    text: compactText(sections.join("\n\n")),
  };
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JD_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return asRecord(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JD_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function htmlToText(value: string): string {
  return htmlDecode(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function extractMeta(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"));
  return match?.[1] ?? "";
}

function extractJsonString(html: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`"${escaped}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "i"));
  if (!match?.[1]) return "";

  return match[1]
    .replace(/\\"/g, "\"")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\\//g, "/");
}

function extractBetween(html: string, start: RegExp, end: RegExp): string {
  const startMatch = start.exec(html);
  if (!startMatch) return "";

  const rest = html.slice(startMatch.index);
  const endMatch = end.exec(rest);
  return endMatch ? rest.slice(0, endMatch.index) : rest;
}

function htmlDecode(value: string): string {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function compactText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/[#?].*$/, "").replace(/\/$/, "");
  }
}
