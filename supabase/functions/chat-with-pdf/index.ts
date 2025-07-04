
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'AI service is not properly configured. Please contact support.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pdfContent, userQuestion } = await req.json();

    if (!userQuestion || userQuestion.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Please provide a question to ask about the PDF.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pdfContent || pdfContent.trim().length < 10) {
      return new Response(JSON.stringify({ 
        error: 'PDF content is empty or too short. The document may be scanned or contain unreadable text. Please try a different PDF with selectable text.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing chat request - PDF content length:', pdfContent.length);
    console.log('User question:', userQuestion);
    console.log('PDF content preview (first 300 chars):', pdfContent.substring(0, 300));

    // Clean the PDF content before sending to Gemini
    const cleanedContent = pdfContent
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log('Cleaned content length:', cleanedContent.length);
    console.log('Cleaned content preview (first 200 chars):', cleanedContent.substring(0, 200));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an AI assistant helping users understand their PDF documents. Here is the content extracted from a PDF document:

${cleanedContent.substring(0, 20000)}${cleanedContent.length > 20000 ? '...[content truncated for length]' : ''}

User Question: ${userQuestion}

Please provide a helpful and accurate answer based on the PDF content above. If the answer cannot be found in the document, please say so clearly. Keep your response concise and relevant.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      console.error('Gemini API Error:', response.status, errorData);
      
      return new Response(JSON.stringify({ 
        error: 'AI service is temporarily unavailable. Please try again in a moment.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('No response generated from Gemini API:', data);
      return new Response(JSON.stringify({ 
        error: 'AI service did not generate a response. Please try rephrasing your question.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI response generated successfully, length:', aiResponse.length);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in chat-with-pdf function:', error);
    return new Response(
      JSON.stringify({ 
        error: `Chat service error: ${error.message}. Please try again or contact support if the problem persists.`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
