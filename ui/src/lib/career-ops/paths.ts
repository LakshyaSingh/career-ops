import path from "node:path";

/**
 * Resolves the parent career-ops repo root.
 * The UI lives in `<repo>/ui/`, so we walk one level up.
 *
 * Honors `CAREER_OPS_ROOT` env override for unusual setups.
 */
export function repoRoot(): string {
  if (process.env.CAREER_OPS_ROOT) {
    return path.resolve(process.env.CAREER_OPS_ROOT);
  }
  return path.resolve(process.cwd(), "..");
}

export const paths = {
  cv: () => path.join(repoRoot(), "cv.md"),
  profile: () => path.join(repoRoot(), "config", "profile.yml"),
  profileExample: () => path.join(repoRoot(), "config", "profile.example.yml"),
  modesProfile: () => path.join(repoRoot(), "modes", "_profile.md"),
  modesProfileTemplate: () => path.join(repoRoot(), "modes", "_profile.template.md"),
  portals: () => path.join(repoRoot(), "portals.yml"),
  portalsExample: () => path.join(repoRoot(), "templates", "portals.example.yml"),
  applications: () => path.join(repoRoot(), "data", "applications.md"),
  pipeline: () => path.join(repoRoot(), "data", "pipeline.md"),
  scanHistory: () => path.join(repoRoot(), "data", "scan-history.tsv"),
  reportsDir: () => path.join(repoRoot(), "reports"),
  outputDir: () => path.join(repoRoot(), "output"),
  trackerAdditionsDir: () => path.join(repoRoot(), "batch", "tracker-additions"),
};
