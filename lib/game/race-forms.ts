import type { RacePayload } from "@/lib/game/races";

export type RaceActionStatus = "idle" | "error";

export interface RaceActionState {
  status: RaceActionStatus;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialRaceActionState: RaceActionState = {
  status: "idle",
  message: "",
};

export interface RaceEditorValue {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  revision: number;
  payload: RacePayload;
}
