import { NextResponse, NextRequest} from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from '@/lib/supabase';
import { getOrSetUID } from '@/lib/uid';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function canRequest(uid: string, limit = 5) {
  const day = today();
  const { data, error } = await supabaseAdmin
    .from('usage_counters')
    .select('count')
    .eq('uid', uid)
    .eq('day', day)
    .single();

  const used = data?.count ?? 0;
  return { allowed: used < limit, count: used };
}

async function incrementUsage(uid: string) {
  const day = new Date().toISOString().split("T")[0];
  try {
    await supabaseAdmin.rpc("increment_usage", { u_uid: uid, u_day: day });
  } catch (e) {
    console.error("Supabase RPC error:", e);
  }
}


export async function POST(req: NextRequest) {
  const uid = await getOrSetUID();
  const { allowed, count } = await canRequest(uid, 5);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Daily limit reached (5 free uses). Please wait or upgrade.' },
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

    await incrementUsage(uid);

    return NextResponse.json({ text });

  } catch (error) {
  if (error instanceof Error) {
    console.error("Gemini API error:", error);
    return NextResponse.json({ text: "Error: " + error.message }, { status: 500 });
  }
  return NextResponse.json({ text: "Unexpected error" }, { status: 500 });
}
}
