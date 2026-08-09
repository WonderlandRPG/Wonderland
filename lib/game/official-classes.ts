import officialClassData from "@/lib/game/official-classes.json";
import { classPayloadSchema } from "@/lib/game/schemas";

export const officialClasses = officialClassData.map((entry) => ({
  name: entry.name,
  slug: entry.slug,
  payload: classPayloadSchema.parse(entry.payload),
}));
