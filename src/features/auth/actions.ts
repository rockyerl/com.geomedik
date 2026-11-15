"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "./dto";
import { login, logout } from "./service";
import { getSession } from "@/lib/auth/session";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      fieldErrors[field] = issue.message;
    }
    return {
      success: false,
      error: "Mohon periksa data input Anda",
      fieldErrors,
    };
  }

  let result: Awaited<ReturnType<typeof login>>;
  try {
    result = await login(validation.data);
  } catch (err) {
    console.error("[LOGIN ACTION ERROR]", err);
    return {
      success: false,
      error: "Terjadi gangguan koneksi basis data saat memverifikasi akun. Silakan coba kembali.",
    };
  }

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Gagal masuk ke sistem",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  await logout(session?.userId, session?.email);
  redirect("/login");
}
