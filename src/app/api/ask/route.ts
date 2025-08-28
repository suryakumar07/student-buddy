import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrSetUID } from "@/lib/uid";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Define plan limits
const LIMITS = {
  free: 5,   // Free users = 5 requests/day
  paid: 50,  // Paid users = 50 requests/day
};

async function getUserPlan(uid: string): Promise<"free" | "paid"> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("plan")
    .eq("uid", uid)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user plan:", error);
    return "free"; // fallback
  }

  return (data?.plan as "free" | "paid") ?? "free";
}

async function checkUsageLimit(uid: string, plan: "free" | "paid") {
  const day = today();

  const { data, error } = await supabaseAdmin
    .from("usage_counters")
    .select("count")
    .eq("uid", uid)
    .eq("day", day)
    .maybeSingle();

  if (error) {
    console.error("Error fetching usage:", error);
    throw error;
  }

  const used = data?.count ?? 0;
  const limit = LIMITS[plan];

  return {
    allowed: used < limit,
    used,
    remaining: Math.max(limit - used, 0),
    limit,
  };
}

async function incrementUsage(uid: string) {
  const day = today();

  // Upsert with count + 1
  const { data, error } = await supabaseAdmin
    .from("usage_counters")
    .upsert(
      { uid, day, count: 1 }, // insert if not exists
      { onConflict: "uid,day" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error incrementing usage:", error);
    throw error;
  }

  // If row existed → increment
  const newCount = (data?.count ?? 0) + (data?.count ? 1 : 0);

  if (data?.count) {
    const { error: updateErr } = await supabaseAdmin
      .from("usage_counters")
      .update({ count: newCount })
      .eq("uid", uid)
      .eq("day", day);

    if (updateErr) {
      console.error("Error updating usage count:", updateErr);
    }
  }

  return newCount;
}

export async function POST(req: NextRequest) {
  const uid = await getOrSetUID();
  const plan = await getUserPlan(uid);

  const usage = await checkUsageLimit(uid, plan);

  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Daily limit reached (${usage.limit} requests for ${plan} plan). Please wait or upgrade.` },
      { status: 429 }
    );
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(query);
    const text = result.response.text();

    console.log("Incoming query:", query);

    const newCount = await incrementUsage(uid);

    return NextResponse.json({
      text,
      used: newCount,
      remaining: usage.limit - newCount,
      limit: usage.limit,
      plan,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Gemini API error:", error);
      return NextResponse.json({ text: "Error: " + error.message }, { status: 500 });
    }
    return NextResponse.json({ text: "Unexpected error" }, { status: 500 });
  }
}
