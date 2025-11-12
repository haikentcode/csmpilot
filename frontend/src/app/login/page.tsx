"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";

interface Connection {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [ssoConnected, setSsoConnected] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([
    { id: "salesforce", name: "Salesforce", icon: "☁️", connected: false },
    { id: "gainsight", name: "Gainsight", icon: "📊", connected: false },
    { id: "gong", name: "Gong", icon: "🎯", connected: false },
  ]);

  const handleSSOLogin = () => {
    setSsoConnected(true);
  };

  const handleConnect = (id: string) => {
    setConnections(
      connections.map((conn) =>
        conn.id === id ? { ...conn, connected: true } : conn
      )
    );
  };

  const allConnected = connections.every((conn) => conn.connected);
  const canProceed = ssoConnected && allConnected;

  const handleGoToDashboard = () => {
    if (canProceed) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-mint to-off-white font-poppins flex items-center justify-center p-4">
      {/* Logo in top-left */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-green rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-dark-forest">CSMPilot</span>
        </Link>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-3xl font-bold text-dark-forest mb-2">
            Connect Your Workspace
          </CardTitle>
          <p className="text-neutral-gray text-lg">
            Link your tools to unlock AI-powered customer insights
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* SSO Login Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-neutral-gray mb-3 uppercase tracking-wide">
              Step 1: Authenticate
            </h3>
            <Button
              onClick={handleSSOLogin}
              disabled={ssoConnected}
              className={`w-full h-14 text-lg font-medium transition-all duration-300 ${
                ssoConnected
                  ? "bg-light-mint text-dark-forest border-2 border-primary-green hover:bg-light-mint"
                  : "bg-primary-green hover:bg-dark-forest text-white"
              }`}
            >
              {ssoConnected ? (
                <span className="flex items-center justify-center">
                  <Check className="w-5 h-5 mr-2" />
                  Connected to SurveyMonkey
                </span>
              ) : (
                "Continue with SurveyMonkey"
              )}
            </Button>
          </div>

          {/* Data Connections Section */}
          {ssoConnected && (
            <div className="animate-fade-in-up">
              <h3 className="text-sm font-semibold text-neutral-gray mb-4 uppercase tracking-wide">
                Step 2: Connect Data Sources
              </h3>
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
                      connection.connected
                        ? "bg-light-mint border-primary-green"
                        : "bg-off-white border-gray-200 hover:border-primary-green/30 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{connection.icon}</div>
                      <div>
                        <p className="font-semibold text-dark-forest">
                          {connection.name}
                        </p>
                        <p className="text-sm text-neutral-gray">
                          {connection.connected
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>

                    {connection.connected ? (
                      <div className="flex items-center justify-center w-10 h-10 bg-primary-green rounded-full">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleConnect(connection.id)}
                        size="sm"
                        className="bg-primary-green hover:bg-dark-forest text-white font-medium"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Go to Dashboard Button */}
          {ssoConnected && (
            <div className="mt-8 animate-fade-in-up">
              <Button
                onClick={handleGoToDashboard}
                disabled={!canProceed}
                className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                  canProceed
                    ? "bg-primary-green hover:bg-dark-forest text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {canProceed
                  ? "Go to Dashboard →"
                  : `Connect ${connections.filter((c) => !c.connected).length} more source${connections.filter((c) => !c.connected).length !== 1 ? "s" : ""}`}
              </Button>

              {!canProceed && (
                <p className="text-center text-sm text-neutral-gray mt-3">
                  Connect all data sources to continue
                </p>
              )}
            </div>
          )}

          {/* Skip Option */}
          {ssoConnected && (
            <div className="text-center mt-6">
              <Link
                href="/dashboard"
                className="text-sm text-neutral-gray hover:text-primary-green transition-colors duration-200"
              >
                Skip for now and explore demo
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

