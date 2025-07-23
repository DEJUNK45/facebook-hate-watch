import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info, Lightbulb } from 'lucide-react';

export const ApifyActorGuide = () => {
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Info className="h-5 w-5" />
          Panduan Setup Apify Actor
        </CardTitle>
        <CardDescription>
          Untuk menggunakan data Facebook yang sebenarnya, Anda perlu mengonfigurasi actor Apify yang tepat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Aplikasi sekarang menggunakan demo data karena masalah CORS atau tidak ada API key. 
            CORS policy browser memblokir akses langsung ke Apify API dari frontend.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold">Solusi untuk masalah CORS:</h4>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground mb-2">🚀 Solusi Direkomendasikan: Backend Proxy</p>
              <ul className="space-y-1">
                <li>• Integrasikan dengan Supabase untuk backend yang aman</li>
                <li>• Buat Edge Function untuk memanggil Apify API</li>
                <li>• Frontend memanggil Edge Function, bukan langsung ke Apify</li>
              </ul>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground mb-2">⚡ Alternatif: Serverless Functions</p>
              <ul className="space-y-1">
                <li>• Deploy function di Vercel/Netlify</li>
                <li>• Function berisi API key dan logic Apify</li>
                <li>• Frontend memanggil serverless function</li>
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground mb-2">🔧 Development Only: Browser Extension</p>
              <ul className="space-y-1">
                <li>• Install "CORS Unblock" extension untuk testing</li>
                <li>• Hanya untuk development, TIDAK untuk production</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-2">💡 Mengapa CORS terjadi?</p>
            <p className="text-sm text-muted-foreground">
              Browser memblokir request dari frontend ke API eksternal karena kebijakan keamanan. 
              Apify API tidak menyertakan header CORS yang diperlukan untuk akses langsung dari browser.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="default" asChild>
              <a href="https://docs.lovable.dev/user-guides/supabase" target="_blank" rel="noopener noreferrer">
                Setup Supabase Integration <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://apify.com/store" target="_blank" rel="noopener noreferrer">
                Browse Apify Actors <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};