"use server";

import { redirect } from "next/navigation";
import { clearCurrentUserCookie } from "@/lib/auth";

export async function logoutAction() {
  await clearCurrentUserCookie();
  redirect("/login");
}
