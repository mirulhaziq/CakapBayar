import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request) {
  console.log('🔵 [SERVER] Transcription API called (Groq)');
  
  try {
    // Check if API key is configured FIRST
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ [SERVER] Groq API key not configured');
      console.error('❌ [SERVER] Checked process.env.GROQ_API_KEY:', process.env.GROQ_API_KEY);
      return NextResponse.json({ 
        error: 'Groq API key not configured. Please add GROQ_API_KEY to your .env.local file and restart the dev server.' 
      }, { status: 500 });
    }
    
    console.log('✅ [SERVER] Groq API key found, length:', process.env.GROQ_API_KEY.length);
    
    // Initialize Groq client AFTER checking for API key
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const formData = await request.formData();
    const audioFile = formData.get('file');
    
    if (!audioFile) {
      console.error('❌ [SERVER] No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('✅ [SERVER] Audio file received, size:', audioFile.size, 'bytes');

    // Check if file is actually a file
    if (audioFile.size === 0) {
      console.error('❌ [SERVER] Audio file is empty');
      return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 });
    }

    console.log('✅ [SERVER] Audio file received, sending to Groq Whisper...');

    // Groq Whisper is SUPER FAST and FREE!
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'ms', // Malay support!
      response_format: 'text',
    });

    console.log('✅ [SERVER] Groq transcription successful');

    // Extract text from response
    // When response_format is 'text', transcription is already a string
    const text = typeof transcription === 'string' ? transcription : transcription.text || '';
    console.log('📝 [SERVER] Transcribed text:', text);
    
    if (!text) {
      console.error('❌ [SERVER] No text in transcription response');
      return NextResponse.json({ error: 'No transcription text received from API' }, { status: 500 });
    }
    
    console.log('✅ [SERVER] Returning success response');
    return NextResponse.json({ text: text, success: true });
    
  } catch (error) {
    console.error('Transcription error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Transcription failed';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response) {
      errorMessage = `API Error: ${error.response.status} - ${error.response.statusText}`;
    }
    
    // Check for specific Groq errors
    if (error.status === 401) {
      errorMessage = 'Invalid Groq API key. Please check your GROQ_API_KEY in .env.local';
    } else if (error.status === 429) {
      errorMessage = 'Groq API rate limit exceeded. Please try again later.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid audio file format. Please try recording again.';
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      errorType: error.name || 'UnknownError'
    }, { status: 500 });
  }
}
