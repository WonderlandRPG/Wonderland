export interface CharacterActionState {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialCharacterActionState: CharacterActionState = { status: "idle", message: "" };
