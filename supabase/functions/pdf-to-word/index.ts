
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved PDF text extraction (same as extract-pdf-text)
async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  try {
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfBytes);
    
    let extractedText = '';
    
    // Extract text from PDF text objects
    const textObjectRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
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
        
        if (/[a-zA-Z]/.test(decodedText)) {
          extractedText += decodedText + ' ';
        }
      }
    }
    
    // Fallback method for show text operators
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
    }
    
    return extractedText.replace(/\s+/g, ' ').trim();
    
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    return '';
  }
}

// Create a proper RTF document
function createRtfDocument(text: string, filename: string): string {
  // Sanitize text for RTF
  const sanitizedText = text
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/{/g, '\\{') // Escape braces
    .replace(/}/g, '\\}') // Escape braces
    .replace(/\n/g, '\\par\n') // Convert newlines to RTF paragraphs
    .replace(/\t/g, '\\tab ') // Convert tabs
    .trim();

  // Create proper RTF document
  const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\cf1\\f0\\fs24

{\\b\\fs28 ${filename.replace(/[\\{}]/g, '')}\\par}
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
    console.log('Text preview:', extractedText.substring(0, 200));

    // Validate extracted text
    if (!extractedText || extractedText.length < 20) {
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
