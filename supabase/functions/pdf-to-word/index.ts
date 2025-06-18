
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to validate if text is readable/meaningful (same as extract function)
function isTextReadable(text: string): boolean {
  if (!text || text.length < 100) return false;
  
  const alphanumericCount = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
  const totalChars = text.length;
  const readableRatio = alphanumericCount / totalChars;
  
  if (readableRatio < 0.5) return false;
  
  const commonWords = ['the', 'and', 'or', 'to', 'a', 'an', 'is', 'in', 'on', 'at', 'for', 'with', 'by'];
  const lowerText = text.toLowerCase();
  const foundWords = commonWords.filter(word => lowerText.includes(` ${word} `)).length;
  
  return foundWords >= 3;
}

// Function to clean and sanitize extracted text for Word document
function sanitizeTextForWord(text: string): string {
  return text
    // Remove non-printable characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Replace multiple whitespace with single space, but preserve paragraphs
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    // Remove excessive special characters clusters
    .replace(/[^\w\s.,!?;:()"-]{3,}/g, ' ')
    // Escape XML special characters for Word
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .trim();
}

// Create a proper .docx file using Open XML format
function createDocxFile(text: string, filename: string): Uint8Array {
  const sanitizedText = sanitizeTextForWord(text);
  
  // Split text into paragraphs
  const paragraphs = sanitizedText.split('\n\n').filter(p => p.trim());
  
  // Create paragraph XML
  const paragraphsXml = paragraphs.map(paragraph => {
    const lines = paragraph.split('\n').filter(line => line.trim());
    const linesXml = lines.map(line => 
      `<w:r><w:t>${line.trim()}</w:t></w:r>`
    ).join('<w:br/>');
    
    return `<w:p><w:pPr></w:pPr>${linesXml}</w:p>`;
  }).join('');

  // Document XML content
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>${filename.replace(/[<>&"']/g, '')}</w:t>
      </w:r>
    </w:p>
    <w:p><w:pPr></w:pPr><w:r><w:t></w:t></w:r></w:p>
    ${paragraphsXml}
  </w:body>
</w:document>`;

  // Content Types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  // Main relationships
  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  // Create a simple ZIP structure for .docx
  const encoder = new TextEncoder();
  
  // This is a simplified approach - in production you'd use a proper ZIP library
  // For now, we'll create a basic Word-compatible XML structure
  const wordContent = encoder.encode(documentXml);
  
  return wordContent;
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
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .trim();

    // Validate if the text is readable
    if (!isTextReadable(extractedText)) {
      return new Response(JSON.stringify({
        success: false,
        error: "The PDF seems scanned or unreadable. Cannot generate a meaningful Word document from this content. Please try a different PDF with selectable text."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a proper Word document
    const filename = pdfFile.name.replace('.pdf', '');
    
    // For now, create a simple RTF that Word can open reliably
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24
{\\b\\fs32 ${filename}\\par}
\\par
${extractedText.split('\n').map(line => line.trim()).filter(line => line).join('\\par\n')}
}`;

    // Convert RTF to bytes
    const rtfBytes = new TextEncoder().encode(rtfContent);
    const base64Content = btoa(String.fromCharCode(...rtfBytes));

    console.log('Document conversion completed successfully, length:', extractedText.length);

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
        error: `Conversion failed: ${error.message}. Please ensure the file is a valid PDF with extractable text.`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
