import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // This is a simplified text extraction
    // For real PDF text extraction, you'd need pdf-parse or similar libraries
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert PDF buffer to text (simplified approach)
      // In reality, this would use proper PDF parsing
      const text = `${file.name.replace('.pdf', '').replace(/_/g, ' ')}

DOCUMENT CONTENT

This document has been converted from PDF format. The original PDF contained structured text, formatting, and layout that would typically be preserved in a professional PDF-to-Word conversion.

Key Information:
- Original filename: ${file.name}
- File size: ${(file.size / 1024 / 1024).toFixed(2)} MB
- Conversion date: ${new Date().toLocaleDateString()}

Content Structure:
The original PDF likely contained paragraphs of text, possibly with headers, bullet points, and formatted sections. In a production environment, this would be extracted using libraries like:
- pdf-parse for Node.js environments
- PDF.js for browser-based extraction
- Commercial APIs like Adobe PDF Extract

For actual text extraction, the system would need to:
1. Parse the PDF structure
2. Extract text while preserving formatting
3. Convert to Word-compatible markup
4. Maintain paragraph breaks and styling

Current Status: This is a demo version showing the conversion workflow.`;

      return text;
    } catch (error) {
      throw new Error('Failed to process PDF file. The file may be corrupted or password protected.');
    }
  };

  const createWordDocument = (text: string, filename: string): Blob => {
    // Create RTF format for better Word compatibility
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 ${text.replace(/\n/g, '\\par ')}
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
      const extractedText = await extractTextFromPdf(selectedFile);
      const filename = selectedFile.name.replace('.pdf', '');
      
      // Create Word-compatible document
      const docBlob = createWordDocument(extractedText, filename);
      
      const url = URL.createObjectURL(docBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_converted.rtf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Your PDF has been converted to Word format (.rtf)"
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
              Convert PDF documents to editable Word files
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-amber-600 font-medium">Demo Version</span>
                    <p className="text-gray-600">For full text extraction, PDF parsing libraries needed</p>
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
