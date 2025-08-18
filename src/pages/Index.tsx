import Hero from "@/components/Hero";
import Features from "@/components/Features";
import VotingPreview from "@/components/VotingPreview";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <VotingPreview />
      <Footer />
    </div>
  );
};

export default Index;
