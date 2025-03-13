"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomatedSetup } from "./automated-setup";
import { LegacySetup } from "./legacy-setup";
import { InfoIcon, BookOpenIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function LifetimeClientPage() {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Lifetime Access Setup</h1>
        <p className="text-muted-foreground">
          Set up your self-hosted instance for lifetime access
        </p>
      </div>

      {/* Quick Access Card */}
      <Card className="bg-gradient-to-br from-background to-muted/30">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Already deployed your instance?
            </p>
            <p className="text-xs text-muted-foreground">
              Visit your deployment dashboard to manage models and API keys
            </p>
          </div>
          <Link href="/dashboard/deployment" className="shrink-0">
            <Button variant="outline" className="gap-2">
              Deployment Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Setup Instructions */}
      <Tabs defaultValue="automated" className="mt-4 w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="automated">Automated Setup</TabsTrigger>
          <TabsTrigger value="legacy">Manual Setup</TabsTrigger>
        </TabsList>
        <TabsContent value="automated" className="mt-4">
          <div className="flex gap-2 p-4 mb-4 bg-muted/40 rounded-lg">
            <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Recommended:</strong> Our automated setup simplifies the
                deployment process.
              </p>
              <p className="mt-1">
                Using Docker and a convenient setup script, you'll have your
                self-hosted instance up and running in minutes.
              </p>
            </div>
          </div>

          <AutomatedSetup />
        </TabsContent>
        <TabsContent value="legacy" className="mt-4">
          <div className="flex gap-2 p-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
            <InfoIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p>
                <strong>Advanced:</strong> Manual setup gives you full control
                over your deployment.
              </p>
              <p className="mt-1">
                This approach requires more technical knowledge but allows for
                customized configurations and is suitable for experienced
                developers.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <BookOpenIcon className="h-4 w-4" />
                <a
                  href="https://docs.notecompanion.app/self-hosting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View detailed documentation
                </a>
              </div>
            </div>
          </div>

          <LegacySetup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
