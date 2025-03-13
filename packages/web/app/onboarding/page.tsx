"use client";

import { FileText, Zap, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/pricing-cards";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Smart File Organization",
    description: "AI-powered sorting and categorization",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Chat with your files",
    description: "Ask questions about your files and get instant answers",
  },
  {
    icon: <Check className="h-6 w-6" />,
    title: "Image digitization & Audio Transcription",
    description:
      "Convert your hand-written notes and audio notes to text by simply dropping them into your Obsidian vault",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  // Function to handle subscription completion
  const handleSubscriptionComplete = (type: 'lifetime' | 'cloud') => {
    if (type === 'lifetime') {
      router.push('/dashboard/lifetime');
    } else {
      router.push('/dashboard/api-key');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <section className="mb-12">
              <h1 className="text-4xl font-bold mb-4">
                Welcome to Note Companion
              </h1>
              <p className="text-xl mb-8">
                Powerful AI features to organize and enhance your Obsidian
                experience.
              </p>
              <div className="aspect-video mb-8">
                <iframe
                  className="w-full h-full rounded-lg shadow-lg"
                  src="https://youtube.com/embed/videoseries?list=PLgRcC-DFR5jcwwg0Dr3gNZrkZxkztraKE&controls=1&rel=0&modestbranding=1"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              {/* Features section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Key Features</h2>
                <div className="grid gap-4">
                  {FEATURES.map((feature, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start">
                        <div className="shrink-0 mr-4 rounded-full p-2 bg-violet-100">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Pricing with Benefits Reminder */}
          <div>
            {/* Benefits Reminder Section */}
            <div className="mb-8">
              <div className="bg-white p-5 rounded-lg border border-violet-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-violet-700">Why Choose Note Companion?</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>AI-powered organization that saves hours of manual sorting</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Seamless integration with Obsidian that enhances your workflow</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Convert handwritten notes and audio recordings to searchable text</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Mobile app for capturing and organizing on the go</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Chat with your documents using natural language</span>
                  </li>
                </ul>
              </div>
            </div>
            <PricingCards onSubscriptionComplete={handleSubscriptionComplete} />
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <a href="https://discord.gg/udQnCRFyus" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Join our discord</Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Different AI Inc. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
