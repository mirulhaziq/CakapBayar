import { NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/utils/api-auth';

export async function POST(request) {
  // Verify API key authentication
  if (!verifyApiKey(request)) {
    console.error('❌ [SERVER] Unauthorized API access attempt to text-to-speech');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }
    
    // Bella works for Malay; set ELEVENLABS_VOICE_ID in .env to override (e.g. a Malay voice ID)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Bella - multilingual
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 1.0,         // Max clarity, less variation
            similarity_boost: 0.75,
            style: 0,               // Neutral for clear pronunciation
            use_speaker_boost: true
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'ElevenLabs API failed');
    }
    
    // Get audio blob
    const audioBlob = await response.blob();
    
    // Return audio as blob
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBlob.size.toString(),
      },
    });
    
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech', details: error.message },
      { status: 500 }
    );
  }
}


