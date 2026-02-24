import { NextResponse } from "next/server";
import { askZoningQuestion } from "@/lib/claude";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;
  const body = await request.json();
  const { question, zoning_code } = body;

  if (!question || !zoning_code) {
    return NextResponse.json(
      { error: "Missing question or zoning_code" },
      { status: 400 }
    );
  }

  const answer = await askZoningQuestion(question, zoning_code);

  return NextResponse.json({ apn, answer });
}
