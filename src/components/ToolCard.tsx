
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  iconColor: string;
  buttonText: string;
  buttonColor: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
}

export const ToolCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  iconColor, 
  buttonText, 
  buttonColor, 
  badge, 
  badgeColor, 
  href 
}: ToolCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 p-6">
      <CardContent className="p-0">
        <div className="text-left">
          <div className={`inline-flex p-4 rounded-2xl ${color} mb-6`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-3 leading-tight">
            {title}
          </h3>
          
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {description}
          </p>
          
          <Button 
            onClick={handleClick}
            className={`${buttonColor} hover:bg-gray-50 border border-gray-300 px-6 py-3 text-base font-medium mb-4 w-full`}
            disabled={!href}
            variant="outline"
          >
            {buttonText}
          </Button>

          {badge && (
            <div className="flex justify-center">
              <span className={`${badgeColor} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                {badge}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
