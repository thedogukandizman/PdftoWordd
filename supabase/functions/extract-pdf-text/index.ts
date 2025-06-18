
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved PDF text extraction using multiple methods
async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  console.log('Starting PDF text extraction, size:', pdfBytes.length);
  
  try {
    // Convert to string for pattern matching
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfBytes);
    
    console.log('PDF converted to string, length:', pdfString.length);
    
    let extractedText = '';
    
    // Method 1: Extract text from PDF text objects
    const textObjectRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      const text = match[1];
      if (text && text.length > 0) {
        // Decode common PDF escape sequences
        const decodedText = text
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        
        if (/[a-zA-Z]/.test(decodedText)) {
          extractedText += decodedText + ' ';
        }
      }
    }
    
    console.log('Method 1 extracted text length:', extractedText.length);
    
    // Method 2: Extract from show text operators
    if (extractedText.length < 50) {
      const showTextRegex = /\[(.*?)\]\s*TJ/g;
      while ((match = showTextRegex.exec(pdfString)) !== null) {
        const textArray = match[1];
        const textParts = textArray.match(/\(([^)]*)\)/g);
        if (textParts) {
          textParts.forEach(part => {
            const cleanText = part.replace(/[()]/g, '');
            if (cleanText && /[a-zA-Z]/.test(cleanText)) {
              extractedText += cleanText + ' ';
            }
          });
        }
      }
      console.log('Method 2 total extracted text length:', extractedText.length);
    }
    
    // Method 3: Extract from stream content (fallback)
    if (extractedText.length < 50) {
      const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
      while ((match = streamRegex.exec(pdfString)) !== null) {
        const streamContent = match[1];
        
        // Look for parentheses-enclosed text in streams
        const textInParens = streamContent.match(/\(([^)]+)\)/g);
        if (textInParens) {
          textInParens.forEach(text => {
            const cleanText = text.replace(/[()]/g, '').trim();
            if (cleanText.length > 1 && /[a-zA-Z]/.test(cleanText)) {
              extractedText += cleanText + ' ';
            }
          });
        }
      }
      console.log('Method 3 total extracted text length:', extractedText.length);
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .trim();
    
    console.log('Final cleaned text length:', extractedText.length);
    console.log('First 200 chars of extracted text:', extractedText.substring(0, 200));
    
    return extractedText;
    
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    return '';
  }
}

// Simple validation - check if text looks readable
function validateExtractedText(text: string): boolean {
  if (!text || text.length < 20) {
    console.log('Text too short:', text.length);
    return false;
  }
  
  // Check for reasonable character distribution
  const alphanumeric = text.match(/[a-zA-Z0-9]/g) || [];
  const ratio = alphanumeric.length / text.length;
  
  console.log('Text validation - length:', text.length, 'alphanumeric ratio:', ratio);
  
  return ratio > 0.3; // At least 30% should be letters/numbers
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

    console.log('Processing PDF:', pdfFile.name, 'Size:', pdfFile.size);

    // Convert file to bytes
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    // Extract text using improved method
    const extractedText = await extractPdfText(pdfBytes);
    
    console.log('Extracted text preview:', extractedText.substring(0, 500));
    
    // Validate the text
    if (!validateExtractedText(extractedText)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Could not extract readable text from this PDF. The file may be scanned, image-based, or protected. Please try a different PDF with selectable text."
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
        readable_ratio: (extractedText.match(/[a-zA-Z0-9]/g) || []).length / extractedText.length
      }
    };

    console.log('Successfully extracted text, length:', result.text.length);
    
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
        error: `PDF processing failed: ${error.message}. Please ensure the file is a valid PDF.`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
