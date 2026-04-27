import { promises as fs } from "node:fs";
import { paths } from "./paths";

export async function readCV(): Promise<{ content: string; exists: boolean }> {
  try {
    const content = await fs.readFile(paths.cv(), "utf8");
    return { content, exists: true };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { content: "", exists: false };
    }
    throw e;
  }
}

export async function writeCV(content: string): Promise<void> {
  await fs.writeFile(paths.cv(), content, "utf8");
}
