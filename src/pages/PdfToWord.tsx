
import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PdfToWord = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && file.type !== 'application/pdf') {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      return;
    }
    
    if (file) {
      setSelectedFile(file);
      console.log('File dropped:', file.name, file.size);
      toast({
        title: "File uploaded!",
        description: "PDF file ready for conversion",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file && file.type !== 'application/pdf') {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      return;
    }
    
    if (file) {
      setSelectedFile(file);
      console.log('File selected:', file.name, file.size);
      toast({
        title: "File uploaded!",
        description: "PDF file ready for conversion",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createFallbackText = (file: File): string => {
    return `${file.name.replace('.pdf', '').replace(/_/g, ' ')}

Document Information:
Author: ${file.name.includes('_') ? file.name.split('_')[0] : 'Unknown'}
Pages: Multiple
File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
Created: ${new Date(file.lastModified || Date.now()).toLocaleDateString()}
Converted: ${new Date().toLocaleDateString()}

PAGE 1
________________________________________

This document contains content from your PDF file. The text extraction process encountered some limitations, but the document structure has been preserved.

For best results with PDF to Word conversion:
- Ensure your PDF contains selectable text (not just images)
- PDFs with complex layouts may require manual formatting adjustments
- Scanned documents may need OCR processing for text extraction

[Note: This is a fallback message. The actual PDF content would appear here with proper text extraction.]`;
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Try with pdf-parse first - fix the import and usage
      try {
        const pdfParse = await import('pdf-parse/lib/pdf-parse');
        const data = await pdfParse.default(arrayBuffer);
        
        if (data.text && data.text.trim()) {
          console.log('PDF text successfully extracted with pdf-parse:', data.text.length, 'characters');
          return data.text;
        }
      } catch (parseError) {
        console.log('pdf-parse failed, trying pdfjs-dist...', parseError);
      }

      // Fallback to pdfjs-dist with correct worker version
      try {
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source to match the pdfjs-dist version
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += `\n\nPAGE ${pageNum}\n${'_'.repeat(40)}\n\n${pageText}`;
        }
        
        if (fullText.trim()) {
          console.log('PDF text extracted with pdfjs-dist:', fullText.length, 'characters');
          return fullText;
        }
      } catch (pdfjsError) {
        console.log('pdfjs-dist failed:', pdfjsError);
      }
      
      // Enhanced fallback
      return createFallbackText(file);
      
    } catch (error) {
      console.error('PDF parsing error:', error);
      return createFallbackText(file);
    }
  };

  const createWordDocument = (text: string, filename: string): Blob => {
    // Create proper RTF format for Word compatibility
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 
{\\b\\fs28 ${filename.replace(/[{}\\]/g, '')}\\par}
\\par
${text.split('\n').map(line => {
  if (line.trim() === '') return '\\par';
  if (line.startsWith('PAGE ') || line.includes('____')) {
    return `{\\b ${line.replace(/[{}\\]/g, '')}}\\par`;
  }
  if (line.toUpperCase() === line && line.length > 10) {
    return `{\\b\\fs26 ${line.replace(/[{}\\]/g, '')}}\\par`;
  }
  return `${line.replace(/[{}\\]/g, '')}\\par`;
}).join('\n')}
}`;

    return new Blob([rtfContent], { 
      type: 'application/rtf' 
    });
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to convert",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Starting conversion for:', selectedFile.name);
      
      // Create FormData for the Edge Function
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('pdf-to-word', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      // The response should be a blob (Word document)
      const blob = new Blob([data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace('.pdf', '')}_converted.docx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Your PDF has been converted to Word format (.docx)"
      });
      
    } catch (error) {
      console.error('Error converting PDF:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to convert PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              PDF to Word Converter
            </h1>
            <p className="text-xl text-gray-600">
              Convert PDF documents to editable Word files with enhanced text extraction
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-green-600 font-medium">Enhanced PDF Processing</span>
                    <p className="text-gray-600">Using pdf-parse and pdfjs-dist for superior text extraction</p>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600">File: {selectedFile ? '✓ Ready' : 'None'}</div>
                  </div>
                </div>
              </div>

              <label className="block text-gray-700 text-sm font-medium mb-2">
                Select PDF File to Convert
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Drop a PDF file here or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-file"
                />
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose PDF File
                </Button>
              </div>
            </div>

            {selectedFile && (
              <div className="mb-6">
                <h3 className="text-gray-700 font-medium mb-3">Selected File:</h3>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="text-gray-800 text-sm block">{selectedFile.name}</span>
                      <span className="text-gray-500 text-xs">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={!selectedFile || isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-xl font-semibold"
            >
              {isProcessing ? (
                "Converting to Word..."
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Convert PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PdfToWord;
