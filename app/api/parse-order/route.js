import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Safely parse JSON from the model (handles stray text/code fences)
function safeJsonParse(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found');
  return JSON.parse(match[0]);
}

function buildPrompt(menuReference, transcript, currentOrderRef) {
  return `
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
8) Removals: detect "cancel", "remove", "tak nak", "tolak" and list items to remove.
9) Use CURRENT ORDER context to apply updates/removals sensibly.

CRITICAL - "sahaja" / "only" / "just" (change of mind):
- "satu nasi ayam sahaja" or "nak satu nasi ayam sahaja" or "maaf saya nak satu nasi ayam sahaja" = customer wants ONLY that item with that quantity. You MUST: (1) update: [{"name": "Nasi Ayam", "quantity": 1}], (2) remove: [list every OTHER item in CURRENT ORDER only]. Never put the item the customer wants in "remove". Remove only the other items so the cart ends up with just that one item at that quantity.

CRITICAL - Quantity semantics (must follow exactly):
- actions.add: quantity = HOW MANY TO ADD (delta only). Never use the new total.
  Example: CURRENT ORDER has "2 x Nasi Ayam". User says "tambah lagi 2 nasi ayam" → add: [{"name": "Nasi Ayam", "quantity": 2}]. Result: 4 nasi ayam. So actions.add quantity is 2 (what to add), not 4.
  Example: User says "lagi satu teh tarik" → add: [{"name": "Teh Tarik", "quantity": 1}].
- actions.update: quantity = NEW TOTAL for that item. Example: "ubah kepada 3" → update: [{"name": "...", "quantity": 3}].
- "items" = full order state AFTER applying actions (for TTS/display). E.g. after adding 2 nasi ayam to existing 2, items: [{"name": "Nasi Ayam", "quantity": 4, "price": ...}].

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
  "confirmations": [string]
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
}

export async function POST(request) {
  try {
    const { transcript, menuItems, currentOrderItems = [], provider } = await request.json();
    
    const menuReference = menuItems.map(item => 
      `${item.name}: RM${Number(item.price).toFixed(2)} (aliases: ${Array.isArray(item.aliases) ? item.aliases.join(', ') : ''})`
    ).join('\n');

    const currentOrderRef = currentOrderItems.length
      ? currentOrderItems.map(i => `${i.quantity} x ${i.name}`).join('; ')
      : 'Tiada (empty)';

    const prompt = buildPrompt(menuReference, transcript, currentOrderRef);

    // Choose provider based on request (default to anthropic)
    const useGroq = provider === 'groq';

    let responseText;

    if (useGroq) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.1,
      });
      responseText = completion.choices[0]?.message?.content || '';
    } else {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });
      responseText = message.content[0].text;
    }

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
