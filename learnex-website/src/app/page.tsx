"use client"
import React from 'react';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { AboutSection } from '@/components/about-section';
import { AppShowcase } from '@/components/app-showcase';
import { TestimonialsSection } from '@/components/testimonials-section';
import { FAQSection } from '@/components/faq-section';
import { DownloadSection } from '@/components/download-section';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <AppShowcase />
      <TestimonialsSection />
      <FAQSection />
      <DownloadSection />
      <Footer />
    </main>
  );
}
