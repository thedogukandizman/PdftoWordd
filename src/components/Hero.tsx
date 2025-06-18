import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-20 px-4 bg-white">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Fix Your PDF Instantly — No Signups, No Limits
          </h1>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block">
              <p className="text-lg font-medium">
                Merge. Convert. Chat. Powered by real AI. Used by 20,000+ people last week.
              </p>
            </div>
            <Button 
              onClick={scrollToTools}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-lg"
            >
              Fix My PDF Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
