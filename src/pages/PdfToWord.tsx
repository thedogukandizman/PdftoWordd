
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PdfToWord = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    
    // Simulate PDF to Word conversion
    setTimeout(() => {
      // Create a dummy Word file for download
      const blob = new Blob(['Converted Word content would be here'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name.replace('.pdf', '.docx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsProcessing(false);
      toast({
        title: "Success!",
        description: "Your PDF has been converted to Word successfully"
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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

          <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-8 shadow-lg">
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Drop a PDF file here or click to browse</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-file"
                />
                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <label htmlFor="pdf-file" className="cursor-pointer">
                    Choose PDF File
                  </label>
                </Button>
              </div>
            </div>

            {selectedFile && (
              <div className="mb-6">
                <h3 className="text-gray-700 font-medium mb-3">Selected File:</h3>
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-800 text-sm">{selectedFile.name}</span>
                  <span className="text-gray-500 text-xs">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={!selectedFile || isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isProcessing ? (
                "Converting to Word..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
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
