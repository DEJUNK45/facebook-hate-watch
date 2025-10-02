import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  FileText, 
  MessageCircle, 
  Scale,
  Shield
} from 'lucide-react';
import { BertAnalysisResult } from '@/services/bertService';

interface ClassificationDetailsProps {
  results: BertAnalysisResult[];
}

const ClassificationDetails = ({ results }: ClassificationDetailsProps) => {
  // Aggregate statistics
  const stats = {
    iteViolations: {
      defamation: results.filter(r => r.iteViolationType === 'defamation').length,
      blasphemy: results.filter(r => r.iteViolationType === 'blasphemy').length,
      unpleasant_acts: results.filter(r => r.iteViolationType === 'unpleasant_acts').length,
      incitement: results.filter(r => r.iteViolationType === 'incitement').length,
      hoax: results.filter(r => r.iteViolationType === 'hoax').length,
    },
    speechActs: {
      assertive: results.filter(r => r.speechActType === 'assertive').length,
      directive: results.filter(r => r.speechActType === 'directive').length,
      commissive: results.filter(r => r.speechActType === 'commissive').length,
      expressive: results.filter(r => r.speechActType === 'expressive').length,
      declarative: results.filter(r => r.speechActType === 'declarative').length,
    },
    aggressive: results.filter(r => 
      r.speechActSubtype?.includes('Agresif') || 
      r.speechActSubtype?.includes('Tuduhan') ||
      r.speechActSubtype?.includes('Ancaman') ||
      r.speechActSubtype?.includes('Balas Dendam') ||
      r.speechActSubtype?.includes('Penghinaan') ||
      r.speechActSubtype?.includes('Diskriminatif')
    ).length
  };

  const getITEViolationColor = (type: string) => {
    const colors: Record<string, string> = {
      defamation: 'bg-red-100 text-red-800 border-red-300',
      blasphemy: 'bg-purple-100 text-purple-800 border-purple-300',
      unpleasant_acts: 'bg-orange-100 text-orange-800 border-orange-300',
      incitement: 'bg-red-200 text-red-900 border-red-400',
      hoax: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSpeechActColor = (type: string) => {
    const colors: Record<string, string> = {
      assertive: 'bg-blue-100 text-blue-800 border-blue-300',
      directive: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      commissive: 'bg-violet-100 text-violet-800 border-violet-300',
      expressive: 'bg-pink-100 text-pink-800 border-pink-300',
      declarative: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const totalITEViolations = Object.values(stats.iteViolations).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* ITE Violations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Klasifikasi Pelanggaran UU ITE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalITEViolations > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stats.iteViolations.defamation > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600">{stats.iteViolations.defamation}</div>
                    <div className="text-sm text-muted-foreground">Pencemaran Nama Baik</div>
                  </div>
                )}
                {stats.iteViolations.blasphemy > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{stats.iteViolations.blasphemy}</div>
                    <div className="text-sm text-muted-foreground">Penistaan</div>
                  </div>
                )}
                {stats.iteViolations.unpleasant_acts > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">{stats.iteViolations.unpleasant_acts}</div>
                    <div className="text-sm text-muted-foreground">Perbuatan Tidak Menyenangkan</div>
                  </div>
                )}
                {stats.iteViolations.incitement > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-700">{stats.iteViolations.incitement}</div>
                    <div className="text-sm text-muted-foreground">Menghasut</div>
                  </div>
                )}
                {stats.iteViolations.hoax > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600">{stats.iteViolations.hoax}</div>
                    <div className="text-sm text-muted-foreground">Berita Bohong</div>
                  </div>
                )}
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Terdeteksi {totalITEViolations} komentar dengan potensi pelanggaran UU ITE dari {results.length} total komentar.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Tidak terdeteksi pelanggaran UU ITE yang signifikan dalam komentar yang dianalisis.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Speech Acts Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Klasifikasi Tindak Tutur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="border rounded-lg p-3 bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{stats.speechActs.assertive}</div>
              <div className="text-sm text-muted-foreground">Asertif</div>
            </div>
            <div className="border rounded-lg p-3 bg-indigo-50">
              <div className="text-2xl font-bold text-indigo-600">{stats.speechActs.directive}</div>
              <div className="text-sm text-muted-foreground">Direktif</div>
            </div>
            <div className="border rounded-lg p-3 bg-violet-50">
              <div className="text-2xl font-bold text-violet-600">{stats.speechActs.commissive}</div>
              <div className="text-sm text-muted-foreground">Komisif</div>
            </div>
            <div className="border rounded-lg p-3 bg-pink-50">
              <div className="text-2xl font-bold text-pink-600">{stats.speechActs.expressive}</div>
              <div className="text-sm text-muted-foreground">Ekspresif</div>
            </div>
            <div className="border rounded-lg p-3 bg-cyan-50">
              <div className="text-2xl font-bold text-cyan-600">{stats.speechActs.declarative}</div>
              <div className="text-sm text-muted-foreground">Deklaratif</div>
            </div>
          </div>

          {stats.aggressive > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Terdeteksi {stats.aggressive} komentar dengan tindak tutur agresif (Tuduhan/Fitnah, Ancaman, Balas Dendam, Penghinaan, atau Diskriminatif).
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results
              .filter(r => r.iteViolationType || r.speechActType)
              .slice(0, 10)
              .map((result, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 text-sm">
                  <p className="text-foreground line-clamp-2">{result.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.iteViolationType && (
                      <Badge className={getITEViolationColor(result.iteViolationType)}>
                        {result.iteViolationLabel}
                      </Badge>
                    )}
                    {result.speechActType && (
                      <Badge className={getSpeechActColor(result.speechActType)}>
                        {result.speechActSubtype || result.speechActType}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassificationDetails;
