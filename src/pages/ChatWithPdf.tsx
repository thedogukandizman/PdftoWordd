
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send, FileText, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
    setIsReady(false);
    setMessages([]);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    
    // Simulate PDF analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsReady(true);
      setMessages([{
        type: 'ai',
        content: `Hello! I've analyzed your PDF "${selectedFile?.name}". I can help you understand its content, answer questions, and extract information. What would you like to know?`,
        timestamp: new Date()
      }]);
      toast({
        title: "PDF Analyzed!",
        description: "You can now start chatting with your document"
      });
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !isReady) return;
    
    const userMessage: ChatMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        type: 'ai',
        content: `I understand you're asking about "${currentMessage}". Based on the PDF content, here's what I found: This is a simulated response. In a real implementation, I would analyze the PDF content and provide relevant answers based on the document's text, tables, and structure.`,
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
                  <span className="text-blue-600 font-medium">Free Tier</span>
                  <p className="text-gray-600">3 questions per session • Max 1MB file size • One document per session</p>
                  <div className="mt-2 text-right">
                    <div className="text-gray-600">Questions used: 0/3</div>
                    <div className="text-gray-600">Documents: 0/1</div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                <Upload className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">Upload PDF to start chatting</p>
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
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                  
                  {!isReady && (
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
                  placeholder={isReady ? "Ask a question about your PDF..." : "Upload and analyze a PDF first"}
                  disabled={!isReady}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || !isReady}
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
