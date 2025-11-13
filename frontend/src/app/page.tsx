"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";
import { HOME_CONSTANTS } from "@/constants/HOME_CONSTANTS";
import { Sparkles, ArrowRight, Zap, Target } from "lucide-react";

export default function Homepage() {
  return (
    <div className="min-h-screen bg-off-white font-poppins">
      {/* Navigation Bar */}
      <nav className=" mx-auto px-4 sm:px-6 lg:px-28 py-6 bg-white w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/datapiper-logo.svg"
                  alt="DataPiper Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-2xl font-bold text-dark-forest">
                {HOME_CONSTANTS.navigation.brandName}
              </span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/login">
              <Button className="bg-primary-green hover:bg-dark-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-medium">
                {HOME_CONSTANTS.navigation.loginText}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12 lg:py-20 max-w-5xl mx-auto">
          {/* AI-Powered Tag */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-light-mint px-4 py-2 rounded-full border border-primary-green/20">
              <Sparkles className="w-4 h-4 text-primary-green" />
              <span className="text-sm font-medium text-primary-green">
                {HOME_CONSTANTS.hero.tag}
              </span>
            </div>
          </div>

          {/* Main Headline with Avatar Graphics */}
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight inline-flex flex-wrap items-center justify-center gap-4">
              <span>{HOME_CONSTANTS.hero.title}</span>
              <span className="text-primary-green inline-flex items-center gap-3">
                {HOME_CONSTANTS.hero.titleHighlight}
              </span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-neutral-gray mb-8 font-normal max-w-3xl mx-auto">
            {HOME_CONSTANTS.hero.subheading}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/login">
              <Button className="bg-primary-green hover:bg-dark-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-medium px-6 py-6 text-base">
                {HOME_CONSTANTS.hero.ctaPrimary}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-gray-300 hover:border-primary-green hover:text-primary-green transition-all duration-300 font-medium px-6 py-6 text-base bg-white"
            >
              {HOME_CONSTANTS.hero.ctaSecondary}
            </Button>
          </div>

          {/* Simple Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-4xl mx-auto">
            {HOME_CONSTANTS.simpleFeatures.map((feature) => {
              const Icon =
                feature.icon === "Zap"
                  ? Zap
                  : feature.icon === "Target"
                  ? Target
                  : Sparkles;
              return (
                <div key={feature.id} className="text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="w-12 h-12 bg-primary-green/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-green" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-dark-forest mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-gray">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mid-Page Headline Section */}
        <div className="text-center py-12 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-forest mb-4">
            {HOME_CONSTANTS.midSection.headline}
          </h2>
          <p className="text-lg text-neutral-gray">
            {HOME_CONSTANTS.midSection.subheadline}
          </p>
        </div>

        {/* Feature Cards Section */}
        <div className="py-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOME_CONSTANTS.features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center py-16 lg:py-24 bg-gradient-to-b from-off-white to-light-mint/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-forest mb-4">
              {HOME_CONSTANTS.bottomCta.headline}
            </h2>
            <p className="text-lg text-neutral-gray mb-8">
              {HOME_CONSTANTS.bottomCta.subheadline}
            </p>
            <Link href="/login">
              <Button className="bg-primary-green hover:bg-dark-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-medium px-8 py-6 text-base">
                {HOME_CONSTANTS.bottomCta.buttonText}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-sm text-neutral-gray">
          {HOME_CONSTANTS.footer.copyright}
        </p>
      </footer>
    </div>
  );
}
