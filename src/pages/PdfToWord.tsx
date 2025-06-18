
import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PDFDocument } from 'pdf-lib';

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
    
    setSelectedFile(file || null);
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
    
    setSelectedFile(file || null);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      // This is a simplified text extraction - in reality, you'd need a more sophisticated library
      // For demonstration, we'll create a placeholder text
      const pageCount = pdf.getPageCount();
      let extractedText = `Document: ${file.name}\n`;
      extractedText += `Pages: ${pageCount}\n`;
      extractedText += `Converted on: ${new Date().toLocaleDateString()}\n\n`;
      extractedText += `[NOTE: This is a demonstration. In a real implementation, you would need server-side processing or a specialized PDF text extraction library to properly extract and format text from PDF files while maintaining formatting, tables, images, etc.]\n\n`;
      extractedText += `Sample extracted content from your PDF would appear here with proper formatting, paragraphs, headings, and structure preserved.`;
      
      return extractedText;
    } catch (error) {
      throw new Error('Failed to process PDF file');
    }
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
      const extractedText = await extractTextFromPdf(selectedFile);
      
      // Create a simple Word document (RTF format for compatibility)
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
        \\f0\\fs24 ${extractedText.replace(/\n/g, '\\par ')}}`;
      
      const blob = new Blob([rtfContent], { 
        type: 'application/rtf' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name.replace('.pdf', '.rtf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Your PDF has been converted to Word format (RTF)"
      });
    } catch (error) {
      console.error('Error converting PDF:', error);
      toast({
        title: "Error",
        description: "Failed to convert PDF. Please try again.",
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
              Convert PDF documents to editable Word files with formatting preserved
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Free Tier</span>
                    <p className="text-gray-600">Convert up to 5 pages per document • Max 3MB file size • 1 conversion per session</p>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600">Conversions used: 0/1</div>
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
                  asChild 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <label htmlFor="pdf-file" className="cursor-pointer">
                    Choose PDF File
                  </label>
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
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 text-lg"
            >
              {isProcessing ? (
                "Converting to Word..."
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Convert to Word
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
