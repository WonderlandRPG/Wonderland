import type { ItemPayload } from "@/lib/game/items";

export interface ItemActionState {
  status: "idle" | "error";
  message: string;
}

export const initialItemActionState: ItemActionState = { status: "idle", message: "" };

export interface ItemEditorValue {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  revision: number;
  payload: ItemPayload;
}
