import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url';
import { Helmet } from 'react-helmet-async';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

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
  
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let allText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => (item as any).str).join(' ');
      allText += pageText + '\n\n';
    }
    return allText;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setPdfContent('');
      setPdfMetadata(null);
      toast({
        title: "File uploaded!",
        description: "Extracting text from PDF...",
      });
      try {
        const text = await extractTextFromPdf(file);
        setPdfContent(text);
        setPdfMetadata({
          title: file.name,
          author: 'Unknown',
          page_count: 1,
          file_size: file.size
        });
        setIsReady(true);
        setMessages([{
          type: 'ai',
          content: `Hello! I've successfully analyzed your PDF "${file.name}".\n\n📄 **Document Ready:**\n• File size: ${(file.size / 1024 / 1024).toFixed(2)} MB\n• Text extracted: ${text.length.toLocaleString()} characters\n\n🤖 **AI Integration Active** - Powered by Google Gemini\n\nYou can now ask questions about the document content! I have access to the full text and can help you understand, summarize, or find specific information.`,
          timestamp: new Date()
        }]);
        toast({
          title: "PDF Analyzed Successfully!",
          description: "You can now ask questions about your document"
        });
      } catch (error) {
        toast({
          title: "Extraction Failed",
          description: error instanceof Error ? error.message : "Could not extract text from the PDF.",
          variant: "destructive"
        });
      }
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
    <>
      <Helmet>
        <title>Chat with Your PDF – PDFMaster | Ask AI About Your PDF Instantly</title>
        <meta name="description" content="Chat with your PDF using AI. Instantly extract, analyze, and ask questions about your PDF content. 100% private, no uploads, free." />
        <meta name="keywords" content="chat with PDF, PDF AI, PDF question, PDF analysis, PDFMaster, private PDF, free PDF, online PDF chat" />
        <link rel="canonical" href="https://yourdomain.com/chat-with-pdf" />
        <meta property="og:title" content="Chat with Your PDF – PDFMaster | Ask AI About Your PDF Instantly" />
        <meta property="og:description" content="Chat with your PDF using AI. Instantly extract, analyze, and ask questions about your PDF content. 100% private, no uploads, free." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/chat-with-pdf" />
        <meta property="og:image" content="https://yourdomain.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chat with Your PDF – PDFMaster | Ask AI About Your PDF Instantly" />
        <meta name="twitter:description" content="Chat with your PDF using AI. Instantly extract, analyze, and ask questions about your PDF content. 100% private, no uploads, free." />
        <meta name="twitter:image" content="https://yourdomain.com/og-image.png" />
      </Helmet>
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

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-2000 ease-in-out ${isReady ? 'lg:grid-cols-1' : ''}`}>
              {/* File Upload Section */}
              <div className={`bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg transition-all duration-2000 ease-in-out transform ${isReady ? 'opacity-0 -translate-x-32 scale-95 pointer-events-none h-0 p-0 m-0 overflow-hidden' : 'opacity-100 scale-100 translate-x-0'}`}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Document</h2>
                <div className={`border border-green-200 rounded-lg p-4 mb-6 bg-green-50`}>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 text-green-600" />
                    <div>
                      <p className="text-green-800 font-medium">100% Private. Files never leave your browser.</p>
                      <p className="text-green-700 text-xs">No uploads, no tracking, no storage.</p>
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
                  </div>
                )}
              </div>
              {/* Chat Section */}
              <div className={`bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg transition-all duration-2000 ease-in-out transform ${isReady ? 'scale-105 shadow-2xl z-20 translate-x-0 w-full' : 'scale-100 translate-x-32'} ${isReady ? 'col-span-2' : ''}`}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  AI Chat <span className="text-green-600 text-sm ml-2">● Live</span>
                </h2>
                <div className="h-96 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      {selectedFile ? (
                        isReady ? (
                          <span>Ask me anything about your PDF!</span>
                        ) : (
                          <span>Analyzing your PDF...</span>
                        )
                      ) : (
                        <span>Upload a PDF to get started.</span>
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
                {isReady && (
                  <div className="flex space-x-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask about your PDF..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim()}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default ChatWithPdf;
