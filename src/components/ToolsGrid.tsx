
import { 
  Combine, 
  FileText, 
  MessageSquare
} from "lucide-react";
import { ToolCard } from "@/components/ToolCard";

const tools = [
  {
    icon: Combine,
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document instantly",
    color: "from-blue-500 to-cyan-500",
    href: "/merge-pdf"
  },
  {
    icon: FileText,
    title: "PDF to Word",
    description: "Convert PDF documents to editable Word files with formatting preserved",
    color: "from-purple-500 to-pink-500",
    href: "/pdf-to-word"
  },
  {
    icon: MessageSquare,
    title: "Chat with PDF",
    description: "Upload a PDF and ask questions about its content using AI",
    color: "from-orange-500 to-red-500",
    href: "/chat-with-pdf"
  }
];

export const ToolsGrid = () => {
  return (
    <section id="tools" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Essential PDF Tools
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Three powerful PDF processing tools designed for speed, security, and ease of use.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tools.map((tool, index) => (
            <ToolCard key={index} {...tool} />
          ))}
        </div>
      </div>
    </section>
  );
};
