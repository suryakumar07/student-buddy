// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Supabase client (service role for server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function today() {
  return new Date().toISOString().split("T")[0]; // yyyy-mm-dd
}

async function incrementUsage(uid: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("increment_usage", {
    uid_input: uid,
    day_input: today(),
  });

  if (error) {
    console.error("Error incrementing usage:", error);
    throw error;
  }

  return data; // new count value
}

export async function POST(req: Request) {
  try {
    const { uid, message } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    // Get today’s usage count
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("usage_counters")
      .select("count")
      .eq("uid", uid)
      .eq("day", today())
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // Ignore "no rows found" error
      console.error("Error fetching usage count:", fetchError);
    }

    const currentCount = existing?.count || 0;

    // Free users limited to 5 requests/day
    if (currentCount >= 5) {
      return NextResponse.json(
        { error: "Daily free limit reached. Please upgrade to continue." },
        { status: 403 }
      );
    }

    // Increment usage counter
    const newCount = await incrementUsage(uid);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);

    return NextResponse.json({
      response: result.response.text(),
      usage: newCount,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
