import { z } from "zod";

const requiredText = (label: string) => z.string().trim().min(1, `${label} é obrigatório.`);

export const emailSchema = requiredText("O e-mail")
  .pipe(z.email("Digite um endereço de e-mail válido."))
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .regex(/[A-Za-zÀ-ÿ]/, "Inclua pelo menos uma letra.")
  .regex(/[0-9]/, "Inclua pelo menos um número.");

export const loginSchema = z.object({
  email: emailSchema,
  password: requiredText("A senha"),
});

export const signUpSchema = z
  .object({
    displayName: requiredText("O nome")
      .min(2, "Use pelo menos 2 caracteres.")
      .max(32, "Use no máximo 32 caracteres."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: requiredText("A confirmação da senha"),
    acceptedTerms: z.literal("on", {
      error: "Você precisa aceitar as regras de convivência e o uso dos dados da conta.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não são iguais.",
    path: ["confirmPassword"],
  });

export const recoverySchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: requiredText("A confirmação da senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não são iguais.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  displayName: requiredText("O nome")
    .min(2, "Use pelo menos 2 caracteres.")
    .max(32, "Use no máximo 32 caracteres."),
});
