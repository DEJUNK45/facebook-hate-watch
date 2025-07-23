import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ApifyService } from '@/services/apifyService';
import { Key, Save } from 'lucide-react';

const ApiKeyInput = () => {
  const [apiKey, setApiKey] = useState(ApifyService.getApiKey() || '');
  const [isEditing, setIsEditing] = useState(!ApifyService.getApiKey());
  const { toast } = useToast();

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    ApifyService.saveApiKey(apiKey.trim());
    setIsEditing(false);
    toast({
      title: "Berhasil",
      description: "API key Apify berhasil disimpan",
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Apify API Key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Masukkan API key Apify Anda"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={!isEditing}
            className="flex-grow"
          />
          {isEditing ? (
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          ) : (
            <Button onClick={handleEdit} variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          API key diperlukan untuk mengakses layanan scraping Apify. 
          Dapatkan API key Anda di{' '}
          <a 
            href="https://console.apify.com/account/integrations" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Apify Console
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;