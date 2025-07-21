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
            Saat ini aplikasi menggunakan demo data karena actor ID <code>"facebook-scraper"</code> tidak ditemukan. 
            Ikuti langkah-langkah di bawah untuk menggunakan data real.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold">Langkah-langkah setup:</h4>
          
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Kunjungi{' '}
              <Button variant="link" className="p-0 h-auto text-primary" asChild>
                <a href="https://apify.com/store" target="_blank" rel="noopener noreferrer">
                  Apify Store <ExternalLink className="h-3 w-3 ml-1 inline" />
                </a>
              </Button>
            </li>
            <li>Cari actor untuk Facebook scraping (contoh: "facebook-pages-scraper", "facebook-posts-scraper")</li>
            <li>Salin actor ID dari URL (format: username/actor-name)</li>
            <li>Update kode di <code>src/services/apifyService.ts</code> dengan actor ID yang benar</li>
            <li>Sesuaikan parameter request sesuai dokumentasi actor</li>
          </ol>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Actor yang direkomendasikan:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <code>apify/facebook-pages-scraper</code> - Untuk scraping halaman Facebook</li>
              <li>• <code>apify/facebook-posts-scraper</code> - Untuk scraping postingan spesifik</li>
              <li>• <code>dtrungtin/facebook-comments-scraper</code> - Khusus untuk komentar</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};