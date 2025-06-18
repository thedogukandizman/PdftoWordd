
import { FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="relative z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={handleLogoClick}
          >
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">PDFMaster</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#tools" className="text-gray-600 hover:text-gray-800 transition-colors">Tools</a>
            <a href="#about" className="text-gray-600 hover:text-gray-800 transition-colors">About</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-800 transition-colors">Pricing</a>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Sign In
            </Button>
          </nav>
          
          <Button variant="ghost" size="icon" className="md:hidden text-gray-700">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
