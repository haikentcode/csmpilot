"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";
import { HOME_CONSTANTS } from "@/constants/HOME_CONSTANTS";

export default function Homepage() {
  return (
    <div className="min-h-screen bg-off-white font-poppins">
      {/* Navigation Bar */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-gray-300 hover:border-primary-green hover:text-primary-green transition-all duration-300 font-medium"
              >
                {HOME_CONSTANTS.navigation.loginText}
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-primary-green hover:bg-dark-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-medium">
                {HOME_CONSTANTS.navigation.getStartedText}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16 lg:py-24 max-w-5xl mx-auto">
          {/* Logo and Tagline */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark-forest mb-4 leading-tight">
              {HOME_CONSTANTS.hero.title}{" "}
              <span className="text-primary-green">
                {HOME_CONSTANTS.hero.titleHighlight}
              </span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-neutral-gray mb-10 font-normal max-w-4xl mx-auto">
            {HOME_CONSTANTS.hero.subheading}
          </p>

          {/* Three-Column Feature Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {HOME_CONSTANTS.features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
