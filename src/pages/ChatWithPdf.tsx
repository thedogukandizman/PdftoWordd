import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [pdfContent, setPdfContent] = useState<string>('');
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [pdfMetadata, setPdfMetadata] = useState<any>(null);
  
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
      setIsReady(false);
      setMessages([]);
      setQuestionsUsed(0);
      console.log('File selected:', file.name);
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
      setIsReady(false);
      setMessages([]);
      setQuestionsUsed(0);
      console.log('File dropped:', file.name);
      toast({
        title: "File uploaded!",
        description: "PDF ready for analysis",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    
    try {
      console.log('Analyzing PDF:', selectedFile.name);
      
      // Create FormData for the Edge Function
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      // Call the text extraction Edge Function
      const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      setPdfContent(data.text);
      setPdfMetadata(data.metadata);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setIsReady(true);
        setMessages([{
          type: 'ai',
          content: `Hello! I've successfully analyzed your PDF "${selectedFile?.name}".

📄 **Document Ready:**
• Pages: ${data.metadata.page_count}
• Author: ${data.metadata.author || 'Unknown'}
• Title: ${data.metadata.title || selectedFile?.name}
• File size: ${(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
• Text extracted: ${data.text.length.toLocaleString()} characters

🤖 **AI Integration Active** - Powered by Google Gemini

You can now ask questions about the document content! I have access to the full text and can help you understand, summarize, or find specific information.`,
          timestamp: new Date()
        }]);
        toast({
          title: "PDF Analyzed Successfully!",
          description: "You can now ask questions about your document"
        });
      }, 1000);
    } catch (error) {
      setIsAnalyzing(false);
      console.error('Error analyzing PDF:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !isReady) return;
    
    const userMessage: ChatMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const question = currentMessage;
    setCurrentMessage('');
    setQuestionsUsed(prev => prev + 1);
    
    // Add loading message
    const loadingMessage: ChatMessage = {
      type: 'ai',
      content: 'Thinking...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      console.log('Sending question to AI:', question);
      
      const { data, error } = await supabase.functions.invoke('chat-with-pdf', {
        body: JSON.stringify({
          pdfContent,
          userQuestion: question
        })
      });

      if (error) {
        throw error;
      }

      // Remove loading message and add real response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        };
        return newMessages;
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Replace loading message with error
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          type: 'ai',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date()
        };
        return newMessages;
      });
    }
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
              
              <div className={`border border-green-200 rounded-lg p-4 mb-6 bg-green-50`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-green-600" />
                  <div className="text-sm">
                    <span className="font-medium text-green-700">
                      AI Integration Ready
                    </span>
                    <p className="text-gray-600 mt-1">
                      Powered by Google Gemini - Upload a PDF and start asking questions!
                    </p>
                    <div className="mt-2 text-right">
                      <div className="text-gray-600">Questions: {questionsUsed}/∞</div>
                      <div className="text-gray-600">Status: {selectedFile ? (isReady ? 'Ready' : 'Analyzing') : 'No file'}</div>
                    </div>
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
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => document.getElementById('chat-pdf-file')?.click()}
                >
                  Choose PDF File
                </Button>
              </div>

              {selectedFile && (
                <div className="mb-4">
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 mb-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <span className="text-gray-800 text-sm block">{selectedFile.name}</span>
                      <span className="text-gray-500 text-xs">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) - ✓ Uploaded
                      </span>
                    </div>
                  </div>
                  
                  {!isReady && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-6 text-xl font-semibold"
                    >
                      {isAnalyzing ? "Analyzing PDF..." : "Start Chat"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Chat Section */}
            <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                AI Chat <span className="text-green-600 text-sm ml-2">● Live</span>
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
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
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
                  placeholder={isReady ? "Ask about your PDF..." : "Upload and analyze PDF first"}
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
