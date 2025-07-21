import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ApifyService } from '@/services/apifyService';
import { Key, Shield } from 'lucide-react';

interface ApiKeyFormProps {
  onApiKeySet: () => void;
}

export const ApiKeyForm = ({ onApiKeySet }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState(ApifyService.getApiKey() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Silakan masukkan API key Apify",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      ApifyService.saveApiKey(apiKey);
      toast({
        title: "Berhasil",
        description: "API key berhasil disimpan",
      });
      onApiKeySet();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Gagal menyimpan API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
            <Key className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Setup API Key
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Masukkan API key Apify untuk mulai menganalisis postingan Facebook
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apikey" className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Apify API Key
              </Label>
              <Input
                id="apikey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="apify_api_..."
                className="transition-all duration-200 focus:shadow-glow"
                required
              />
              <p className="text-xs text-muted-foreground">
                API key akan disimpan di browser Anda secara lokal
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-card"
            >
              {isLoading ? "Menyimpan..." : "Simpan API Key"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Catatan:</strong> Untuk mendapatkan API key Apify, kunjungi{' '}
              <a 
                href="https://apify.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                apify.com
              </a>{' '}
              dan daftar untuk akun gratis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};