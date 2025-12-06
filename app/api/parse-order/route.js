import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Safely parse JSON from the model (handles stray text/code fences)
function safeJsonParse(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found');
  return JSON.parse(match[0]);
}

export async function POST(request) {
  try {
    const { transcript, menuItems, currentOrderItems = [] } = await request.json();
    
    const menuReference = menuItems.map(item => 
      `${item.name}: RM${item.price.toFixed(2)} (aliases: ${item.aliases.join(', ')})`
    ).join('\n');

    const currentOrderRef = currentOrderItems.length
      ? currentOrderItems.map(i => `${i.quantity} x ${i.name}`).join('; ')
      : 'Tiada (empty)';

    const prompt = `
You are a Malaysian food stall order processing AI.

MENU:
${menuReference}

CUSTOMER SAID: "${transcript}"
CURRENT ORDER: ${currentOrderRef}

IMPORTANT: If the customer's input is AMBIGUOUS (could match multiple menu items), you MUST return an ambiguity response.

Examples of ambiguous inputs:
- "mango" could be "Mango Juice" OR "Mango Tiramisu"
- "nasi" could be "Nasi Lemak" OR "Nasi Goreng"
- "teh" without specifying type

Smart disambiguation rules to reduce false ambiguities:
1) If quantity + item name is given (e.g., "2 mango juice"), treat as specific and do not ask for clarification.
2) If category is mentioned (minuman/makanan/kuih/etc.), filter candidates to that category before deciding ambiguity.
3) If price hint appears (e.g., "murah", "paling murah", "mahal"), bias toward cheaper or more expensive items accordingly.
4) If the transcript clearly matches a full item name, do not mark as ambiguous.
5) If a single generic word matches multiple items (e.g., "mango"), keep it ambiguous.
6) Preserve requestedQuantity even when ambiguous.
7) When confidence is split within 10% among multiple items, treat as ambiguous.
8) Quantity adjustments: detect phrases like "make it X", "change to X", "add X more", "plus X".
9) Removals: detect "cancel", "remove", "tak nak", "tolak" and list items to remove.
10) Use CURRENT ORDER context to apply updates/removals sensibly.

Return format:

If CLEAR (one obvious match):
{
  "items": [{"name": string, "quantity": number, "price": number}],
  "total": number,
  "ambiguous": false,
  "actions": {
    "add": [{"name": string, "quantity": number, "price": number}],
    "update": [{"name": string, "quantity": number, "price": number}],
    "remove": [{"name": string}]
  },
  "confirmations": [string] // e.g., "Dikemaskini: 3 Teh Tarik"
}

If AMBIGUOUS (multiple possible matches):
{
  "items": [],
  "total": 0,
  "ambiguous": true,
  "ambiguousQuery": string,
  "possibleMatches": [
    {
      "name": string,
      "nameMalay": string,
      "price": number,
      "category": string,
      "confidence": number
    }
  ],
  "originalTranscript": string,
  "requestedQuantity": number,
  "actions": null,
  "confirmations": []
}

Be STRICT about ambiguity detection—but avoid false positives by applying the smart rules above.
Return ONLY valid JSON (no markdown).`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const parsed = safeJsonParse(responseText);

    return NextResponse.json(parsed);
    
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({ 
      error: 'Parse failed', 
      items: [], 
      total: 0, 
      ambiguous: false 
    }, { status: 500 });
  }
}
