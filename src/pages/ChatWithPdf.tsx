import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send, FileText, MessageSquare, AlertCircle } from 'lucide-react';
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

  const extractPdfContent = async (file: File): Promise<{ content: string; metadata: any }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();
      
      // Extract metadata
      const metadata = {
        title: pdf.getTitle() || file.name,
        author: pdf.getAuthor() || 'Unknown',
        subject: pdf.getSubject() || '',
        keywords: pdf.getKeywords() || '',
        creator: pdf.getCreator() || '',
        producer: pdf.getProducer() || '',
        creationDate: pdf.getCreationDate(),
        modificationDate: pdf.getModificationDate(),
        pageCount: pageCount,
        fileSize: file.size
      };
      
      // Simulate content extraction with more realistic structure
      let content = `DOCUMENT ANALYSIS REPORT\n`;
      content += `============================\n\n`;
      content += `Document: ${metadata.title}\n`;
      content += `Author: ${metadata.author}\n`;
      content += `Pages: ${pageCount}\n`;
      content += `File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB\n`;
      if (metadata.creationDate) {
        content += `Created: ${metadata.creationDate.toLocaleDateString()}\n`;
      }
      content += `\nCONTENT STRUCTURE:\n\n`;
      
      // Simulate realistic document structure analysis
      const documentTypes = ['Technical Report', 'Academic Paper', 'Business Document', 'Manual', 'Presentation'];
      const randomType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      
      content += `Document Type: ${randomType}\n`;
      content += `Language: English (detected)\n`;
      content += `Text Density: ${Math.floor(Math.random() * 40 + 60)}% text coverage\n`;
      content += `Images/Graphics: ${Math.floor(Math.random() * 10)} detected\n`;
      content += `Tables: ${Math.floor(Math.random() * 5)} detected\n\n`;
      
      content += `PAGE BREAKDOWN:\n`;
      for (let i = 1; i <= Math.min(pageCount, 10); i++) {
        const wordCount = Math.floor(Math.random() * 400 + 100);
        content += `Page ${i}: ~${wordCount} words, contains headings, paragraphs, and structured content\n`;
      }
      
      if (pageCount > 10) {
        content += `... and ${pageCount - 10} more pages\n`;
      }
      
      content += `\nKEY TOPICS IDENTIFIED:\n`;
      const topics = ['Introduction', 'Methodology', 'Analysis', 'Results', 'Conclusion', 'References'];
      topics.forEach(topic => {
        content += `- ${topic}\n`;
      });
      
      return { content, metadata };
    } catch (error) {
      throw new Error('Failed to analyze PDF content. The file may be corrupted or password protected.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !fileUploaded) return;
    
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
          content: `Hello! I've successfully analyzed your PDF "${selectedFile?.name}". 

📄 **Document Summary:**
• ${metadata.pageCount} pages
• ${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB
• Created: ${metadata.creationDate ? metadata.creationDate.toLocaleDateString() : 'Unknown'}

I can now help you understand the document structure, extract information, and answer questions about the content. What would you like to know?

*Note: This is a demo version. For real AI-powered PDF chat, an API integration with services like OpenAI, Claude, or Gemini would be needed.*`,
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

  const generateSmartResponse = (question: string, content: string, metadata: any): string => {
    const lowerQuestion = question.toLowerCase();
    
    // More intelligent responses based on actual PDF data
    if (lowerQuestion.includes('page') || lowerQuestion.includes('how many')) {
      return `Your PDF has **${metadata.pageCount} pages**. Each page contains structured content including text, headings, and possibly images or tables.`;
    }
    
    if (lowerQuestion.includes('size') || lowerQuestion.includes('big')) {
      return `The document is **${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB** in size, which is ${metadata.fileSize > 5000000 ? 'quite large' : 'a reasonable size'} for a PDF document.`;
    }
    
    if (lowerQuestion.includes('author') || lowerQuestion.includes('who wrote')) {
      return `The document author is listed as: **${metadata.author}**${metadata.creator ? ` (Created with: ${metadata.creator})` : ''}`;
    }
    
    if (lowerQuestion.includes('when') || lowerQuestion.includes('date')) {
      const created = metadata.creationDate ? metadata.creationDate.toLocaleDateString() : 'Unknown';
      return `The document was created on **${created}**${metadata.modificationDate ? ` and last modified on ${metadata.modificationDate.toLocaleDateString()}` : ''}.`;
    }
    
    if (lowerQuestion.includes('summary') || lowerQuestion.includes('about') || lowerQuestion.includes('content')) {
      return `Based on my analysis, this appears to be a **${metadata.pageCount}-page document** with structured content. The document contains:

• Multiple sections with headings and paragraphs
• Estimated text coverage of 60-90%
• Possible tables and graphics
• Well-organized layout

The content seems to follow a logical structure typical of professional documents. Would you like me to focus on any specific aspect?`;
    }
    
    if (lowerQuestion.includes('search') || lowerQuestion.includes('find')) {
      return `I can help you understand the document structure, but for precise text search within the PDF content, you would need a full PDF parsing implementation. Currently, I can tell you about the document's overall structure and metadata.`;
    }
    
    // Default intelligent response
    return `That's an interesting question about your PDF! Based on my analysis:

📊 **Document Stats:**
• ${metadata.pageCount} pages
• ${metadata.author} (author)
• ${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB

Your question: "${question}"

In a full implementation with AI integration (OpenAI GPT, Claude, or Gemini), I would analyze the actual text content and provide specific answers about your document. For now, I can help with document metadata and structure questions!`;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !isReady || questionsUsed >= 5) return;
    
    const userMessage: ChatMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setQuestionsUsed(prev => prev + 1);
    
    // Generate smarter AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        type: 'ai',
        content: generateSmartResponse(userMessage.content, pdfContent, pdfMetadata),
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
              Upload a PDF and ask questions about its content using AI analysis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload Section */}
            <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Document</h2>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <span className="text-amber-700 font-medium">Demo Version - AI Integration Required</span>
                    <p className="text-gray-600 mt-1">For real AI-powered PDF chat, connect to OpenAI, Claude, or Gemini API</p>
                    <div className="mt-2 text-right">
                      <div className="text-gray-600">Questions used: {questionsUsed}/5</div>
                      <div className="text-gray-600">Status: {fileUploaded ? (isReady ? 'Ready' : 'Analyzing') : 'No file'}</div>
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
                  placeholder={isReady && questionsUsed < 5 ? "Ask about your PDF..." : questionsUsed >= 5 ? "Question limit reached" : "Upload and analyze PDF first"}
                  disabled={!isReady || questionsUsed >= 5}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || !isReady || questionsUsed >= 5}
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
