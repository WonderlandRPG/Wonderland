"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/auth/actions";
import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { idleAuthState } from "@/lib/auth/forms";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState(updateProfileAction, idleAuthState);

  return (
    <form className="profile-form" action={action} noValidate>
      <FormNotice state={state} />
      <label className="form-field">
        <span>Nome de exibição</span>
        <input
          autoComplete="nickname"
          defaultValue={displayName}
          maxLength={32}
          name="displayName"
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          required
        />
        <FieldError state={state} field="displayName" />
      </label>
      <SubmitButton idleLabel="Salvar perfil" pendingLabel="Salvando" />
    </form>
  );
}
