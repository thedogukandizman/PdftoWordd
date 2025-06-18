
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

    console.log('Processing PDF:', pdfFile.name, 'Size:', pdfFile.size);

    // Extract text using the same method as extract-pdf-text
    const arrayBuffer = await pdfFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let rawText = decoder.decode(uint8Array);
    
    // Extract text between stream objects
    let extractedText = '';
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const matches = rawText.matchAll(streamRegex);
    
    for (const match of matches) {
      const streamContent = match[1];
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

    // Fallback text extraction
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
        error: "Could not extract readable text from this PDF. The file might be a scanned image or contain non-selectable text. Please try a different PDF."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a simple Word document structure (RTF format that works with .docx extension)
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 ${extractedText.replace(/\n/g, '\\par ')}}`;

    // Convert to base64 for download
    const wordBuffer = new TextEncoder().encode(rtfContent);
    const base64Word = btoa(String.fromCharCode(...wordBuffer));

    console.log('Document conversion completed successfully');

    return new Response(JSON.stringify({
      success: true,
      wordDocument: base64Word,
      filename: pdfFile.name.replace('.pdf', '.docx')
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in pdf-to-word function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Conversion failed: ${error.message}. Please ensure the file is a valid PDF.`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
