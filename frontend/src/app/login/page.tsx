"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

interface LoadingStep {
  id: string;
  name: string;
  logo: string;
  status: "pending" | "loading" | "completed";
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const integrations = [
    {
      id: "salesforce",
      name: "Salesforce",
      logo: "/integration-logos/salesforce.svg",
    },
    {
      id: "slack",
      name: "Slack",
      logo: "/integration-logos/slack.svg",
    },
    {
      id: "gong",
      name: "Gong",
      logo: "/integration-logos/gong.svg",
    },
    {
      id: "gainsight",
      name: "Gainsight",
      logo: "/integration-logos/gainsight.svg",
    },
  ];

  // Compute step statuses based on currentStep
  const steps: LoadingStep[] = integrations.map((integration, index) => ({
    ...integration,
    status:
      index < currentStep
        ? "completed"
        : index === currentStep
        ? "loading"
        : "pending",
  }));

  useEffect(() => {
    if (!loading) return;

    if (currentStep < integrations.length) {
      // After 1500ms, move to next step
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // All steps completed, redirect after a brief pause
      const finalTimer = setTimeout(() => {
        router.push("/dashboard");
      }, 1000);

      return () => clearTimeout(finalTimer);
    }
  }, [loading, currentStep, integrations.length, router]);

  const handleSSOLogin = () => {
    setLoading(true);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-mint to-off-white font-poppins flex items-center justify-center p-4">
      {/* Logo in top-left */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <Image
              src="/datapiper-logo.svg"
              alt="DataPiper Logo"
              width={40}
              height={40}
            />
          </div>
          <span className="text-2xl font-bold text-dark-forest">
            DataPiper
          </span>
        </Link>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-3xl font-bold text-dark-forest mb-2">
            Welcome to DataPiper
          </CardTitle>
          <p className="text-neutral-gray text-lg">
            Sign in with SurveyMonkey to access your customer intelligence
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* SSO Login Section */}
          <div className="mb-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className="text-center mb-4">
                  <p className="text-lg font-semibold text-dark-forest mb-2">
                    Setting up your workspace
                  </p>
                  <p className="text-sm text-neutral-gray">
                    Connecting to your data sources...
                  </p>
                </div>

                {/* Integration Steps */}
                <div className="w-full space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-300 ${
                        step.status === "loading"
                          ? "border-primary-green bg-light-mint"
                          : step.status === "completed"
                          ? "border-primary-green bg-white"
                          : "border-gray-200 bg-white opacity-50"
                      }`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200">
                        <Image
                          src={step.logo}
                          alt={`${step.name} logo`}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-dark-forest">
                          {step.status === "loading"
                            ? `Connecting to ${step.name}...`
                            : step.status === "completed"
                            ? `Connected to ${step.name}`
                            : `${step.name}`}
                        </p>
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center">
                        {step.status === "loading" && (
                          <Loader2 className="w-5 h-5 text-primary-green animate-spin" />
                        )}
                        {step.status === "completed" && (
                          <CheckCircle2 className="w-5 h-5 text-primary-green" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {currentStep >= steps.length && (
                  <div className="text-center animate-fade-in-up">
                    <CheckCircle2 className="w-12 h-12 text-primary-green mx-auto mb-2" />
                    <p className="text-lg font-semibold text-dark-forest">
                      All set! Redirecting...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={handleSSOLogin}
                disabled={loading}
                className="w-full h-14 text-lg font-medium transition-all duration-300 bg-primary-green hover:bg-dark-forest text-white"
              >
                Continue with SurveyMonkey
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
