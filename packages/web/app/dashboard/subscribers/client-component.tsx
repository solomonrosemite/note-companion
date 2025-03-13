"use client";

import { LicenseForm } from "@/app/components/license-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SVGProps } from "react";

// Custom icon components
const PlayCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);

const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CheckCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export function SubscribersDashboardClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="absolute left-full transform -translate-y-3/4 -translate-x-1/4 sm:-translate-x-1/2 opacity-20"
            width="800"
            height="800"
            fill="none"
            viewBox="0 0 800 800"
          >
            <defs>
              <pattern
                id="pattern1"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="800" height="800" fill="url(#pattern1)" />
          </svg>
          <svg
            className="absolute right-full bottom-0 transform translate-x-1/4 translate-y-1/4 sm:translate-x-1/2 opacity-20"
            width="800"
            height="800"
            fill="none"
            viewBox="0 0 800 800"
          >
            <defs>
              <pattern
                id="pattern2"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="800" height="800" fill="url(#pattern2)" />
          </svg>
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 px-4 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">Dashboard</Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to Note Companion
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Organize and manage your notes with powerful tools designed for productivity and seamless integration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="container mx-auto px-4 pb-20 -mt-6">
        <motion.div 
          className="grid md:grid-cols-2 gap-8 lg:gap-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Tutorial Card */}
          <Card className="overflow-hidden border-0 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">How to Use Note Companion</CardTitle>
              <CardDescription className="text-slate-600">Watch our comprehensive tutorial video</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="aspect-video mb-6 rounded-lg overflow-hidden shadow-md group relative">
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <PlayCircleIcon className="w-16 h-16 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                </div>
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/XZTpbECqZps?controls=1&modestbranding=1&showinfo=0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                  <p className="text-slate-700">Learn how to organize your notes efficiently</p>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                  <p className="text-slate-700">Discover powerful automation features</p>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                  <p className="text-slate-700">Set up custom workflows for productivity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Card */}
          <Card className="overflow-hidden border-0 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Activate Your License</CardTitle>
              <CardDescription className="text-slate-600">Enter your license key to unlock all features</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-8">
                <LicenseForm />
              </div>

              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-slate-500">Get Started</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <DownloadIcon className="h-6 w-6 text-indigo-600 mr-2" />
                  <p className="text-xl font-semibold text-slate-800">
                    Download the Plugin
                  </p>
                </div>
                
                <a href="obsidian://show-plugin?id=fileorganizer2000" className="block">
                  <Button 
                    className="w-full py-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                    variant="default"
                  >
                    Install in Obsidian
                  </Button>
                </a>
                <p className="mt-3 text-sm text-slate-500">Requires Obsidian app. Available for all platforms.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Additional Resources Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Need Help?</h2>
          <p className="text-slate-600 mb-6">Visit our documentation or join our community for support</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="default" className="min-w-[160px] bg-blue-600 hover:bg-blue-700">Documentation</Button>
            <Button variant="default" className="min-w-[160px] bg-indigo-600 hover:bg-indigo-700">Community Forum</Button>
            <Button variant="default" className="min-w-[160px] bg-purple-600 hover:bg-purple-700">Support</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
