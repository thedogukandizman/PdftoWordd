
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

    // Convert file to base64 for Python processing
    const arrayBuffer = await pdfFile.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Python script for PDF to Word conversion using PyMuPDF and python-docx
    const pythonScript = `
import fitz  # PyMuPDF
import base64
import io
from docx import Document
from docx.shared import Inches
import sys
import json

def pdf_to_word(base64_pdf):
    try:
        # Decode base64 PDF
        pdf_bytes = base64.b64decode(base64_pdf)
        
        # Open PDF with PyMuPDF
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Create new Word document
        doc = Document()
        
        # Add title
        title = doc.add_heading('Converted PDF Document', 0)
        
        # Extract text from each page
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text = page.get_text()
            
            if text.strip():
                # Add page heading
                doc.add_heading(f'Page {page_num + 1}', level=1)
                
                # Add page content
                paragraphs = text.split('\\n\\n')
                for paragraph in paragraphs:
                    if paragraph.strip():
                        doc.add_paragraph(paragraph.strip())
            else:
                doc.add_paragraph(f'[Page {page_num + 1} contains no extractable text]')
        
        # Save to bytes
        docx_buffer = io.BytesIO()
        doc.save(docx_buffer)
        docx_bytes = docx_buffer.getvalue()
        
        # Convert to base64 for return
        docx_base64 = base64.b64encode(docx_bytes).decode('utf-8')
        
        pdf_document.close()
        
        return {
            'success': True,
            'docx_base64': docx_base64,
            'pages_processed': len(pdf_document)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Get input from stdin
input_data = sys.stdin.read()
data = json.loads(input_data)
result = pdf_to_word(data['base64_pdf'])
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
      throw new Error(`PDF processing failed: ${errorText}`);
    }

    const result = JSON.parse(new TextDecoder().decode(stdout));
    
    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('PDF processed successfully, pages:', result.pages_processed);

    // Convert base64 back to binary for download
    const docxBytes = Uint8Array.from(atob(result.docx_base64), c => c.charCodeAt(0));

    return new Response(docxBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${pdfFile.name.replace('.pdf', '')}_converted.docx"`,
      },
    });

  } catch (error) {
    console.error('Error in pdf-to-word function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
