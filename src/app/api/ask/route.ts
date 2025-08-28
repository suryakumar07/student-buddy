import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(query);
    const text = result.response.text();

    console.log("Incoming query:", query);

    return NextResponse.json({ text });
  } catch (error) {
  if (error instanceof Error) {
    console.error("Gemini API error:", error);
    return NextResponse.json({ text: "Error: " + error.message }, { status: 500 });
  }
  return NextResponse.json({ text: "Unexpected error" }, { status: 500 });
}
}
