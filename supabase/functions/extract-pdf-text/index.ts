
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
    
    // Method 1: Extract text between BT and ET operators (more comprehensive)
    const btEtRegex = /BT\s+(.*?)\s+ET/gs;
    let match;
    while ((match = btEtRegex.exec(pdfString)) !== null) {
      const textBlock = match[1];
      
      // Extract text from various PDF text operators
      const textMatches = [
        ...textBlock.matchAll(/\(([^)]+)\)\s*Tj/g),
        ...textBlock.matchAll(/\(([^)]+)\)\s*TJ/g),
        ...textBlock.matchAll(/\[(.*?)\]\s*TJ/g)
      ];
      
      for (const textMatch of textMatches) {
        let text = textMatch[1];
        if (text) {
          // Handle array notation for TJ operator
          if (text.includes('(')) {
            const subTexts = text.match(/\(([^)]*)\)/g);
            if (subTexts) {
              text = subTexts.map(t => t.replace(/[()]/g, '')).join('');
            }
          }
          
          // Clean up the text
          text = text
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
            .trim();
          
          if (text.length > 0) {
            extractedText += text + ' ';
          }
        }
      }
    }
    
    console.log('Method 1 (BT/ET) extracted text length:', extractedText.length);
    
    // Method 2: Extract from simple text objects if Method 1 didn't work well
    if (extractedText.length < 100) {
      const textObjectRegex = /\(([^)]+)\)\s*Tj/g;
      while ((match = textObjectRegex.exec(pdfString)) !== null) {
        const text = match[1];
        if (text && text.length > 0) {
          const decodedText = text
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          
          if (decodedText.trim().length > 0) {
            extractedText += decodedText + ' ';
          }
        }
      }
      console.log('Method 2 total extracted text length:', extractedText.length);
    }
    
    // Method 3: Extract from stream content (last resort)
    if (extractedText.length < 50) {
      const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
      while ((match = streamRegex.exec(pdfString)) !== null) {
        const streamContent = match[1];
        
        // Look for text patterns in streams
        const textInStreams = streamContent.match(/\(([^)]+)\)/g);
        if (textInStreams) {
          textInStreams.forEach(text => {
            const cleanText = text.replace(/[()]/g, '').trim();
            if (cleanText.length > 2) {
              extractedText += cleanText + ' ';
            }
          });
        }
      }
      console.log('Method 3 total extracted text length:', extractedText.length);
    }
    
    // Clean up the final extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Final extracted text length:', extractedText.length);
    console.log('First 500 chars of extracted text:', extractedText.substring(0, 500));
    
    return extractedText;
    
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    return '';
  }
}

// More lenient validation - check if text looks reasonable
function validateExtractedText(text: string): boolean {
  if (!text || text.length < 10) {
    console.log('Text too short:', text.length);
    return false;
  }
  
  // Check for reasonable character distribution - much more lenient
  const totalChars = text.length;
  const alphanumeric = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const spaces = (text.match(/\s/g) || []).length;
  const readableChars = alphanumeric + spaces;
  const readableRatio = readableChars / totalChars;
  
  // Check for common English words to confirm it's real text
  const commonWords = ['the', 'and', 'or', 'to', 'of', 'in', 'a', 'is', 'that', 'for', 'as', 'with', 'by'];
  const lowerText = text.toLowerCase();
  const foundCommonWords = commonWords.filter(word => lowerText.includes(word)).length;
  
  console.log('Text validation - length:', totalChars, 'readable ratio:', readableRatio, 'common words found:', foundCommonWords);
  
  // Much more lenient validation
  return readableRatio > 0.15 || foundCommonWords >= 2;
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
    
    console.log('Extracted text preview (first 200 chars):', extractedText.substring(0, 200));
    
    // Validate the text with more lenient criteria
    if (!validateExtractedText(extractedText)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Could not extract readable text from this PDF. The file may be scanned, image-based, or contain non-standard text encoding. Please try a different PDF with selectable text."
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
        readable_ratio: ((extractedText.match(/[a-zA-Z0-9\s]/g) || []).length / extractedText.length)
      }
    };

    console.log('Successfully extracted text with', result.text.length, 'characters');
    
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
