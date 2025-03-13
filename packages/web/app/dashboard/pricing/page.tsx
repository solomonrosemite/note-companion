"use client";

import { PricingCards } from "@/components/pricing-cards";
import { Star } from "lucide-react";

export default function PlanSelectionPage() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-800 to-violet-500">
          One tool to stay organized
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-700 max-w-2xl mx-auto">
          Organize anything from meetings to handwritten notes with our powerful AI companion.
        </p>
      </div>
      
      {/* Key Features Section */}
      <div className="mb-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center">
            <span className="bg-amber-100 text-amber-600 p-2 rounded-lg mr-3">
              <Star className="h-6 w-6" />
            </span>
            Key Features
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">Powerful tools designed to enhance your note-taking and organization workflow</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { 
              name: "Smart Organization", 
              icon: "✨", 
              description: "AI-powered sorting and categorization of your notes and files" 
            },
            { 
              name: "Voice to Text", 
              icon: "🔊", 
              description: "Convert audio recordings into searchable, editable text" 
            },
            { 
              name: "Seamless Sync", 
              icon: "☁️", 
              description: "Access your notes from any device with real-time synchronization" 
            },
            { 
              name: "Privacy First", 
              icon: "🔒", 
              description: "End-to-end encryption keeps your data private and secure" 
            }
          ].map((feature, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-violet-200 text-center group relative overflow-hidden"
            >
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-violet-50 rounded-full opacity-70 group-hover:bg-violet-100 transition-colors"></div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center mx-auto mb-5 group-hover:from-violet-200 group-hover:to-violet-100 transition-colors z-10 relative">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">{feature.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <PricingCards />
      
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          All plans include our core features. Have questions? <a href="#" className="text-violet-600 hover:underline">Contact us</a>
        </p>
      </div>
    </section>
  );
}
