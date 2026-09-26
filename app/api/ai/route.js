import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key? Signal the client to use local fallback — NOT an error
  if (!apiKey) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  try {
    const body = await request.json();

    // Use Haiku by default — 60x cheaper than Sonnet
    const model = body.model || 'claude-haiku-4-5-20251001';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: body.max_tokens || 500,
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}
