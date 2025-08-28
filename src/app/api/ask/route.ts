import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs'; // ensure Node runtime

type Lang = 'en' | 'ta';

const SYSTEM_EN = `You are a concise study assistant for students. Keep answers short, clear, and exam-friendly.`;
const SYSTEM_TA = `நீங்கள் மாணவர்களுக்கு உதவும் சுருக்கமான படிப்பு உதவியாளர். பதில்கள் தெளிவாகவும் சுருக்கமாகவும் இருக்கட்டும்.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, lang }: { prompt: string; lang: Lang } = await req.json();
    if (!prompt || !['en','ta'].includes(lang)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const system = lang === 'en' ? SYSTEM_EN : SYSTEM_TA;
    const translateTo = lang === 'en' ? 'English' : 'Tamil';

    const result = await model.generateContent(
      `${system}\n\nUser question:\n${prompt}\n\nRespond in ${translateTo} only.`
    );
    const text = result.response.text();
    return NextResponse.json({ text });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
