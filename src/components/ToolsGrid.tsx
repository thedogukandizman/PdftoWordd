
import { 
  Combine, 
  Scissors, 
  Archive, 
  RotateCcw, 
  FileImage, 
  FileText, 
  Lock, 
  Unlock,
  Edit3,
  Eye,
  Download,
  Upload
} from "lucide-react";
import { ToolCard } from "@/components/ToolCard";

const tools = [
  {
    icon: Combine,
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Extract pages or split PDF into multiple files",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Archive,
    title: "Compress PDF",
    description: "Reduce PDF file size without losing quality",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: RotateCcw,
    title: "Rotate PDF",
    description: "Rotate PDF pages to the correct orientation",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: FileImage,
    title: "PDF to Image",
    description: "Convert PDF pages to JPG, PNG, or other formats",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: FileText,
    title: "Image to PDF",
    description: "Convert images to PDF documents easily",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: Lock,
    title: "Protect PDF",
    description: "Add password protection to your PDF files",
    color: "from-red-500 to-pink-500"
  },
  {
    icon: Unlock,
    title: "Unlock PDF",
    description: "Remove password protection from PDF files",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Edit3,
    title: "Edit PDF",
    description: "Add text, images, and annotations to PDFs",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Eye,
    title: "PDF Reader",
    description: "View and read PDF files online",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Download,
    title: "PDF Converter",
    description: "Convert PDFs to Word, Excel, PowerPoint",
    color: "from-blue-500 to-indigo-500"
  },
  {
    icon: Upload,
    title: "Create PDF",
    description: "Create PDFs from scratch or templates",
    color: "from-pink-500 to-rose-500"
  }
];

export const ToolsGrid = () => {
  return (
    <section id="tools" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            All PDF Tools You Need
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Professional-grade PDF processing tools designed for speed, security, and ease of use.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <ToolCard key={index} {...tool} />
          ))}
        </div>
      </div>
    </section>
  );
};
