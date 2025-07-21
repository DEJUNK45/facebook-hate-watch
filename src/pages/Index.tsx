import { useState, useEffect } from 'react';
import { ApifyService } from '@/services/apifyService';
import { ApiKeyForm } from '@/components/ApiKeyForm';
import { AnalysisForm } from '@/components/AnalysisForm';
import { StatisticsCards } from '@/components/StatisticsCards';
import { AnalysisChart } from '@/components/AnalysisChart';
import { CommentsList } from '@/components/CommentsList';
import { PostInfo } from '@/components/PostInfo';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';

const Index = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const apiKey = ApifyService.getApiKey();
    setHasApiKey(!!apiKey);
  }, []);

  const handleApiKeySet = () => {
    setHasApiKey(true);
    setShowSettings(false);
  };

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
  };

  const handleReset = () => {
    setAnalysisData(null);
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  if (!hasApiKey || showSettings) {
    return <ApiKeyForm onApiKeySet={handleApiKeySet} />;
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Facebook Hate Watch
              </h1>
              <p className="text-sm text-muted-foreground">
                Analisis ujaran kebencian pada komentar Facebook
              </p>
            </div>
            <div className="flex items-center gap-2">
              {analysisData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowSettings}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!analysisData ? (
          <div className="max-w-2xl mx-auto">
            <AnalysisForm onAnalysisComplete={handleAnalysisComplete} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Post Information */}
            <PostInfo postData={analysisData.postData} />
            
            {/* Statistics Cards */}
            <StatisticsCards statistics={analysisData.statistics} />
            
            {/* Charts */}
            <AnalysisChart statistics={analysisData.statistics} />
            
            {/* Comments List */}
            <CommentsList analysisResults={analysisData.analysisResults} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
