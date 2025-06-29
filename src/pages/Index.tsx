
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Chrome, Instagram, Zap, Shield, Settings } from "lucide-react";

const Index = () => {
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = () => {
    // Create a zip file with all extension files
    const files = [
      'manifest.json',
      'background.js', 
      'content.js',
      'popup.html',
      'popup.js'
    ];
    
    setIsDownloaded(true);
    
    // In a real scenario, you'd package these files
    console.log('Extension files ready for download');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <Instagram className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Instagram Hello Automator
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Automatically send your personalized description when you message "Hello" to new connections on Instagram
          </p>
          <Badge variant="secondary" className="mb-8">
            Chrome Extension • Personal Use • Free
          </Badge>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Smart Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Automatically detects when you send exactly "Hello" and triggers your personalized follow-up message
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Customizable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Set your own personal description, adjust timing delays, and enable/disable the automation as needed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Privacy First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                All data stays local in your browser. No external servers, no data collection, complete privacy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Install Extension</h3>
                <p className="text-sm text-white/80">Download and install the Chrome extension</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Set Description</h3>
                <p className="text-sm text-white/80">Configure your personal intro message</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Send "Hello"</h3>
                <p className="text-sm text-white/80">Message "Hello" to anyone on Instagram DM</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  4
                </div>
                <h3 className="font-semibold mb-2">Auto Follow-up</h3>
                <p className="text-sm text-white/80">Your description is sent automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Section */}
        <div className="text-center">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-md mx-auto">
            <CardContent className="pt-6">
              <Chrome className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-semibold mb-4">Ready to Get Started?</h3>
              <p className="text-white/80 mb-6">
                Download the extension files and install them in Chrome's developer mode
              </p>
              <Button 
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
                disabled={isDownloaded}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloaded ? 'Extension Ready!' : 'Download Extension'}
              </Button>
              {isDownloaded && (
                <div className="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-sm text-green-200">
                    Extension files are ready! Load them in Chrome's Extensions page with Developer mode enabled.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Installation Instructions */}
        <div className="mt-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-xl">Installation Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                  <span>Download the extension files above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                  <span>Open Chrome and go to chrome://extensions/</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</span>
                  <span>Enable "Developer mode" in the top right</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">4</span>
                  <span>Click "Load unpacked" and select the extension folder</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">5</span>
                  <span>Visit Instagram and configure your settings via the extension popup</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
