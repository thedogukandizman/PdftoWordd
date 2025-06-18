
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

    // Convert file to base64 for Python processing
    const arrayBuffer = await pdfFile.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Python script for text extraction using PyMuPDF
    const pythonScript = `
import fitz  # PyMuPDF
import base64
import sys
import json

def extract_pdf_text(base64_pdf):
    try:
        # Decode base64 PDF
        pdf_bytes = base64.b64decode(base64_pdf)
        
        # Open PDF with PyMuPDF
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        full_text = ""
        metadata = {
            'title': pdf_document.metadata.get('title', ''),
            'author': pdf_document.metadata.get('author', ''),
            'subject': pdf_document.metadata.get('subject', ''),
            'creator': pdf_document.metadata.get('creator', ''),
            'producer': pdf_document.metadata.get('producer', ''),
            'page_count': len(pdf_document)
        }
        
        # Extract text from each page
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text = page.get_text()
            
            if text.strip():
                full_text += f"\\n\\nPage {page_num + 1}:\\n{'='*40}\\n{text}"
            else:
                full_text += f"\\n\\nPage {page_num + 1}:\\n{'='*40}\\n[No extractable text on this page]"
        
        pdf_document.close()
        
        return {
            'success': True,
            'text': full_text.strip(),
            'metadata': metadata
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Get input from stdin
input_data = sys.stdin.read()
data = json.loads(input_data)
result = extract_pdf_text(data['base64_pdf'])
print(json.dumps(result))
`;

    // Execute Python script
    const process = new Deno.Command("python3", {
      args: ["-c", pythonScript],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = process.spawn();
    
    // Send input to Python
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(JSON.stringify({ base64_pdf: base64Pdf })));
    await writer.close();

    // Get output
    const { code, stdout, stderr } = await child.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      console.error('Python script error:', errorText);
      throw new Error(`Text extraction failed: ${errorText}`);
    }

    const result = JSON.parse(new TextDecoder().decode(stdout));
    
    if (!result.success) {
      throw new Error(result.error);
    }

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
