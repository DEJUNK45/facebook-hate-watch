import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, X } from "lucide-react";
import { BertAnalysisResult } from "@/services/bertService";

interface UUITEAnalysisProps {
  results: BertAnalysisResult[];
}

export const UUITEAnalysis = ({ results }: UUITEAnalysisProps) => {
  const violationResults = results.filter(result => result.uiteViolation?.hasViolation);
  const totalViolations = violationResults.length;
  const totalComments = results.length;
  
  // Group by severity
  const severityGroups = {
    high: violationResults.filter(r => r.uiteViolation?.severity === 'high'),
    medium: violationResults.filter(r => r.uiteViolation?.severity === 'medium'),
    low: violationResults.filter(r => r.uiteViolation?.severity === 'low')
  };

  // Count articles
  const articleCount = new Map<string, number>();
  violationResults.forEach(result => {
    result.uiteViolation?.articles.forEach(article => {
      articleCount.set(article, (articleCount.get(article) || 0) + 1);
    });
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Shield className="h-4 w-4" />;
      default: return <X className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Analisis Potensi Pelanggaran UU ITE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{totalComments}</div>
              <div className="text-sm text-muted-foreground">Total Komentar</div>
            </div>
            <div className="bg-destructive/10 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-destructive">{totalViolations}</div>
              <div className="text-sm text-muted-foreground">Potensi Pelanggaran</div>
            </div>
            <div className="bg-orange-500/10 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{severityGroups.high.length}</div>
              <div className="text-sm text-muted-foreground">Risiko Tinggi</div>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{severityGroups.medium.length}</div>
              <div className="text-sm text-muted-foreground">Risiko Sedang</div>
            </div>
          </div>

          {totalViolations > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ditemukan {totalViolations} komentar dengan potensi pelanggaran UU ITE. 
                Analisis ini bersifat otomatis dan memerlukan verifikasi lebih lanjut dari ahli hukum.
              </AlertDescription>
            </Alert>
          )}

          {Array.from(articleCount.entries()).length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Pasal yang Berpotensi Dilanggar:</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(articleCount.entries()).map(([article, count]) => (
                  <Badge key={article} variant="outline">
                    {article} ({count} kasus)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {violationResults.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Detail Komentar Bermasalah:</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {violationResults.slice(0, 10).map((result, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={getSeverityColor(result.uiteViolation?.severity || 'low')} className="flex items-center gap-1">
                        {getSeverityIcon(result.uiteViolation?.severity || 'low')}
                        {result.uiteViolation?.severity?.toUpperCase()}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {result.uiteViolation?.articles.map(article => (
                          <Badge key={article} variant="outline" className="text-xs">
                            {article}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm mb-2 bg-muted/50 p-2 rounded italic">
                      "{result.text.length > 150 ? result.text.substring(0, 150) + '...' : result.text}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.uiteViolation?.description}
                    </p>
                  </div>
                ))}
                {violationResults.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    ... dan {violationResults.length - 10} komentar lainnya
                  </p>
                )}
              </div>
            </div>
          )}

          {totalViolations === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-green-600">Tidak Ada Pelanggaran Terdeteksi</p>
              <p className="text-sm text-muted-foreground">
                Semua komentar yang dianalisis tidak menunjukkan potensi pelanggaran UU ITE yang signifikan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};