// app/api/ask/route.ts
import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const LIMITS = { free: 5, paid: 50 };

async function getUserPlan(uid: string): Promise<"free" | "paid"> {
  const { data, error } = await supabaseAdmin.from("users").select("plan").eq("id", uid).single();
  if (error) {
    console.error("Error fetching user plan:", error);
    return "free"; // Fallback
  }
  return data?.plan as "free" | "paid" ?? "free";
}

async function checkUsageLimit(uid: string, plan: "free" | "paid") {
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin.from("usage_counters").select("count").eq("uid", uid).eq("day", day).single();

  if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
    console.error("Error fetching usage:", error);
    throw error;
  }

  const used = data?.count ?? 0;
  const limit = LIMITS[plan];
  return { allowed: used < limit, used, remaining: Math.max(limit - used, 0), limit };
}

async function incrementUsage(uid: string) {
  const day = new Date().toISOString().slice(0, 10);
  // Use RPC to upsert and increment safely
  const { error } = await supabaseAdmin.rpc('increment_usage', { user_id: uid, usage_day: day });
  if (error) console.error("Error incrementing usage:", error);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = session.user.id;
  const plan = await getUserPlan(uid);
  const usage = await checkUsageLimit(uid, plan);

  if (!usage.allowed) {
    return NextResponse.json({ error: `Daily limit reached` }, { status: 429 });
  }

  try {
    const { query } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(query);
    const text = result.response.text();

    await incrementUsage(uid);

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ text: "Unexpected error" }, { status: 500 });
  }
}