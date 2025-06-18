import { 
  Combine, 
  FileText, 
  MessageSquare
} from "lucide-react";
import { ToolCard } from "@/components/ToolCard";

const tools = [
  {
    icon: Combine,
    title: "Merge PDFs Instantly",
    description: "Combine unlimited files — 100% free, no limits.",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonText: "Start Merge →",
    buttonColor: "text-blue-600",
    badge: "fully free",
    badgeColor: "bg-green-500",
    href: "/merge-pdf"
  },
  {
    icon: FileText,
    title: "Convert to Word — Without Losing Formatting",
    description: "Convert any number of pages — 100% free, no paywalls.",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
    buttonText: "Convert PDF →",
    buttonColor: "text-purple-600",
    badge: "fully free",
    badgeColor: "bg-green-500",
    href: "/pdf-to-word"
  },
  {
    icon: MessageSquare,
    title: "Ask Questions About Any PDF",
    description: "Upload a document and ask unlimited questions — 100% free, no limits.",
    color: "bg-orange-100",
    iconColor: "text-orange-600",
    buttonText: "Start Chat →",
    buttonColor: "text-orange-600",
    badge: "fully free",
    badgeColor: "bg-green-500",
    href: "/chat-with-pdf"
  }
];

export const ToolsGrid = () => {
  return (
    <section id="tools" className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Choose Your PDF Tool
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional-grade PDF processing with AI-powered features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tools.map((tool, index) => (
            <ToolCard key={index} {...tool} />
          ))}
        </div>
      </div>
    </section>
  );
};
