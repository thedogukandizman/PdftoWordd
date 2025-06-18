
import { Hero } from "@/components/Hero";
import { ToolsGrid } from "@/components/ToolsGrid";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      <Hero />
      <ToolsGrid />
      <Footer />
    </div>
  );
};

export default Index;
