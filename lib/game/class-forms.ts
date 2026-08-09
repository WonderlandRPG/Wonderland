import type { ClassPayload } from "@/lib/game/classes";

export interface ClassActionState {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialClassActionState: ClassActionState = { status: "idle", message: "" };

export interface ClassEditorValue {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  revision: number;
  payload: ClassPayload;
}
