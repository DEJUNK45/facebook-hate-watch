import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
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

const FacebookAnalysis = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Comment[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  const isValidFacebookUrl = (url: string) => {
    return url.startsWith('https://www.facebook.com/') || url.startsWith('https://facebook.com/');
  };

  const mockFetchCommentsFromApify = async (url: string): Promise<RawComment[]> => {
    console.log(`Simulasi pengambilan komentar dari Apify untuk URL: ${url}`);
    
    // Delay untuk simulasi network call
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const mockComments = [
      { userName: "Pengguna_Baik_123", text: "Postingan yang sangat menginspirasi, terima kasih sudah berbagi!" },
      { userName: "KritisTapiSopan", text: "Saya kurang setuju dengan poin kedua, tapi argumennya menarik untuk didiskusikan lebih lanjut." },
      { userName: "PenebarKedamaian", text: "Semoga kita semua bisa saling menghargai perbedaan ya." },
      { userName: "AkunProvokator77", text: "Dasar kalian semua bodoh! Gak ngerti apa-apa tapi sok tahu!" },
      { userName: "AntiHoaxClub", text: "Ini berita tidak benar, jangan mudah percaya sebelum cek sumbernya." },
      { userName: "PejuangKebenaran99", text: "Orang-orang dari suku X itu memang pemalas dan tidak berguna. Usir saja mereka!" },
      { userName: "NetizenBijak", text: "Mari jaga komentar kita agar tetap santun dan tidak menyakiti orang lain." },
      { userName: "SiPalingBenar", text: "Agama Y itu sesat! Jangan ikuti ajaran mereka kalau mau selamat dunia akhirat." },
      { userName: "TukangKomporGas", text: "Ayo serang akun ini! Jangan biarkan dia menyebarkan kebohongan!" },
      { userName: "RandomUser01", text: "Apaan sih ini gak jelas banget." },
      { userName: "CintaDamaiSelalu", text: "Indahnya perbedaan jika kita bisa saling menghormati." },
      { userName: "HaterGarisKeras", text: "Semua pendukung Z adalah kumpulan orang tolol yang mudah dibodohi." },
      { userName: "GenerasiMudaCerdas", text: "Perlu literasi digital yang lebih baik agar tidak mudah terprovokasi." },
      { userName: "KorbanBullyOnline", text: "Komentar seperti ini yang membuat saya takut bersuara di media sosial." },
      { userName: "AhliDebatKusir", text: "Logika Anda cacat! Seharusnya Anda belajar lagi sebelum berkomentar." }
    ];

    return mockComments.sort(() => 0.5 - Math.random()).slice(0, 10 + Math.floor(Math.random() * 6));
  };

  const mockAnalyzeHateSpeech = (commentText: string): string => {
    const lowerText = commentText.toLowerCase();
    
    const saraKeywords = ["suku", "agama", "ras", "cina", "pribumi", "kafir", "sesat"];
    const penghinaanKeywords = ["bodoh", "tolol", "idiot", "goblok", "dungu", "sampah", "tidak berguna"];
    const provokasiKeywords = ["serang", "bakar", "hancurkan", "bunuh", "usir", "ganyang"];

    if (saraKeywords.some(kw => lowerText.includes(kw))) return "SARA";
    if (penghinaanKeywords.some(kw => lowerText.includes(kw))) return "Penghinaan";
    if (provokasiKeywords.some(kw => lowerText.includes(kw))) return "Provokasi";
    
    const negatifUmumKeywords = ["benci", "jelek", "buruk", "tidak suka", "payah"];
    if (negatifUmumKeywords.some(kw => lowerText.includes(kw))) {
      if (Math.random() < 0.5) return "Lainnya (Negatif)";
    }

    if (Math.random() < 0.15 && !saraKeywords.some(kw => lowerText.includes(kw)) && 
        !penghinaanKeywords.some(kw => lowerText.includes(kw)) && 
        !provokasiKeywords.some(kw => lowerText.includes(kw))) {
      return "Lainnya (Negatif)";
    }

    return "Netral";
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
    setResults([]);
    setStatistics(null);
    setLoading(true);

    try {
      const commentsData = await mockFetchCommentsFromApify(url);

      if (!commentsData || commentsData.length === 0) {
        setError("Tidak ada komentar yang ditemukan atau gagal mengambil data (simulasi).");
        return;
      }

      const analysisResults: Comment[] = [];
      const stats: Statistics = {
        total: commentsData.length,
        neutral: 0,
        sara: 0,
        penghinaan: 0,
        provokasi: 0,
        lainnya: 0,
        totalHateSpeech: 0
      };

      for (const comment of commentsData) {
        const classification = mockAnalyzeHateSpeech(comment.text);
        analysisResults.push({
          userName: comment.userName,
          text: comment.text,
          classification: classification
        });

        if (classification === "Netral") stats.neutral++;
        else if (classification === "SARA") stats.sara++;
        else if (classification === "Penghinaan") stats.penghinaan++;
        else if (classification === "Provokasi") stats.provokasi++;
        else if (classification === "Lainnya (Negatif)") stats.lainnya++;
      }

      stats.totalHateSpeech = stats.sara + stats.penghinaan + stats.provokasi + stats.lainnya;

      setResults(analysisResults);
      setStatistics(stats);

    } catch (error) {
      console.error("Error during analysis:", error);
      setError("Terjadi kesalahan selama proses analisis (simulasi). Detail: " + (error as Error).message);
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
                <span className="font-semibold">Catatan:</span> Ini adalah simulasi. Tidak ada panggilan API Apify atau model ML aktual yang digunakan.
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
            {statistics && results.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Hasil Analisis</h2>

                {/* Statistics Grid */}
                <Card className="bg-gradient-primary/10">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Komentar</p>
                        <p className="text-2xl font-bold text-primary">{statistics.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Netral</p>
                        <p className="text-2xl font-bold text-green-600">{statistics.neutral}</p>
                      </div>
                      <div>
                        <p className="text-sm text-red-600">Ujaran Kebencian (Total)</p>
                        <p className="text-2xl font-bold text-red-700">{statistics.totalHateSpeech}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">SARA</p>
                        <p className="text-xl font-bold text-red-500">{statistics.sara}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Penghinaan</p>
                        <p className="text-xl font-bold text-red-500">{statistics.penghinaan}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Provokasi</p>
                        <p className="text-xl font-bold text-red-500">{statistics.provokasi}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lainnya (Negatif)</p>
                        <p className="text-xl font-bold text-orange-500">{statistics.lainnya}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments Table */}
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
                          {results.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{result.userName}</TableCell>
                              <TableCell className="max-w-md">{result.text}</TableCell>
                              <TableCell>{getClassificationBadge(result.classification)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                  <p className="text-xs text-muted-foreground">
                    * Klasifikasi ujaran kebencian (SARA, Penghinaan, Provokasi, Lainnya) adalah hasil simulasi.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacebookAnalysis;