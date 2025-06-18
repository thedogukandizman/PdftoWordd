import { Hero } from "@/components/Hero";
import { ToolsGrid } from "@/components/ToolsGrid";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>PDFMaster - Convert PDF to Word</title>
        <meta name="description" content="PDFMaster is the fastest, most private way to merge, convert, and chat with your PDF files. No uploads, no signups, 100% free. Powered by real AI." />
        <meta name="keywords" content="PDF, PDF tools, merge PDF, convert PDF, PDF to Word, chat with PDF, AI PDF, free PDF, private PDF, online PDF, PDFMaster" />
        <link rel="canonical" href="https://whatapdf.info/" />
        <meta property="og:title" content="PDFMaster – Free PDF Tools: Merge, Convert, Chat, Fix Instantly" />
        <meta property="og:description" content="Merge, convert, and chat with your PDFs instantly. No uploads, no signups, 100% free and private. Powered by AI." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whatapdf.info/" />
        <meta property="og:image" content="https://whatapdf.info/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PDFMaster – Free PDF Tools: Merge, Convert, Chat, Fix Instantly" />
        <meta name="twitter:description" content="Merge, convert, and chat with your PDFs instantly. No uploads, no signups, 100% free and private. Powered by AI." />
        <meta name="twitter:image" content="https://whatapdf.info/og-image.png" />
      </Helmet>
      <div className="min-h-screen bg-white">
        <Header />
        <Hero />
        <ToolsGrid />
        <Footer />
      </div>
    </>
  );
};

export default Index;
