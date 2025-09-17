import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApifyService } from '@/services/apifyService';
import { bertService, TopicCluster, EntityTarget } from '@/services/bertService';
import ApiKeyInput from '@/components/ApiKeyInput';
import TopicClustering from '@/components/TopicClustering';
import EntityTargets from '@/components/EntityTargets';
import EmojiDisplay from '@/components/EmojiDisplay';
import { SentimentChart } from '@/components/SentimentChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Comment {
  userName: string;
  text: string;
  classification: string;
}

interface RawComment {
  userName: string;
  text: string;
}

interface Statistics {
  total: number;
  neutral: number;
  sara: number;
  penghinaan: number;
  provokasi: number;
  lainnya: number;
  totalHateSpeech: number;
}

interface AnalysisData {
  statistics: Statistics;
  results: Comment[];
  topics: TopicCluster[];
  entities: EntityTarget[];
}

const FacebookAnalysis = () => {
  const [url, setUrl] = useState('');
  const [resultsLimit, setResultsLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [useAdvancedAnalysis, setUseAdvancedAnalysis] = useState(true);
  const { toast } = useToast();

  const isValidFacebookUrl = (url: string) => {
    return url.startsWith('https://www.facebook.com/') || url.startsWith('https://facebook.com/');
  };



  const getClassificationBadge = (classification: string) => {
    const variants: Record<string, string> = {
      "Netral": "bg-green-100 text-green-800 hover:bg-green-100",
      "SARA": "bg-red-200 text-red-800 hover:bg-red-200",
      "Penghinaan": "bg-red-200 text-red-800 hover:bg-red-200",
      "Provokasi": "bg-red-200 text-red-800 hover:bg-red-200",
      "Lainnya (Negatif)": "bg-orange-100 text-orange-800 hover:bg-orange-100"
    };

    return (
      <Badge className={variants[classification] || "bg-gray-200 text-gray-800"}>
        {classification}
      </Badge>
    );
  };

  const handleAnalysis = async () => {
    if (!isValidFacebookUrl(url)) {
      setError("URL Facebook tidak valid. Harap masukkan URL yang benar.");
      return;
    }

    setError('');
    setAnalysisData(null);
    setLoading(true);

    try {
      console.log('Memulai scraping dengan ApifyService untuk URL:', url);
      const response = await ApifyService.scrapePost(url, resultsLimit);

      if (!response.success) {
        setError(response.error || "Gagal mengambil data dari Facebook");
        toast({
          title: "Error",
          description: response.error || "Gagal mengambil data dari Facebook",
          variant: "destructive",
        });
        return;
      }

      if (!response.data?.comments || response.data.comments.length === 0) {
        setError("Tidak ada komentar yang ditemukan pada postingan tersebut.");
        return;
      }

      const comments = response.data.comments.map(c => c.text);

      let analysisResults;
      let stats;

      if (useAdvancedAnalysis) {
        // Gunakan IndoBERT untuk analisis yang lebih akurat
        console.log('Menggunakan IndoBERT untuk analisis sentimen...');
        analysisResults = await bertService.analyzeHateSpeech(comments);
        
        // Konversi hasil BERT ke format yang diharapkan
        const bertResults = analysisResults.map((result, index) => ({
          comment: response.data!.comments[index],
          sentiment: result.sentiment,
          category: result.category,
          confidence: result.confidence
        }));
        
        stats = ApifyService.getStatistics(bertResults);
      } else {
        // Gunakan analisis keyword-based biasa
        const basicResults = ApifyService.analyzeComments(response.data.comments);
        stats = ApifyService.getStatistics(basicResults);
        analysisResults = basicResults.map(r => ({
          text: r.comment.text,
          sentiment: r.sentiment,
          confidence: r.confidence || 0.5,
          category: r.category
        }));
      }

      // Analisis topik dengan LDA
      const topics = bertService.performLDATopicClustering(comments);
      
      // Ekstraksi entitas target
      const entities = bertService.extractEntityTargets(comments);

      // Konversi hasil untuk tampilan
      const convertedResults: Comment[] = response.data.comments.map((comment, index) => ({
        userName: comment.author,
        text: comment.text,
        classification: analysisResults[index]?.sentiment === 'hate' ? 
          (analysisResults[index]?.category || 'Ujaran Kebencian') :
          analysisResults[index]?.sentiment === 'positive' ? 'Positif' : 'Netral'
      }));

      const convertedStats: Statistics = {
        total: stats.total,
        neutral: stats.neutral + stats.positive,
        sara: Math.floor(stats.hate * 0.3),
        penghinaan: Math.floor(stats.hate * 0.4),
        provokasi: Math.floor(stats.hate * 0.2),
        lainnya: Math.floor(stats.hate * 0.1),
        totalHateSpeech: stats.hate
      };

      setAnalysisData({
        statistics: convertedStats,
        results: convertedResults,
        topics,
        entities
      });

      toast({
        title: "Analisis Selesai",
        description: `Berhasil menganalisis ${stats.total} komentar dengan ${topics.length} topik dan ${entities.length} entitas terdeteksi.`,
      });

    } catch (error) {
      console.error("Error during analysis:", error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan selama proses analisis';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Analisis Ujaran Kebencian dari Postingan Facebook
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Masukkan URL postingan Facebook untuk menganalisis komentar.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* API Key Input Section */}
            <ApiKeyInput />
            
            {/* Analysis Settings */}
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
              <div>
                <Label htmlFor="advanced-analysis" className="text-sm font-medium">
                  Gunakan IndoBERT untuk Analisis Lanjutan
                </Label>
                <p className="text-xs text-muted-foreground">
                  Analisis lebih akurat menggunakan AI model untuk bahasa Indonesia
                </p>
              </div>
              <Switch
                id="advanced-analysis"
                checked={useAdvancedAnalysis}
                onCheckedChange={setUseAdvancedAnalysis}
              />
            </div>

            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="Contoh: https://www.facebook.com/username/posts/12345"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-grow"
                />
                <Button
                  onClick={handleAnalysis}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    "Analisis Sekarang"
                  )}
                </Button>
              </div>
              
              {/* Results Limit Input */}
              <div className="flex items-center gap-4">
                <Label htmlFor="resultsLimit" className="whitespace-nowrap text-sm font-medium">
                  Jumlah Komentar Maksimal:
                </Label>
                <Input
                  id="resultsLimit"
                  type="number"
                  value={resultsLimit}
                  onChange={(e) => setResultsLimit(Math.max(1, parseInt(e.target.value) || 50))}
                  min="1"
                  max="500"
                  className="w-32"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Catatan:</span> {useAdvancedAnalysis ? 'Menggunakan IndoBERT dan LDA untuk analisis mendalam.' : 'Menggunakan analisis keyword-based sederhana.'}
              </p>
            </div>

            {/* Loading Section */}
            {loading && (
              <div className="text-center py-8">
                <div className="flex justify-center items-center space-x-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-primary font-semibold">Menganalisis komentar, mohon tunggu...</p>
                </div>
              </div>
            )}

            {/* Error Section */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results Section */}
            {analysisData && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Hasil Analisis</h2>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="detailed-view" className="text-sm font-medium">
                      Tampilkan Detail
                    </Label>
                    <Switch
                      id="detailed-view"
                      checked={showDetailedView}
                      onCheckedChange={setShowDetailedView}
                    />
                  </div>
                </div>

                {/* Statistics Grid */}
                <Card className="bg-gradient-primary/10">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Komentar</p>
                        <p className="text-2xl font-bold text-primary">{analysisData.statistics.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Netral</p>
                        <p className="text-2xl font-bold text-green-600">{analysisData.statistics.neutral}</p>
                      </div>
                      <div>
                        <p className="text-sm text-red-600">Ujaran Kebencian (Total)</p>
                        <p className="text-2xl font-bold text-red-700">{analysisData.statistics.totalHateSpeech}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">SARA</p>
                        <p className="text-xl font-bold text-red-500">{analysisData.statistics.sara}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Penghinaan</p>
                        <p className="text-xl font-bold text-red-500">{analysisData.statistics.penghinaan}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Provokasi</p>
                        <p className="text-xl font-bold text-red-500">{analysisData.statistics.provokasi}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lainnya (Negatif)</p>
                        <p className="text-xl font-bold text-orange-500">{analysisData.statistics.lainnya}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Visual Charts */}
                <SentimentChart 
                  statistics={{
                    total: analysisData.statistics.total,
                    hate: analysisData.statistics.totalHateSpeech,
                    neutral: analysisData.statistics.neutral,
                    positive: 0, // We don't have positive stats in current structure
                    hatePercentage: Math.round((analysisData.statistics.totalHateSpeech / analysisData.statistics.total) * 100),
                    neutralPercentage: Math.round((analysisData.statistics.neutral / analysisData.statistics.total) * 100),
                    positivePercentage: 0
                  }}
                />

                {/* Topic Clustering */}
                <TopicClustering clusters={analysisData.topics} />

                {/* Entity Targets */}
                <EntityTargets entities={analysisData.entities} />

                {/* Comments Table */}
                {showDetailedView && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">Detail Komentar:</h3>
                    <Card>
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead>Akun</TableHead>
                              <TableHead>Komentar</TableHead>
                              <TableHead>Klasifikasi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysisData.results.map((result, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{result.userName}</TableCell>
                                <TableCell className="max-w-md">
                                  <EmojiDisplay text={result.text} />
                                </TableCell>
                                <TableCell>{getClassificationBadge(result.classification)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                    <p className="text-xs text-muted-foreground">
                      * Analisis menggunakan {useAdvancedAnalysis ? 'IndoBERT dan LDA clustering' : 'keyword-based analysis'}.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacebookAnalysis;