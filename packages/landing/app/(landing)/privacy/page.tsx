import { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - Note Companion",
  description:
    "Privacy policy for the Note Companion app and services.",
  openGraph: {
    title: "Privacy Policy - Note Companion",
    description:
      "Privacy policy for the Note Companion app and services.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-gray-700">
      <div className="w-full max-w-4xl px-6 py-12 sm:py-12 lg:px-8 bg-transparent">
        <div className="mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Shield className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-lg">Last updated: March 19, 2025</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
            <p>
              At Note Companion, we respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our app 
              (com.notecompanion.app) and its associated services.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-2">
              <li className="mb-2">
                <strong>Account Information:</strong> When you create an account, we collect your email address and authentication information.
              </li>
              <li className="mb-2">
                <strong>User Content:</strong> Notes, files, and other content you create, upload, or store within the app.
              </li>
              <li className="mb-2">
                <strong>Usage Data:</strong> Information about how you use the app, including feature usage and performance metrics.
              </li>
              <li className="mb-2">
                <strong>Device Information:</strong> Device type, operating system, and other technical information necessary for providing our services.
              </li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li className="mb-2">Provide, maintain, and improve our services</li>
              <li className="mb-2">Sync your notes across devices</li>
              <li className="mb-2">Process and complete transactions</li>
              <li className="mb-2">Send you technical notices, updates, and support messages</li>
              <li className="mb-2">Respond to your comments and questions</li>
              <li className="mb-2">Detect, investigate, and prevent fraud and other illegal activities</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized or 
              unlawful processing, accidental loss, destruction, or damage. Your content is encrypted during transmission and at rest.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Data Sharing</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2">
              <li className="mb-2">With service providers who need access to such information to carry out work on our behalf</li>
              <li className="mb-2">When required by law or to respond to legal process</li>
              <li className="mb-2">To protect the rights, property, or safety of Note Companion, our users, or others</li>
              <li className="mb-2">In connection with a merger, sale of company assets, financing, or acquisition</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Share Extension</h2>
            <p>
              The Note Companion Share Extension (com.notecompanion.app.share-extension) allows you to save content from other 
              apps. The extension only processes data you explicitly choose to share and transfers it to the main app.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Your Choices</h2>
            <p>You can:</p>
            <ul className="list-disc pl-6 mt-2">
              <li className="mb-2">Access, correct, or delete your account information and content through the app settings</li>
              <li className="mb-2">Opt out of marketing communications by following the unsubscribe instructions in emails</li>
              <li className="mb-2">Disable certain data collection through your device settings</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13, and we do not knowingly collect personal information from children under 13. 
              If we learn that we have collected personal information from a child under 13, we will delete that information as quickly as possible.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last updated" date. 
              We encourage you to review this privacy policy frequently to stay informed about how we are protecting your information.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              If you have questions or concerns about this privacy policy or our practices, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> privacy@notecompanion.com
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
