import { cookies } from "next/headers";
import crypto from "crypto";

export async function getOrSetUID() {
  const cookieStore = await cookies(); // ✅ now awaited
  let uid = cookieStore.get("uid")?.value;

  if (!uid) {
    uid = crypto.randomUUID();
    cookieStore.set("uid", uid, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  return uid;
}
