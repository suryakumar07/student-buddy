import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrSetUID } from "@/lib/uid";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function canRequest(uid: string, limit = 5) {
  const day = today();

  const { data, error } = await supabaseAdmin
    .from("usage_counters")
    .select("count")
    .eq("uid", uid)
    .eq("day", day)
    .maybeSingle(); // safer than .single()

  if (error) {
    console.error("Error fetching usage:", error);
    return { allowed: false, count: 0 };
  }

  const used = data?.count ?? 0;
  return { allowed: used < limit, count: used };
}

async function incrementUsage(uid: string) {
  const day = today();

  const { data, error } = await supabaseAdmin
    .from("usage_counters")
    .upsert(
      [{ uid, day, count: 1 }], // wrap in array
      { onConflict: "uid,day" } // string, not array
    )
    .select()
    .single();

  if (error) {
    console.error("Error incrementing usage:", error);
    throw error;
  }

  // If this row already existed, increment count
  const newCount = (data?.count ?? 0) + (data?.count ? 1 : 0);

  if (data?.count) {
    // Update count when row already exists
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
  const { allowed, count } = await canRequest(uid, 5);

  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached (5 free uses). Please wait or upgrade." },
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

    return NextResponse.json({ text, used: newCount, remaining: 5 - newCount });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Gemini API error:", error);
      return NextResponse.json({ text: "Error: " + error.message }, { status: 500 });
    }
    return NextResponse.json({ text: "Unexpected error" }, { status: 500 });
  }
}
