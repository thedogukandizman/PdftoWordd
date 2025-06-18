
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send, FileText, MessageSquare, AlertCircle, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createAIService } from '@/services/aiService';

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
  
  // AI Configuration - with default API key
  const [showConfig, setShowConfig] = useState(false);
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [apiKey, setApiKey] = useState('your-default-api-key-here'); // Add your API key here
  const [isUsingAI, setIsUsingAI] = useState(true); // Enable AI by default

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

  const extractPdfContent = async (file: File): Promise<{ content: string; metadata: any }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Use pdf-parse to extract text
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      
      const metadata = {
        title: file.name,
        author: data.info?.Author || 'Unknown',
        subject: data.info?.Subject || '',
        keywords: data.info?.Keywords || '',
        creator: data.info?.Creator || '',
        producer: data.info?.Producer || '',
        creationDate: data.info?.CreationDate || null,
        modificationDate: data.info?.ModDate || null,
        pageCount: data.numpages,
        fileSize: file.size
      };
      
      return { content: data.text, metadata };
    } catch (error) {
      console.error('PDF parsing error:', error);
      // Fallback to basic extraction
      const metadata = {
        title: file.name,
        author: 'Unknown',
        pageCount: 1,
        fileSize: file.size
      };
      
      const fallbackContent = `Document: ${file.name}
      
This PDF document has been uploaded but couldn't be fully parsed. The AI can still answer general questions about the document structure and help with basic queries.

File Details:
- Name: ${file.name}
- Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
- Type: PDF Document`;

      return { content: fallbackContent, metadata };
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    
    try {
      const { content, metadata } = await extractPdfContent(selectedFile);
      
      setPdfContent(content);
      setPdfMetadata(metadata);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setIsReady(true);
        setMessages([{
          type: 'ai',
          content: `Hello! I've analyzed your PDF "${selectedFile?.name}".

📄 **Document Ready:**
• Pages: ${metadata.pageCount}
• Author: ${metadata.author}
• File size: ${(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
• Status: Ready for questions

🤖 **AI Integration Active** - Powered by ${aiProvider.toUpperCase()}

You can now ask questions about the document content! I have access to the full text and can help you understand, summarize, or find specific information.`,
          timestamp: new Date()
        }]);
        toast({
          title: "PDF Analyzed Successfully!",
          description: "You can now ask questions about your document"
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
    
    // Use AI if configured
    if (apiKey && isUsingAI) {
      try {
        const aiService = createAIService(aiProvider, apiKey);
        const response = await aiService.chatWithPDF({
          pdfContent,
          userQuestion: question
        });
        
        const aiResponse: ChatMessage = {
          type: 'ai',
          content: response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        
      } catch (error) {
        const errorResponse: ChatMessage = {
          type: 'ai',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. This might be due to API limits or connectivity issues. Please try again.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    }
  };

  const saveAIConfig = () => {
    if (apiKey.trim()) {
      setIsUsingAI(true);
      setShowConfig(false);
      toast({
        title: "AI Configuration Saved",
        description: `${aiProvider.toUpperCase()} integration activated`
      });
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid API key",
        variant: "destructive"
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Upload Document</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-gray-600"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  AI Settings
                </Button>
              </div>
              
              {showConfig && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-800 mb-3">AI Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                      <select 
                        value={aiProvider} 
                        onChange={(e) => setAiProvider(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="openai">OpenAI GPT-4</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="google">Google Gemini</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="w-full"
                      />
                    </div>
                    <Button onClick={saveAIConfig} className="w-full">
                      Save Configuration
                    </Button>
                  </div>
                </div>
              )}

              <div className={`border border-green-200 rounded-lg p-4 mb-6 bg-green-50`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-green-600" />
                  <div className="text-sm">
                    <span className="font-medium text-green-700">
                      AI Integration Ready
                    </span>
                    <p className="text-gray-600 mt-1">
                      Upload a PDF and start asking questions!
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
