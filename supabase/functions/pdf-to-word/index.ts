
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Same improved PDF text extraction as extract-pdf-text
async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  try {
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfBytes);
    
    let extractedText = '';
    
    // Method 1: Extract text between BT and ET operators
    const btEtRegex = /BT\s+(.*?)\s+ET/gs;
    let match;
    while ((match = btEtRegex.exec(pdfString)) !== null) {
      const textBlock = match[1];
      
      const textMatches = [
        ...textBlock.matchAll(/\(([^)]+)\)\s*Tj/g),
        ...textBlock.matchAll(/\(([^)]+)\)\s*TJ/g),
        ...textBlock.matchAll(/\[(.*?)\]\s*TJ/g)
      ];
      
      for (const textMatch of textMatches) {
        let text = textMatch[1];
        if (text) {
          if (text.includes('(')) {
            const subTexts = text.match(/\(([^)]*)\)/g);
            if (subTexts) {
              text = subTexts.map(t => t.replace(/[()]/g, '')).join('');
            }
          }
          
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
    
    // Method 2: Fallback to simple text objects
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
    }
    
    return extractedText.replace(/\s+/g, ' ').trim();
    
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    return '';
  }
}

// Create a proper RTF document with better formatting
function createRtfDocument(text: string, filename: string): string {
  // Sanitize text for RTF - be more aggressive about cleaning
  const sanitizedText = text
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars except basic ones
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/{/g, '\\{') // Escape braces  
    .replace(/}/g, '\\}') // Escape braces
    .replace(/\n/g, '\\par\n') // Convert newlines to RTF paragraphs
    .replace(/\t/g, '\\tab ') // Convert tabs
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Create proper RTF document with correct header
  const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0\\froman\\fcharset0 Times New Roman;}}
\\f0\\fs24 

{\\b\\fs28 ${filename.replace(/[\\{}]/g, '').replace('.pdf', '')}\\par}
\\par

${sanitizedText}

\\par
}`;

  return rtfContent;
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

    console.log('Converting PDF to Word:', pdfFile.name, 'Size:', pdfFile.size);

    // Extract text from PDF
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const extractedText = await extractPdfText(pdfBytes);
    
    console.log('Extracted text length:', extractedText.length);
    console.log('Text preview (first 200 chars):', extractedText.substring(0, 200));

    // More lenient validation - just check if we have some text
    if (!extractedText || extractedText.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: "Could not extract readable text from this PDF. The file may be scanned or image-based. Please try a different PDF with selectable text."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create RTF document
    const filename = pdfFile.name.replace('.pdf', '');
    const rtfContent = createRtfDocument(extractedText, filename);
    
    console.log('RTF document created, length:', rtfContent.length);
    
    // Convert to base64
    const rtfBytes = new TextEncoder().encode(rtfContent);
    const base64Content = btoa(String.fromCharCode(...rtfBytes));

    return new Response(JSON.stringify({
      success: true,
      wordDocument: base64Content,
      filename: `${filename}.rtf`,
      contentType: 'application/rtf'
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
        error: `PDF to Word conversion failed: ${error.message}. Please try a different PDF file.`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
