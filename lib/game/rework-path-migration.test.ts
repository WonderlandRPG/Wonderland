import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { reworkClasses } from "@/lib/game/rework-catalog";

describe("Rework class path migration", () => {
  it("validates exactly the paths available in the current catalog", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20261002170527_rework_class_paths.sql"),
      "utf8",
    );
    const seed = sql.match(/insert into public\.v2_rework_class_paths \(class_slug, path_id\) values([\s\S]*?)on conflict/i);
    expect(seed).not.toBeNull();
    const migrated = [...(seed?.[1] ?? "").matchAll(/\('([^']+)', '([^']+)'\)/g)]
      .map((match) => `${match[1]}/${match[2]}`)
      .sort();
    const catalog = reworkClasses.flatMap((entry) =>
      entry.paths.map((path) => `${entry.id}/${path.id}`),
    ).sort();
    expect(migrated).toEqual(catalog);
    expect(migrated).toHaveLength(51);
  });
});
