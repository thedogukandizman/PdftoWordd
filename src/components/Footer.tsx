
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleToolClick = (path: string) => {
    navigate(path);
  };

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div 
              className="flex items-center space-x-2 mb-4 cursor-pointer" 
              onClick={handleLogoClick}
            >
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">PDFMaster</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              The most comprehensive PDF toolkit available online. Process your PDFs quickly, 
              securely, and for free.
            </p>
          </div>
          
          <div>
            <h3 className="text-gray-800 font-semibold mb-4">Tools</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleToolClick('/merge-pdf')}
                  className="text-gray-600 hover:text-gray-800 transition-colors text-left"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleToolClick('/pdf-to-word')}
                  className="text-gray-600 hover:text-gray-800 transition-colors text-left"
                >
                  PDF to Word
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleToolClick('/chat-with-pdf')}
                  className="text-gray-600 hover:text-gray-800 transition-colors text-left"
                >
                  Chat with PDF
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2024 PDFMaster. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
