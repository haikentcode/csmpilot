"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Users, Sparkles } from "lucide-react";

export default function Homepage() {
  return (
    <div className="min-h-screen bg-off-white font-poppins">
      {/* Navigation Bar */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-green rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-dark-forest">CSMPilot</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-gray-300 hover:border-primary-green hover:text-primary-green transition-all duration-300 font-medium"
              >
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-primary-green hover:bg-dark-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-medium">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16 lg:py-24 max-w-5xl mx-auto">
          {/* Logo and Tagline */}
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark-forest mb-4 leading-tight">
              Your Customer Intelligence{" "}
              <span className="text-primary-green">Copilot.</span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-neutral-gray mb-10 font-normal max-w-3xl mx-auto">
            Turn every customer interaction into actionable insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-gray-300 hover:border-primary-green hover:text-primary-green transition-all duration-300 font-medium text-lg px-8 py-6"
              >
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary-green hover:bg-dark-forest text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-lg px-8 py-6"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Three-Column Feature Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* AI-Generated Customer Stories */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-green/30 group text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-primary-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-dark-forest mb-4">
                AI-Generated Customer Stories
              </h3>
              <p className="text-neutral-gray leading-relaxed">
                Automatically generate comprehensive customer narratives from
                interaction history, surveys, and support tickets. Get the full
                picture instantly.
              </p>
            </div>

            {/* Smart Meeting Preparation */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-green/30 group text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-primary-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-dark-forest mb-4">
                Smart Meeting Preparation
              </h3>
              <p className="text-neutral-gray leading-relaxed">
                Walk into every customer meeting prepared with AI-powered
                briefs, talk tracks, and personalized recommendations tailored
                to each account.
              </p>
            </div>

            {/* Similar Customer Insights */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-green/30 group text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-primary-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-dark-forest mb-4">
                Similar Customer Insights
              </h3>
              <p className="text-neutral-gray leading-relaxed">
                Discover patterns across your customer base. Learn from
                successful accounts and apply proven strategies to similar
                customers.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 mt-20">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <Link
            href="#"
            className="text-neutral-gray hover:text-primary-green transition-colors duration-200 font-medium"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-neutral-gray hover:text-primary-green transition-colors duration-200 font-medium"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="text-neutral-gray hover:text-primary-green transition-colors duration-200 font-medium"
          >
            Contact
          </Link>
        </div>
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-gray">
            © 2025 CSMPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
