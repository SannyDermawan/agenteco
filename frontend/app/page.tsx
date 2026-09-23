import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Product } from "@/components/landing/Product";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Developers } from "@/components/landing/Developers";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { SectionSeam } from "@/components/landing/ui";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090D] text-[#F5F5F7]">
      <Navbar />
      <Hero />
      <Product />
      <SectionSeam />
      <HowItWorks />
      <SectionSeam />
      <Developers />
      <FinalCta />
      <Footer />
    </main>
  );
}
