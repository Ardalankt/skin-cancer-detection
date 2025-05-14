"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/image-uploader";
import { AnalysisResult } from "@/components/analysis-result";
import { ScanHistory } from "@/components/scan-history";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { analyzeSkin, getScanHistory } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Get the active tab from URL or default to "scan"
  const activeTab = searchParams.get("tab") || "scan";

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch scan history
  useEffect(() => {
    const fetchScanHistory = async () => {
      if (isAuthenticated && activeTab === "history") {
        try {
          setHistoryLoading(true);
          const { scans } = await getScanHistory();
          setScanHistory(scans);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load scan history",
            variant: "destructive",
          });
        } finally {
          setHistoryLoading(false);
        }
      }
    };

    fetchScanHistory();
  }, [isAuthenticated, activeTab, toast]);

  const handleImageUpload = (file: File, previewUrl: string) => {
    console.log(
      "Image uploaded:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );
    setImageFile(file);
    setUploadedImage(previewUrl);
    setScanResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAnalyzing(true);
      console.log("Analyzing image:", imageFile.name);

      // Directly use the analyzeSkin function
      const result = await analyzeSkin(imageFile);
      console.log("Analysis complete, result:", result);

      setScanResult(result.scan);

      // Show success message
      toast({
        title: "Analysis Complete",
        description: `Result: ${result.scan.result.prediction} (${result.scan.result.confidence}% confidence)`,
      });

      // Refresh scan history after a new scan
      if (activeTab === "history") {
        const { scans } = await getScanHistory();
        setScanHistory(scans);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);

      let errorMessage = "Could not analyze the image. Please try again.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });

      setScanResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setImageFile(null);
    setScanResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Shield className="h-6 w-6 text-teal-600" />
            <span>DermaScan</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm mr-2">
              {user && <span>Hello, {user.name}</span>}
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10 py-8">
        <aside className="fixed top-20 z-30 -ml-2 hidden h-[calc(100vh-5rem)] w-full shrink-0 md:sticky md:block">
          <SidebarNav />
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger
                value="scan"
                onClick={() => router.push("/dashboard?tab=scan")}
              >
                Skin Scan
              </TabsTrigger>
              <TabsTrigger
                value="history"
                onClick={() => router.push("/dashboard?tab=history")}
              >
                Scan History
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                onClick={() => router.push("/dashboard?tab=profile")}
              >
                Profile
              </TabsTrigger>
            </TabsList>
            <TabsContent value="scan" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skin Cancer Detection</CardTitle>
                  <CardDescription>
                    Upload a clear image of the skin area you're concerned about
                    for analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!uploadedImage ? (
                    <ImageUploader onImageUpload={handleImageUpload} />
                  ) : !scanResult ? (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="relative h-64 w-64 overflow-hidden rounded-lg border">
                          <Image
                            src={uploadedImage || "/placeholder.svg"}
                            alt="Uploaded skin image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex justify-center gap-4">
                        <Button onClick={handleReset} variant="outline">
                          Upload Different Image
                        </Button>
                        <Button
                          onClick={handleAnalyze}
                          className="bg-teal-600 hover:bg-teal-700"
                          disabled={analyzing}
                        >
                          {analyzing ? (
                            <>
                              <span className="animate-spin mr-2">⭘</span>
                              Analyzing...
                            </>
                          ) : (
                            "Analyze Image"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <AnalysisResult scan={scanResult} onReset={handleReset} />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Important Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-2">
                    <p>
                      <strong>Disclaimer:</strong> This tool provides a
                      preliminary assessment only and is not a substitute for
                      professional medical advice, diagnosis, or treatment.
                    </p>
                    <p>
                      Always consult with a qualified healthcare provider for
                      proper diagnosis and treatment of any medical condition.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Scan History</CardTitle>
                  <CardDescription>
                    View your previous skin scans and results.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                      <p>Loading scan history...</p>
                    </div>
                  ) : (
                    <ScanHistory initialScans={scanHistory} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Manage your account details and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Name
                          </h3>
                          <p className="mt-1">{user.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Email
                          </h3>
                          <p className="mt-1">{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Account Created
                          </h3>
                          <p className="mt-1">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button variant="outline">Edit Profile</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} DermaScan. All rights reserved.
          </p>
          <p className="text-center text-xs text-gray-500">
            <strong>Disclaimer:</strong> This tool provides preliminary
            assessments only and is not a substitute for professional medical
            advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
