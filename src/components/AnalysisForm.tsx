import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ApifyService } from '@/services/apifyService';
import { Link, Loader2, Search } from 'lucide-react';

interface AnalysisFormProps {
  onAnalysisComplete: (data: any) => void;
}

export const AnalysisForm = ({ onAnalysisComplete }: AnalysisFormProps) => {
  const [url, setUrl] = useState('');
  const [resultsLimit, setResultsLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Silakan masukkan URL postingan Facebook",
        variant: "destructive",
      });
      return;
    }

    if (!url.includes('facebook.com')) {
      toast({
        title: "Error",
        description: "URL harus berupa link postingan Facebook",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApifyService.scrapePost(url, resultsLimit);
      
      if (!response.success) {
        throw new Error(response.error || 'Gagal mengambil data');
      }

      const analysisResults = ApifyService.analyzeComments(response.data!.comments);
      const statistics = ApifyService.getStatistics(analysisResults);

      onAnalysisComplete({
        postData: response.data!.postData,
        analysisResults,
        statistics
      });

      toast({
        title: "Analisis Selesai",
        description: `Berhasil menganalisis ${response.data!.comments.length} komentar`,
      });
    } catch (error) {
      console.error('Error analyzing post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Gagal menganalisis postingan',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Search className="h-5 w-5 text-primary" />
          Analisis Ujaran Kebencian
        </CardTitle>
        <CardDescription>
          Masukkan URL postingan Facebook untuk menganalisis komentar dan mendeteksi ujaran kebencian
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL Postingan Facebook
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.facebook.com/..."
              className="transition-all duration-200 focus:shadow-glow"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resultsLimit" className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Jumlah Komentar Maksimal
            </Label>
            <Input
              id="resultsLimit"
              type="number"
              value={resultsLimit}
              onChange={(e) => setResultsLimit(Math.max(1, parseInt(e.target.value) || 10))}
              placeholder="10"
              min="1"
              max="500"
              className="transition-all duration-200 focus:shadow-glow"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menganalisis...
              </>
            ) : (
              "Mulai Analisis"
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p><strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Pastikan postingan bersifat publik</li>
            <li>URL harus lengkap dengan protocol (https://)</li>
            <li>Analisis akan mencakup semua komentar yang tersedia</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};