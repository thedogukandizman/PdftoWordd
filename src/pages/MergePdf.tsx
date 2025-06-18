
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MergePdf = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
    
    setSelectedFiles(pdfFiles);
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
    
    // Simulate PDF processing (in real implementation, you'd use a PDF library like pdf-lib)
    setTimeout(() => {
      // Create a dummy merged file for download
      const blob = new Blob(['Merged PDF content would be here'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsProcessing(false);
      toast({
        title: "Success!",
        description: "Your PDFs have been merged successfully"
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Merge PDF Files
            </h1>
            <p className="text-xl text-white/70">
              Combine multiple PDF files into one document
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">
                Select PDF Files to Merge
              </label>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-white/70 mb-4">Drop PDF files here or click to browse</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-files"
                />
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <label htmlFor="pdf-files" className="cursor-pointer">
                    Choose PDF Files
                  </label>
                </Button>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Selected Files:</h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <span className="text-white text-sm">{file.name}</span>
                      <span className="text-white/50 text-xs">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleMerge}
              disabled={selectedFiles.length < 2 || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isProcessing ? (
                "Merging PDFs..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Merge PDFs
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
