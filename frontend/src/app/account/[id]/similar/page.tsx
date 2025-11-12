"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface SimilarCustomer {
  id: number;
  name: string;
  industry: string;
  arr: number;
  similarity_score: number;
  shared_traits: string[];
}

interface SimilarCustomersData {
  industry: string;
  insight: string;
  similar_customers: SimilarCustomer[];
}

interface AccountDetails {
  id: number;
  name: string;
  industry: string;
}

export default function SimilarCustomersPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id;
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [similarData, setSimilarData] = useState<SimilarCustomersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current account details
    fetch("/mockdata/accountDetails.json")
      .then((res) => res.json())
      .then((accounts: AccountDetails[]) => {
        const foundAccount = accounts.find((acc) => acc.id === Number(accountId));
        if (foundAccount) {
          setAccount(foundAccount);
          // Fetch similar customers based on industry
          return fetch("/mockdata/similarCustomers.json");
        }
        throw new Error("Account not found");
      })
      .then((res) => res?.json())
      .then((data) => {
        if (account?.industry && data[account.industry]) {
          setSimilarData(data[account.industry]);
        } else {
          // Fallback to first dataset if industry not found
          const firstIndustry = Object.keys(data)[0];
          setSimilarData(data[firstIndustry]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading similar customers:", error);
        setLoading(false);
      });
  }, [accountId, account?.industry]);

  const formatArr = (arr: number): string => {
    const thousands = Math.round(arr / 1000);
    return `$${thousands}k / yr`;
  };

  const getScorePercent = (score: number): number => {
    return Math.round(score * 100);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-green"></div>
            <p className="mt-4 text-neutral-gray">Loading similar customers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!account || !similarData) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="mb-6 border-primary-green text-primary-green hover:bg-light-mint cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-dark-forest mb-4">
                Data Not Available
              </h2>
              <p className="text-neutral-gray">
                Unable to load similar customer data.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <Button
          onClick={() => router.push(`/account/${accountId}`)}
          variant="ghost"
          className="mb-4 text-primary-green hover:text-dark-forest hover:bg-light-mint p-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customer Profile
        </Button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dark-forest mb-2">
            Similar Customers in {similarData.industry}
          </h1>
          <p className="text-neutral-gray text-lg">
            Accounts with similar engagement and product usage patterns.
          </p>
        </div>

        {/* AI Insights Widget */}
        <Card
          className="mb-8 rounded-2xl border-0 shadow-md"
          style={{
            background: "linear-gradient(90deg, #25834b 0%, #C7EBD1 100%)",
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-white flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">
                  Top Insight
                </h3>
                <p className="text-white/90 leading-relaxed">
                  {similarData.insight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Similar Customers Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {similarData.similar_customers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:scale-[1.01] transition-all duration-300 h-full flex flex-col cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-dark-forest">
                    {customer.name}
                  </CardTitle>
                  <p className="text-sm text-neutral-gray mt-1">
                    {customer.industry}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* ARR */}
                  <div className="mb-4">
                    <p className="text-sm text-neutral-gray mb-1">
                      Annual Recurring Revenue
                    </p>
                    <p className="text-lg font-semibold text-dark-forest">
                      {formatArr(customer.arr)}
                    </p>
                  </div>

                  {/* Similarity Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-neutral-gray">
                        Similarity Score
                      </p>
                      <p className="text-lg font-bold text-primary-green">
                        {getScorePercent(customer.similarity_score)}%
                      </p>
                    </div>
                    <Progress
                      value={getScorePercent(customer.similarity_score)}
                      className="h-2"
                    />
                  </div>

                  {/* Shared Traits */}
                  <div className="mb-4 flex-1">
                    <p className="text-sm text-neutral-gray mb-2">
                      Shared Traits
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {customer.shared_traits.map((trait, idx) => (
                        <Badge
                          key={idx}
                          className="bg-light-mint text-dark-forest border-0 rounded-md px-2 py-1 text-xs font-medium"
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => router.push(`/account/${customer.id}`)}
                    className="w-full bg-[#25834b] hover:bg-[#004F38] text-white mt-auto cursor-pointer"
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {similarData.similar_customers.length === 0 && (
          <Card className="bg-white rounded-2xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-neutral-gray mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-dark-forest mb-2">
                No Similar Customers Found
              </h3>
              <p className="text-neutral-gray">
                We couldn&apos;t find any customers with similar characteristics at
                this time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
