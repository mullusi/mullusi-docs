/*
Purpose: validate the static Mullusi docs package before deployment.
Governance scope: local links, static search index, sitemap targets, public-safe text, and required files.
Dependencies: Node.js standard library only.
Invariants: validation is deterministic, dependency-free, and exits nonzero on any blocking finding.
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const failures = [];

const requiredFiles = [
  "index.html",
  "README.md",
  "CNAME",
  "robots.txt",
  "sitemap.xml",
  "assets/styles.css",
  "assets/search.js",
  "data/search-index.json",
  "docs/architecture.html",
  "docs/api.html",
  "docs/tutorials.html",
  "docs/governance.html",
  "docs/launch.html",
  "docs/mfidel.html",
  "docs/search.html",
];

function readUtf8(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function recordFailure(message) {
  failures.push(message);
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function htmlFiles() {
  const docFiles = fs
    .readdirSync(path.join(repoRoot, "docs"))
    .filter((fileName) => fileName.endsWith(".html"))
    .map((fileName) => `docs/${fileName}`)
    .sort();
  return ["index.html", ...docFiles];
}

function localTargetPath(sourceFile, url) {
  const cleanUrl = url.split("#")[0];
  if (cleanUrl.length === 0) {
    return sourceFile;
  }
  if (cleanUrl === "/") {
    return "index.html";
  }
  if (cleanUrl.startsWith("/")) {
    return cleanUrl.slice(1);
  }
  return path.normalize(path.join(path.dirname(sourceFile), cleanUrl)).replaceAll("\\", "/");
}

function idsForHtmlFile(relativePath) {
  const html = readUtf8(relativePath);
  const ids = new Set();
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
    ids.add(match[1]);
  }
  return ids;
}

function validateRequiredFiles() {
  for (const requiredFile of requiredFiles) {
    if (!pathExists(requiredFile)) {
      recordFailure(`required_file_missing:${requiredFile}`);
    }
  }
}

function validatePublicText() {
  const blockedPatterns = [
    /\bartificial intelligence\b/i,
    /\bAI\b/,
    /gho_[A-Za-z0-9_]+/,
    /github_pat_[A-Za-z0-9_]+/,
    /BEGIN RSA PRIVATE KEY/,
    /BEGIN OPENSSH PRIVATE KEY/,
    /client_secret\s*[:=]/i,
    /password\s*[:=]/i,
    /api[_-]?key\s*[:=]/i,
    /token\s*[:=]/i,
  ];
  const textFiles = [
    ...requiredFiles,
    ".github/workflows/validate.yml",
  ].filter(pathExists);

  for (const textFile of textFiles) {
    const content = readUtf8(textFile);
    for (const pattern of blockedPatterns) {
      if (pattern.test(content)) {
        recordFailure(`blocked_public_text:${textFile}:${pattern}`);
      }
    }
  }
}

function validateHtmlLinks() {
  const idsByFile = new Map(htmlFiles().map((fileName) => [fileName, idsForHtmlFile(fileName)]));

  for (const fileName of htmlFiles()) {
    const html = readUtf8(fileName);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = match[1];
      if (/^(https?:|mailto:)/.test(url)) {
        continue;
      }
      const target = localTargetPath(fileName, url);
      if (!pathExists(target)) {
        recordFailure(`local_link_missing:${fileName}->${url}`);
        continue;
      }
      const anchor = url.includes("#") ? url.split("#")[1] : "";
      if (anchor.length > 0 && target.endsWith(".html")) {
        const ids = idsByFile.get(target) || idsForHtmlFile(target);
        if (!ids.has(anchor)) {
          recordFailure(`local_anchor_missing:${fileName}->${url}`);
        }
      }
    }
  }
}

function validateSearchIndex() {
  const parsedIndex = JSON.parse(readUtf8("data/search-index.json"));
  if (!Array.isArray(parsedIndex.entries)) {
    recordFailure("search_index_entries_not_array");
    return;
  }
  const seenUrls = new Set();
  for (const [index, entry] of parsedIndex.entries.entries()) {
    for (const field of ["title", "section", "url", "summary"]) {
      if (typeof entry[field] !== "string" || entry[field].trim().length === 0) {
        recordFailure(`search_index_invalid_field:${index}:${field}`);
      }
    }
    if (!Array.isArray(entry.keywords)) {
      recordFailure(`search_index_keywords_not_array:${index}`);
    }
    if (typeof entry.url === "string") {
      const target = localTargetPath("index.html", entry.url);
      if (!pathExists(target)) {
        recordFailure(`search_index_target_missing:${entry.url}`);
      }
      if (seenUrls.has(entry.url)) {
        recordFailure(`search_index_duplicate_url:${entry.url}`);
      }
      seenUrls.add(entry.url);
    }
  }
}

function validateSitemap() {
  const sitemap = readUtf8("sitemap.xml");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (locs.length === 0) {
    recordFailure("sitemap_has_no_locs");
  }
  for (const loc of locs) {
    if (!loc.startsWith("https://docs.mullusi.com/")) {
      recordFailure(`sitemap_invalid_host:${loc}`);
      continue;
    }
    const url = new URL(loc);
    const target = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (!pathExists(target)) {
      recordFailure(`sitemap_target_missing:${loc}`);
    }
  }
}

function runValidation() {
  validateRequiredFiles();
  validatePublicText();
  validateHtmlLinks();
  validateSearchIndex();
  validateSitemap();

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("docs validation passed");
}

runValidation();
