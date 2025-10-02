import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Eye, EyeOff, Info } from 'lucide-react';

interface GeminiApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

const GeminiApiKeyInput = ({ onApiKeySet, currentApiKey }: GeminiApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isSet, setIsSet] = useState(!!currentApiKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
      setIsSet(true);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Analisis Mendalam dengan Gemini AI
        </CardTitle>
        <CardDescription>
          Fitur opsional untuk analisis yang lebih detail menggunakan Google Gemini AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Gemini AI memberikan analisis yang lebih akurat untuk klasifikasi pelanggaran UU ITE dan tindak tutur.
            API key Anda disimpan hanya di browser dan tidak dikirim ke server kami.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-api-key">Gemini API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="gemini-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="submit" disabled={!apiKey.trim()}>
                {isSet ? 'Perbarui' : 'Simpan'}
              </Button>
            </div>
          </div>

          {isSet && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800 text-sm">
                ✓ Gemini API Key telah diatur. Analisis mendalam akan digunakan saat analisis.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <div className="text-xs text-muted-foreground">
          <p>Belum punya API Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Dapatkan gratis di sini</a></p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiApiKeyInput;
