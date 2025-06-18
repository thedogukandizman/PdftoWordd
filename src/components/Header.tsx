
import { FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="relative z-50 bg-white/10 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">PDFMaster</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#tools" className="text-white/80 hover:text-white transition-colors">Tools</a>
            <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
            <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Sign In
            </Button>
          </nav>
          
          <Button variant="ghost" size="icon" className="md:hidden text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
