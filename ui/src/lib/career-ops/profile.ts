import { promises as fs } from "node:fs";
import yaml from "js-yaml";
import { paths } from "./paths";

/**
 * Subset of the profile.yml schema that the structured UI form edits.
 * Anything NOT in this shape (archetypes, proof_points, etc.) is preserved
 * verbatim on save — the UI only touches the fields it owns.
 */
export interface ProfileBasics {
  candidate?: {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio_url?: string;
    github?: string;
    twitter?: string;
  };
  target_roles?: {
    primary?: string[];
  };
  narrative?: {
    headline?: string;
    exit_story?: string;
    superpowers?: string[];
  };
  compensation?: {
    target_range?: string;
    currency?: string;
    minimum?: string;
    location_flexibility?: string;
  };
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
    visa_status?: string;
  };
}

interface RawProfile extends Record<string, unknown> {}

async function readRaw(opts: { fallbackToExample: boolean } = { fallbackToExample: false }): Promise<{ data: RawProfile; exists: boolean }> {
  try {
    const text = await fs.readFile(paths.profile(), "utf8");
    const data = (yaml.load(text) ?? {}) as RawProfile;
    return { data, exists: true };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      if (opts.fallbackToExample) {
        // On WRITE we seed from the example so untouched advanced fields
        // (archetypes, proof_points) get sensible starter values the user
        // can edit later via Claude Code or directly.
        try {
          const example = await fs.readFile(paths.profileExample(), "utf8");
          return { data: (yaml.load(example) ?? {}) as RawProfile, exists: false };
        } catch {
          return { data: {}, exists: false };
        }
      }
      // On READ for the form, hand back an empty object so the user sees
      // empty fields, not "Jane Smith" placeholders.
      return { data: {}, exists: false };
    }
    throw e;
  }
}

export async function readProfile(): Promise<{
  basics: ProfileBasics;
  exists: boolean;
}> {
  const { data, exists } = await readRaw();
  return { basics: data as unknown as ProfileBasics, exists };
}

/**
 * Merge form values into the existing profile and write back. Untouched
 * top-level keys (and untouched nested keys we don't know about) survive.
 */
export async function writeProfileBasics(basics: ProfileBasics): Promise<void> {
  const { data: existing } = await readRaw({ fallbackToExample: true });
  const merged: RawProfile = { ...existing };

  // For the sections we own, merge our keys on top of whatever's there so
  // unrelated nested keys (e.g. archetypes inside target_roles) survive.
  for (const section of [
    "candidate",
    "target_roles",
    "narrative",
    "compensation",
    "location",
  ] as const) {
    const incoming = basics[section];
    if (incoming === undefined) continue;
    merged[section] = {
      ...((existing[section] as Record<string, unknown>) ?? {}),
      ...incoming,
    };
  }

  // Strip undefined / empty-string leaves so YAML stays clean.
  const cleaned = stripEmpty(merged);

  const yamlText = yaml.dump(cleaned, {
    lineWidth: 100,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true,
  });
  const banner =
    "# Career-Ops Profile Configuration\n# Edited via the local UI. Other fields (archetypes, proof_points, etc.)\n# are preserved as-is on save — feel free to edit them in your editor or\n# via Claude Code.\n\n";
  await fs.writeFile(paths.profile(), banner + yamlText, "utf8");
}

function stripEmpty(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    const arr = obj
      .map(stripEmpty)
      .filter((v) => v !== undefined && v !== "" && v !== null);
    return arr.length ? arr : undefined;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const cleaned = stripEmpty(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (obj === "" || obj === null) return undefined;
  return obj;
}
