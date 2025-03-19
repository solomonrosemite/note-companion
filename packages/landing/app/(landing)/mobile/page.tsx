import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Check } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";

export const metadata: Metadata = {
  title: "Note Companion Mobile - Your AI-powered Knowledge Partner on the Go",
  description:
    "Access your notes anywhere with the Note Companion mobile app. Seamlessly capture ideas, manage your knowledge, and stay organized across all your devices.",
  openGraph: {
    title: "Note Companion Mobile - Your AI-powered Knowledge Partner on the Go",
    description:
      "Access your notes anywhere with the Note Companion mobile app. Seamlessly capture ideas, manage your knowledge, and stay organized across all your devices.",
  },
};

export default function MobilePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-gray-700">
      {/* Hero Section */}
      <div className="w-full max-w-5xl px-6 py-12 sm:py-12 lg:px-8 text-center bg-transparent">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <Smartphone className="mx-auto h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            <span>Note Companion</span>
            <span className="text-primary block">Mobile</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-[1px] w-8 bg-muted-foreground/20"></div>
            <span className="text-xl text-muted-foreground/80 relative">
              your knowledge on the go
              <svg className="absolute -bottom-[4px] left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path 
                  d="M0,7 Q100,-1 200,7" 
                  stroke="blue" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  fill="none"
                  className="opacity-50"
                />
              </svg>
            </span>
            <div className="h-[1px] w-8 bg-muted-foreground/20"></div>
          </div>
          <p className="mt-6 text-lg leading-8">
            The Note Companion mobile app brings the power of your knowledge vault to your iOS devices. Capture ideas, access your notes, and stay organized wherever you go.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="https://apps.apple.com/app/note-companion/id0000000000">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
                Download on App Store
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* App Features */}
      <div className="w-full py-24 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12 text-center">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <h3 className="text-xl font-semibold mb-3">Seamless Sync</h3>
              <p className="text-muted-foreground mb-4">
                All your notes stay in sync across devices. Create or edit on mobile, and see changes reflected instantly on desktop.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <h3 className="text-xl font-semibold mb-3">Mobile Capture</h3>
              <p className="text-muted-foreground mb-4">
                Quickly capture ideas, photos, and audio notes on the go. Our share extension makes it easy to save content from any app.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <h3 className="text-xl font-semibold mb-3">AI Organization</h3>
              <p className="text-muted-foreground mb-4">
                The same powerful AI organization features you love on desktop, now available on your mobile device.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* App Screenshot */}
      <div className="w-full max-w-4xl px-6 py-24 bg-transparent">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your Knowledge, Anywhere
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            A beautiful, intuitive interface designed for mobile
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative w-64 h-[500px] bg-gray-100 rounded-3xl overflow-hidden border-8 border-gray-800 shadow-xl">
            {/* This is a placeholder for your actual mobile app screenshot */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/10 to-primary/30">
              <p className="text-primary font-medium">App Screenshot</p>
            </div>
          </div>
        </div>
      </div>

      {/* Get Started Section */}
      <div className="w-full py-24 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Get Started Today
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Download the Note Companion mobile app from the App Store and take your knowledge ecosystem with you wherever you go.
          </p>
          <a href="https://apps.apple.com/app/note-companion/id0000000000">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
              Download Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <p className="mt-6 text-sm text-muted-foreground">
            Requires iOS 15 or later. <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
