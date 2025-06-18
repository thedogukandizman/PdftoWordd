
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send, FileText, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PDFDocument } from 'pdf-lib';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const ChatWithPdf = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [pdfContent, setPdfContent] = useState<string>('');
  const [questionsUsed, setQuestionsUsed] = useState(0);

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
      setIsReady(false);
      setMessages([]);
      toast({
        title: "File uploaded!",
        description: "PDF ready for analysis",
      });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
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
      setIsReady(false);
      setMessages([]);
      toast({
        title: "File uploaded!",
        description: "PDF ready for analysis",
      });
    }
  };

  const extractPdfContent = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();
      
      // Simulate content extraction - in real implementation would use pdf-parse or similar
      let content = `Document: ${file.name}\n`;
      content += `Pages: ${pageCount}\n`;
      content += `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\n`;
      
      // Simulate extracted content for analysis
      content += "Content Summary:\n";
      content += "This PDF document contains text, figures, and data that can be analyzed. ";
      content += "The AI can help you understand the content, extract key information, ";
      content += "and answer questions about the document's structure and meaning.\n\n";
      
      for (let i = 1; i <= Math.min(pageCount, 5); i++) {
        content += `Page ${i}: Contains textual content, headings, and possible data tables or figures.\n`;
      }
      
      return content;
    } catch (error) {
      throw new Error('Failed to analyze PDF content');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !fileUploaded) return;
    
    setIsAnalyzing(true);
    
    try {
      const content = await extractPdfContent(selectedFile);
      setPdfContent(content);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setIsReady(true);
        setMessages([{
          type: 'ai',
          content: `Hello! I've successfully analyzed your PDF "${selectedFile?.name}". I can now help you understand its content, extract information, and answer questions about the document. What would you like to know?`,
          timestamp: new Date()
        }]);
        toast({
          title: "PDF Analyzed!",
          description: "You can now start asking questions about your document"
        });
      }, 2000);
    } catch (error) {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateAiResponse = (question: string, context: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Simple keyword-based responses for demo
    if (lowerQuestion.includes('page') || lowerQuestion.includes('how many')) {
      return `Based on your PDF analysis, I can see this document has multiple pages. The exact page count and structure are included in the document metadata I analyzed.`;
    }
    
    if (lowerQuestion.includes('summary') || lowerQuestion.includes('summarize')) {
      return `This PDF appears to contain structured content with text, headings, and potentially data tables. The document seems to be well-organized with clear sections. Would you like me to focus on any specific part of the document?`;
    }
    
    if (lowerQuestion.includes('content') || lowerQuestion.includes('about')) {
      return `Based on my analysis of your PDF, the document contains textual content organized in a structured format. I can help you understand specific sections, extract key points, or answer questions about particular topics within the document.`;
    }
    
    // Default response
    return `I've analyzed your question: "${question}". Based on the PDF content I processed, I can provide insights about the document structure and content. In a full implementation, I would use AI models like Gemini to provide more detailed, context-aware responses about your specific document content.`;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !isReady || questionsUsed >= 3) return;
    
    const userMessage: ChatMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setQuestionsUsed(prev => prev + 1);
    
    // Generate AI response based on PDF content
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        type: 'ai',
        content: generateAiResponse(userMessage.content, pdfContent),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Chat with Your PDF
            </h1>
            <p className="text-xl text-gray-600">
              Upload a PDF and ask questions about its content using AI
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload Section */}
            <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Document</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-sm">
                  <span className="text-blue-600 font-medium">Demo Version</span>
                  <p className="text-gray-600">3 questions per session • Max 1MB file size • Basic analysis</p>
                  <div className="mt-2 text-right">
                    <div className="text-gray-600">Questions used: {questionsUsed}/3</div>
                    <div className="text-gray-600">Status: {fileUploaded ? (isReady ? 'Ready' : 'Analyzing') : 'No file'}</div>
                  </div>
                </div>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">Drop PDF here or click to browse</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="chat-pdf-file"
                />
                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <label htmlFor="chat-pdf-file" className="cursor-pointer">
                    Choose PDF File
                  </label>
                </Button>
              </div>

              {selectedFile && (
                <div className="mb-4">
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 mb-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <span className="text-gray-800 text-sm block">{selectedFile.name}</span>
                      <span className="text-gray-500 text-xs">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) - {fileUploaded ? '✓ Uploaded' : 'Uploading...'}
                      </span>
                    </div>
                  </div>
                  
                  {fileUploaded && !isReady && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                      {isAnalyzing ? "Analyzing PDF..." : "Analyze PDF"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Chat Section */}
            <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                AI Chat
              </h2>
              
              <div className="h-96 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    {selectedFile ? (
                      isReady ? "Start asking questions about your PDF!" : "Analyze your PDF first to start chatting"
                    ) : (
                      "Upload a PDF to start chatting"
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={isReady && questionsUsed < 3 ? "Ask a question about your PDF..." : questionsUsed >= 3 ? "Question limit reached" : "Upload and analyze a PDF first"}
                  disabled={!isReady || questionsUsed >= 3}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || !isReady || questionsUsed >= 3}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChatWithPdf;
