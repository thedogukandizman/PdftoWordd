
import { FileText, Mail, Twitter, Github } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">PDFMaster</span>
            </div>
            <p className="text-white/70 mb-4 max-w-md">
              The most comprehensive PDF toolkit available online. Process your PDFs quickly, 
              securely, and for free.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-blue-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-blue-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Tools</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Merge PDF</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Split PDF</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Compress PDF</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Convert PDF</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/70">
          <p>&copy; 2024 PDFMaster. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
