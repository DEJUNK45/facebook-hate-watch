interface ApifyComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes?: number;
  replies?: number;
}

interface ApifyResponse {
  success: boolean;
  data?: {
    comments: ApifyComment[];
    postData: {
      title: string;
      content: string;
      author: string;
      timestamp: string;
      likes: number;
      shares: number;
    };
  };
  error?: string;
}

interface AnalysisResult {
  comment: ApifyComment;
  sentiment: 'hate' | 'neutral' | 'positive';
  category?: string;
  confidence: number;
}

export class ApifyService {
  private static API_KEY_STORAGE_KEY = 'apify_api_key';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async scrapePost(facebookUrl: string): Promise<ApifyResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key tidak ditemukan' };
    }

    try {
      // Simulasi call ke Apify API - ganti dengan actual API call
      const response = await fetch('https://api.apify.com/v2/acts/facebook-scraper/run-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: facebookUrl,
          scrapeComments: true,
          maxComments: 100
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Simulasi data untuk demo - ganti dengan response API yang sebenarnya
      return {
        success: true,
        data: {
          comments: this.generateDemoComments(),
          postData: {
            title: "Post Facebook Demo",
            content: "Ini adalah contoh konten postingan Facebook yang akan dianalisis untuk ujaran kebencian.",
            author: "Demo User",
            timestamp: new Date().toISOString(),
            likes: 150,
            shares: 25
          }
        }
      };
    } catch (error) {
      console.error('Error scraping Facebook post:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Gagal mengambil data dari Facebook' 
      };
    }
  }

  // Demo data untuk development - hapus saat production
  private static generateDemoComments(): ApifyComment[] {
    const demoComments = [
      {
        id: '1',
        author: 'John Doe',
        text: 'Setuju banget dengan postingan ini! Sangat inspiratif.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        likes: 12,
        replies: 2
      },
      {
        id: '2', 
        author: 'Jane Smith',
        text: 'Orang-orang seperti ini memang tidak berguna dan harus dienyahkan dari masyarakat.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        likes: 3,
        replies: 8
      },
      {
        id: '3',
        author: 'Ahmad Rahman',
        text: 'Terima kasih sudah berbagi informasi yang bermanfaat ini.',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        likes: 25,
        replies: 1
      },
      {
        id: '4',
        author: 'Maria Santos',
        text: 'Dasar bodoh! Kenapa masih ada orang seperti ini di dunia. Menyebalkan sekali!',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        likes: 1,
        replies: 15
      },
      {
        id: '5',
        author: 'Budi Santoso',
        text: 'Artikel yang menarik, saya akan share ke teman-teman.',
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        likes: 8,
        replies: 0
      }
    ];

    return demoComments;
  }

  static analyzeComments(comments: ApifyComment[]): AnalysisResult[] {
    // Simulasi analisis sentiment menggunakan keyword sederhana
    // Dalam implementasi sebenarnya, gunakan model ML yang sudah ditraining
    const hateKeywords = ['bodoh', 'tolol', 'bangsat', 'anjing', 'babi', 'menyebalkan', 'tidak berguna', 'dienyahkan'];
    const positiveKeywords = ['setuju', 'bagus', 'inspiratif', 'terima kasih', 'bermanfaat', 'menarik'];

    return comments.map(comment => {
      const text = comment.text.toLowerCase();
      let sentiment: 'hate' | 'neutral' | 'positive' = 'neutral';
      let category = '';
      let confidence = 0.5;

      // Deteksi hate speech
      const hateCount = hateKeywords.filter(keyword => text.includes(keyword)).length;
      const positiveCount = positiveKeywords.filter(keyword => text.includes(keyword)).length;

      if (hateCount > 0) {
        sentiment = 'hate';
        confidence = Math.min(0.9, 0.6 + (hateCount * 0.1));
        category = hateCount > 1 ? 'Offensive Language' : 'Harassment';
      } else if (positiveCount > 0) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.6 + (positiveCount * 0.1));
      }

      return {
        comment,
        sentiment,
        category,
        confidence
      };
    });
  }

  static getStatistics(analysisResults: AnalysisResult[]) {
    const total = analysisResults.length;
    const hate = analysisResults.filter(r => r.sentiment === 'hate').length;
    const neutral = analysisResults.filter(r => r.sentiment === 'neutral').length;
    const positive = analysisResults.filter(r => r.sentiment === 'positive').length;

    return {
      total,
      hate,
      neutral,
      positive,
      hatePercentage: total > 0 ? Math.round((hate / total) * 100) : 0,
      neutralPercentage: total > 0 ? Math.round((neutral / total) * 100) : 0,
      positivePercentage: total > 0 ? Math.round((positive / total) * 100) : 0
    };
  }
}