
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  href?: string;
}

export const ToolCard = ({ icon: Icon, title, description, color, href }: ToolCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <Card className="group bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <CardContent className="p-6">
        <div className="text-center">
          <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
            {title}
          </h3>
          
          <p className="text-white/70 mb-4 text-sm leading-relaxed">
            {description}
          </p>
          
          <Button 
            onClick={handleClick}
            variant="outline" 
            size="sm" 
            className="border-white/20 text-white hover:bg-white/10 group-hover:border-blue-400 transition-all duration-300"
            disabled={!href}
          >
            {href ? "Use Tool" : "Coming Soon"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
