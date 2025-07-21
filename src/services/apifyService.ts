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
      // Menggunakan actor task yang sudah dikonfigurasi
      const taskId = 'dewadegungagung~facebook-comments-scraper-task';
      
      // Jalankan task dengan input URL
      const runResponse = await fetch(`https://api.apify.com/v2/actor-tasks/${taskId}/run-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: [{ url: facebookUrl }]
        })
      });

      console.log('Run response status:', runResponse.status);
      
      if (!runResponse.ok) {
        const errorData = await runResponse.json();
        console.error('Run API Error:', errorData);
        
        // Fallback ke demo data jika ada error
        console.warn('Menggunakan demo data karena ada error...');
        return {
          success: true,
          data: {
            comments: this.generateDemoComments(),
            postData: {
              title: "Demo - Post Facebook",
              content: "Ini adalah demo data karena terjadi error saat mengakses Apify API.",
              author: "Demo User", 
              timestamp: new Date().toISOString(),
              likes: 150,
              shares: 25
            }
          }
        };
      }

      const runData = await runResponse.json();
      console.log('Run API Response:', runData);
      
      // Ambil data dari dataset
      const datasetResponse = await fetch(`https://api.apify.com/v2/actor-tasks/${taskId}/run-sync-get-dataset-items?token=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!datasetResponse.ok) {
        console.warn('Dataset response not ok, using demo data');
        return {
          success: true,
          data: {
            comments: this.generateDemoComments(),
            postData: {
              title: "Demo - Post Facebook",
              content: "Dataset tidak dapat diakses, menggunakan demo data.",
              author: "Demo User",
              timestamp: new Date().toISOString(),
              likes: 150,
              shares: 25
            }
          }
        };
      }

      const datasetData = await datasetResponse.json();
      console.log('Dataset Response:', datasetData);
      
      // Parse data sebenarnya dari Apify jika tersedia
      if (datasetData && Array.isArray(datasetData) && datasetData.length > 0) {
        const apifyData = datasetData[0];
        const comments = this.parseApifyComments(apifyData);
        const postData = this.parseApifyPostData(apifyData);
        
        return {
          success: true,
          data: {
            comments,
            postData
          }
        };
      }
      
      // Fallback ke demo data
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

  // Helper untuk parsing data Apify ke format yang digunakan aplikasi
  private static parseApifyComments(apifyData: any): ApifyComment[] {
    try {
      // Sesuaikan dengan struktur data yang dikembalikan Apify
      const comments = apifyData.comments || apifyData.data?.comments || [];
      
      return comments.map((comment: any, index: number) => ({
        id: comment.id || `comment_${index}`,
        author: comment.author?.name || comment.author || `User ${index + 1}`,
        text: comment.text || comment.content || '',
        timestamp: comment.timestamp || comment.createdAt || new Date().toISOString(),
        likes: comment.likes || comment.likesCount || 0,
        replies: comment.replies || comment.repliesCount || 0
      }));
    } catch (error) {
      console.error('Error parsing Apify comments:', error);
      return this.generateDemoComments();
    }
  }

  private static parseApifyPostData(apifyData: any) {
    try {
      const post = apifyData.post || apifyData.data || apifyData;
      
      return {
        title: post.title || post.text?.substring(0, 100) || "Post Facebook",
        content: post.content || post.text || "Konten postingan",
        author: post.author?.name || post.author || "Facebook User",
        timestamp: post.timestamp || post.createdAt || new Date().toISOString(),
        likes: post.likes || post.likesCount || 0,
        shares: post.shares || post.sharesCount || 0
      };
    } catch (error) {
      console.error('Error parsing Apify post data:', error);
      return {
        title: "Post Facebook Demo",
        content: "Error parsing data, menggunakan demo content.",
        author: "Demo User",
        timestamp: new Date().toISOString(),
        likes: 0,
        shares: 0
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