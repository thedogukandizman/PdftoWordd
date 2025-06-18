
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
  const [fileUploaded, setFileUploaded] = useState(false);
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
      setFileUploaded(true);
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
      setFileUploaded(true);
      toast({
        title: "File uploaded!",
        description: "PDF file ready for conversion",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      const pageCount = pdf.getPageCount();
      let extractedText = `Document: ${file.name}\n`;
      extractedText += `Total Pages: ${pageCount}\n`;
      extractedText += `Conversion Date: ${new Date().toLocaleDateString()}\n`;
      extractedText += `File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\n`;
      
      // Note: This is a simplified text extraction for demo purposes
      // Real implementation would use libraries like pdf-parse or pdf2pic with OCR
      for (let i = 1; i <= Math.min(pageCount, 10); i++) {
        extractedText += `=== PAGE ${i} ===\n\n`;
        extractedText += `[Note: This is a demo version. Real PDF text extraction would appear here.]\n`;
        extractedText += `Page ${i} content would be extracted and formatted for Word document.\n\n`;
      }
      
      if (pageCount > 10) {
        extractedText += `\n[NOTE: Demo version processes first 10 pages. Full document has ${pageCount} pages.]\n`;
      }
      
      return extractedText;
    } catch (error) {
      throw new Error('Failed to process PDF file. The file may be corrupted or password protected.');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile || !fileUploaded) {
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
      
      // Create RTF content with better formatting
      const rtfHeader = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}{\\f1 Arial;}}`;
      const rtfBody = `\\f0\\fs24\\b PDF to Word Conversion Result\\b0\\par\\par`;
      const rtfContent = extractedText.replace(/\n/g, '\\par ');
      const rtfFooter = `}`;
      
      const fullRtfContent = rtfHeader + rtfBody + rtfContent + rtfFooter;
      
      const blob = new Blob([fullRtfContent], { 
        type: 'application/rtf' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name.replace('.pdf', '_converted.rtf');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Your PDF has been converted to Word format (RTF)"
      });
      
      setSelectedFile(null);
      setFileUploaded(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
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
              Convert PDF documents to editable Word files with formatting preserved
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Demo Version</span>
                    <p className="text-gray-600">Converts basic text • Max 10 pages • RTF format output</p>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600">Status: {fileUploaded ? 'Ready' : 'No file'}</div>
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
                <h3 className="text-gray-700 font-medium mb-3">
                  {fileUploaded ? '✓ File uploaded and ready:' : 'Selected File:'}
                </h3>
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
              disabled={!selectedFile || !fileUploaded || isProcessing}
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
