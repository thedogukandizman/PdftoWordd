
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to validate if text is readable/meaningful
function isTextReadable(text: string): boolean {
  if (!text || text.length < 100) return false;
  
  // Check for meaningful character ratio
  const alphanumericCount = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
  const totalChars = text.length;
  const readableRatio = alphanumericCount / totalChars;
  
  // If less than 50% of characters are readable, reject
  if (readableRatio < 0.5) return false;
  
  // Check for common words that indicate real text
  const commonWords = ['the', 'and', 'or', 'to', 'a', 'an', 'is', 'in', 'on', 'at', 'for', 'with', 'by'];
  const lowerText = text.toLowerCase();
  const foundWords = commonWords.filter(word => lowerText.includes(` ${word} `)).length;
  
  // Should have at least 3 common words in readable text
  return foundWords >= 3;
}

// Function to clean and sanitize extracted text
function sanitizeText(text: string): string {
  return text
    // Remove non-printable characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Replace multiple whitespace with single space
    .replace(/\s+/g, ' ')
    // Remove excessive special characters clusters
    .replace(/[^\w\s.,!?;:()"-]{3,}/g, ' ')
    .trim();
}

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

    // Clean and sanitize the extracted text
    extractedText = sanitizeText(extractedText);

    // Validate if the text is readable and meaningful
    if (!isTextReadable(extractedText)) {
      return new Response(JSON.stringify({
        success: false,
        error: "The PDF seems scanned or unreadable. The extracted text appears to be garbled or contains mostly non-text content. Please try a different PDF with selectable text, or use an OCR tool to convert scanned documents first."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        page_count: 1,
        character_count: extractedText.length,
        readable_ratio: (extractedText.match(/[a-zA-Z0-9\s]/g) || []).length / extractedText.length
      }
    };

    console.log('Text extracted successfully, length:', result.text.length, 'readable ratio:', result.metadata.readable_ratio);

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
