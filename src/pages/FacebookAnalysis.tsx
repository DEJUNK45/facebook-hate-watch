import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { ApifyService } from '@/services/apifyService';
import { bertService, TopicCluster, EntityTarget } from '@/services/bertService';
import ApiKeyInput from '@/components/ApiKeyInput';
import TopicClustering from '@/components/TopicClustering';
import EntityTargets from '@/components/EntityTargets';
import EmojiDisplay from '@/components/EmojiDisplay';
import CommentDisplay from '@/components/CommentDisplay';
import { SentimentChart } from '@/components/SentimentChart';
import { UUITEAnalysis } from '@/components/UUITEAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  userName: string;
  text: string;
  classification: string;
  imageUrl?: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'link';
    url: string;
    description?: string;
  }>;
}

interface RawComment {
  userName: string;
  text: string;
  imageUrl?: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'link';
    url: string;
    description?: string;
  }>;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [postData, setPostData] = useState<any>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [useAdvancedAnalysis, setUseAdvancedAnalysis] = useState(true);
  const [resultsLimit, setResultsLimit] = useState(50);
  const [showImages, setShowImages] = useState(true);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
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

  const prepareDownloadData = () => {
    if (!analysisData) return [];

    const data = [];
    
    // Add headers
    data.push([
      'URL Postingan',
      'Konten Postingan',
      'Nama Pengguna',
      'Komentar pengguna',
      'Klasifikasi',
      'Topik Utama',
      'Target Entitas',
      'UU ITE',
      'UU ITE Deskripsi'
    ]);

    // Process each comment
    analysisData.results.forEach((comment, index) => {
      const analysisResult = analysisResults[index];
      const uiteViolation = analysisResult?.uiteViolation;
      
      // Get relevant topics for this comment
      const relevantTopics = analysisData.topics
        .filter(topic => topic.keywords.some(keyword => 
          comment.text.toLowerCase().includes(keyword.toLowerCase())
        ))
        .map(topic => topic.keywords.slice(0, 3).join(', '))
        .join(' | ');

      // Get relevant entities for this comment  
      const relevantEntities = analysisData.entities
        .filter(entity => 
          comment.text.toLowerCase().includes(entity.entity.toLowerCase())
        )
        .map(entity => `${entity.entity} (${entity.type})`)
        .join(' | ');

      data.push([
        url || 'Tidak ada URL',
        postData?.content || 'Tidak tersedia',
        comment?.userName || 'Tidak tersedia',
        (comment?.text || '').replace(/"/g, '""'),
        comment?.classification || 'Tidak tersedia',
        Array.isArray(relevantTopics) ? relevantTopics.join('; ') : (relevantTopics || 'Tidak teridentifikasi'),
        Array.isArray(relevantEntities) ? relevantEntities.join('; ') : (relevantEntities || 'Tidak teridentifikasi'),
        uiteViolation?.hasViolation ? 'Ya' : 'Tidak',
        uiteViolation?.description || 'Tidak ada keterangan'
      ]);
    });

    return data;
  };

  const downloadCommentsAsCSV = () => {
    const data = prepareDownloadData();
    if (data.length === 0) return;

    // Convert to CSV string
    const csvContent = data
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Add BOM for proper Unicode support in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const fileName = `analisis_facebook_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (link.download !== undefined) {
      const downloadUrl = URL.createObjectURL(blob);
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadCommentsAsExcel = () => {
    const data = prepareDownloadData();
    if (data.length === 0) return;

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analisis Facebook');

    // Set column widths
    ws['!cols'] = [
      { wch: 50 }, // URL Postingan
      { wch: 40 }, // Konten Postingan
      { wch: 20 }, // Nama Pengguna
      { wch: 50 }, // Komentar pengguna
      { wch: 20 }, // Klasifikasi
      { wch: 30 }, // Topik Utama
      { wch: 30 }, // Target Entitas
      { wch: 10 }, // UU ITE
      { wch: 40 }, // UU ITE Deskripsi
    ];

    // Generate Excel file
    const fileName = `analisis_facebook_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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

      // Store post data for CSV download
      setPostData(response.data.postData);

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
        
        // Store analysis results for UU ITE analysis
        setAnalysisResults(analysisResults);
        
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
          analysisResults[index]?.sentiment === 'positive' ? 'Positif' : 'Netral',
        imageUrl: comment.imageUrl,
        attachments: comment.attachments
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
              Analisis Digital Agresi dari Postingan Facebook
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Masukkan URL postingan Facebook untuk menganalisis komentar.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Dibuat oleh: Dewa Gede Agung Aditya Keramas
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* API Key Input Section */}
            <ApiKeyInput />
            
            {/* Analysis Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                <div>
                  <Label htmlFor="advanced-analysis" className="text-sm font-medium">
                    Gunakan IndoBERT dan LDA untuk Analisis Lanjutan
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Analisis lebih akurat menggunakan AI model dan topic modeling untuk bahasa Indonesia
                  </p>
                </div>
                <Switch
                  id="advanced-analysis"
                  checked={useAdvancedAnalysis}
                  onCheckedChange={setUseAdvancedAnalysis}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="results-limit" className="text-sm font-medium">
                    Jumlah Komentar yang Dianalisis
                  </Label>
                  <Input
                    id="results-limit"
                    type="number"
                    min="10"
                    max="200"
                    value={resultsLimit}
                    onChange={(e) => setResultsLimit(parseInt(e.target.value) || 50)}
                    placeholder="50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maksimal 200 komentar per analisis
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                  <div>
                    <Label htmlFor="show-images" className="text-sm font-medium">
                      Tampilkan Gambar dalam Komentar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Menampilkan gambar dan media yang dilampirkan
                    </p>
                  </div>
                  <Switch
                    id="show-images"
                    checked={showImages}
                    onCheckedChange={setShowImages}
                  />
                </div>
              </div>
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
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Catatan:</span> {useAdvancedAnalysis ? `Menggunakan IndoBERT dan LDA untuk analisis ${resultsLimit} komentar.` : `Menggunakan analisis keyword-based untuk ${resultsLimit} komentar.`}
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

                {/* Analysis Results in Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="comments">Komentar</TabsTrigger>
                    <TabsTrigger value="topics">Topik</TabsTrigger>
                    <TabsTrigger value="entities">Target</TabsTrigger>
                    <TabsTrigger value="uu-ite">UU ITE</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Sentiment Visualization */}
                    <SentimentChart 
                      statistics={{
                        total: analysisData.statistics.total,
                        hate: analysisData.statistics.totalHateSpeech,
                        neutral: analysisData.statistics.neutral,
                        positive: Math.max(0, analysisData.statistics.total - analysisData.statistics.neutral - analysisData.statistics.totalHateSpeech),
                        hatePercentage: Math.round((analysisData.statistics.totalHateSpeech / analysisData.statistics.total) * 100),
                        neutralPercentage: Math.round((analysisData.statistics.neutral / analysisData.statistics.total) * 100),
                        positivePercentage: Math.round((Math.max(0, analysisData.statistics.total - analysisData.statistics.neutral - analysisData.statistics.totalHateSpeech) / analysisData.statistics.total) * 100)
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="comments">
                    {/* Comments Display */}
                    {showDetailedView && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <h3 className="text-xl font-semibold">Detail Komentar:</h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={downloadCommentsAsCSV}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download CSV
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={downloadCommentsAsExcel}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Download Excel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <Badge variant="outline">
                              {analysisData.results.filter(r => r.imageUrl || (r.attachments && r.attachments.length > 0)).length} komentar dengan media
                            </Badge>
                          </div>

                        {showImages ? (
                          <div className="space-y-4">
                            {analysisData.results.map((result, index) => {
                              const comment = {
                                id: `comment_${index}`,
                                author: result.userName,
                                text: result.text,
                                timestamp: new Date().toISOString(),
                                imageUrl: result.imageUrl,
                                attachments: result.attachments
                              };
                              
                              return (
                                <CommentDisplay
                                  key={index}
                                  comment={comment}
                                  classification={result.classification}
                                  getClassificationBadge={getClassificationBadge}
                                />
                              );
                            })}
                          </div>
                        ) : (
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
                                      <TableCell className="max-w-xs">
                                        <div className="space-y-1">
                                          <p className="text-sm break-words">
                                            {result.text.length > 100 ? `${result.text.substring(0, 100)}...` : result.text}
                                          </p>
                                          <EmojiDisplay text={result.text} />
                                          {(result.imageUrl || (result.attachments && result.attachments.length > 0)) && (
                                            <Badge variant="secondary" className="text-xs">
                                              📷 Media
                                            </Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>{getClassificationBadge(result.classification)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </Card>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          * Analisis menggunakan {useAdvancedAnalysis ? 'IndoBERT dan LDA clustering' : 'keyword-based analysis'} untuk mendeteksi ujaran kebencian dan topik.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="topics">
                    <TopicClustering clusters={analysisData.topics} />
                  </TabsContent>

                  <TabsContent value="entities">
                    <EntityTargets entities={analysisData.entities} />
                  </TabsContent>
                  
                  <TabsContent value="uu-ite">
                    <UUITEAnalysis results={analysisResults} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacebookAnalysis;