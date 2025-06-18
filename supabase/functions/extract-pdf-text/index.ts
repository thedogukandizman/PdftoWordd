
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;
    
    if (!pdfFile) {
      throw new Error('No PDF file provided');
    }

    console.log('Extracting text from PDF:', pdfFile.name, 'Size:', pdfFile.size);

    // Convert file to ArrayBuffer for processing
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Simple PDF text extraction using basic PDF parsing
    // This is a simplified approach - for production, you'd want to use a proper PDF parsing library
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let rawText = decoder.decode(uint8Array);
    
    // Extract text between stream objects (basic PDF text extraction)
    let extractedText = '';
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const matches = rawText.matchAll(streamRegex);
    
    for (const match of matches) {
      const streamContent = match[1];
      // Try to extract readable text from the stream
      const textMatch = streamContent.match(/\((.*?)\)/g);
      if (textMatch) {
        textMatch.forEach(text => {
          const cleanText = text.replace(/[()]/g, '').trim();
          if (cleanText.length > 2 && /[a-zA-Z]/.test(cleanText)) {
            extractedText += cleanText + ' ';
          }
        });
      }
    }

    // Fallback: try to extract any readable text from the PDF
    if (!extractedText.trim()) {
      const textRegex = /\((.*?)\)/g;
      const allMatches = rawText.matchAll(textRegex);
      
      for (const match of allMatches) {
        const text = match[1];
        if (text && text.length > 2 && /[a-zA-Z]/.test(text)) {
          extractedText += text + ' ';
        }
      }
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E]/g, ' ')
      .trim();

    if (!extractedText || extractedText.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: "Could not extract readable text from this PDF. The file might be a scanned image or have non-standard formatting. Please try a different PDF with selectable text."
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    const result = {
      success: true,
      text: extractedText,
      metadata: {
        title: pdfFile.name,
        author: 'Unknown',
        subject: '',
        creator: 'Unknown',
        producer: 'Unknown',
        page_count: 1 // We can't determine exact page count with this simple method
      }
    };

    console.log('Text extracted successfully, length:', result.text.length);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in extract-pdf-text function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Failed to process PDF: ${error.message}. Please ensure the file is a valid PDF with extractable text.`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
