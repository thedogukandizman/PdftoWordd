
import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PDFDocument } from 'pdf-lib';

const MergePdf = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Please select only PDF files",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Please select only PDF files",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please select at least 2 PDF files to merge",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Your PDFs have been merged successfully"
      });
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to merge PDFs. Please try again.",
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
              Merge PDF Files
            </h1>
            <p className="text-xl text-gray-600">
              Combine multiple PDF files into one document
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Select PDF Files to Merge
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
                <p className="text-gray-600 mb-4">Drop PDF files here or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-files"
                />
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <label htmlFor="pdf-files" className="cursor-pointer">
                    Choose PDF Files
                  </label>
                </Button>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-gray-700 font-medium mb-3">Selected Files ({selectedFiles.length}):</h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <span className="text-gray-800 text-sm block">{file.name}</span>
                          <span className="text-gray-500 text-xs">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleMerge}
              disabled={selectedFiles.length < 2 || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 text-lg"
            >
              {isProcessing ? (
                "Merging PDFs..."
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Merge {selectedFiles.length} PDFs
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

export default MergePdf;
