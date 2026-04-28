import { NextResponse } from "next/server";

import {
  isLanguageCode,
  processLearningContent,
  type ProcessRequest,
} from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ProcessRequest>;
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const simplerPass =
      typeof body.simplerPass === "number" && body.simplerPass >= 0
        ? Math.floor(body.simplerPass)
        : 0;
    const language = isLanguageCode(body.language) ? body.language : "en";

    if (!text) {
      return NextResponse.json(
        { error: "Please paste some educational text before processing." },
        { status: 400 },
      );
    }

    const result = await processLearningContent({
      text,
      language,
      simplerPass,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("LearnAble processing error", error);

    return NextResponse.json(
      { error: "LearnAble hit a processing issue. Please try again in a moment." },
      { status: 500 },
    );
  }
}
