"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineLoader, LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;

    const finalTimer = setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    return () => clearTimeout(finalTimer);
  }, [loading, router]);

  const handleSSOLogin = () => {
    setLoading(true);
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
          <span className="text-2xl font-bold text-dark-forest">DataPiper</span>
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
                {/* Round Loader */}
                <InlineLoader />
                <div className="text-center mb-4">
                  <p className="text-lg font-semibold text-dark-forest mb-2">
                    Setting up your workspace
                  </p>
                  <p className="text-sm text-neutral-gray">
                    Connecting to your data sources...
                  </p>
                </div>
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
