interface ApifyComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes?: number;
  replies?: number;
  imageUrl?: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'link';
    url: string;
    description?: string;
  }>;
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

  static async scrapePost(facebookUrl: string, resultsLimit: number = 10): Promise<ApifyResponse> {
    try {
      console.log('Memulai scraping komentar dari Apify untuk URL:', facebookUrl);
      
      // Cek apakah ada API key tersimpan
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('Tidak ada API key Apify, menggunakan demo data');
        return this.getDemoResponse();
      }
      
      // Menggunakan endpoint API Apify yang benar
      const apiEndpoint = `https://api.apify.com/v2/acts/apify~facebook-comments-scraper/run-sync-get-dataset-items?token=${apiKey}`;
      
      const requestBody = {
        includeNestedComments: false,
        resultsLimit: resultsLimit,
        startUrls: [
          {
            url: facebookUrl,
            method: "GET"
          }
        ]
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      // Coba dengan CORS mode normal terlebih dahulu
      let response;
      try {
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      } catch (corsError) {
        console.warn('CORS error detected: Browser memblokir akses langsung ke Apify API');
        console.warn('Menggunakan demo data sebagai fallback');
        
        return this.getDemoResponse();
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        return {
          success: false,
          error: `API Error ${response.status}: ${errorText}`
        };
      }

      const responseData = await response.json();
      console.log('Raw API Response:', responseData);
      
      // Cek apakah response adalah array dengan data
      if (responseData && Array.isArray(responseData) && responseData.length > 0) {
        console.log('Processing Apify data...');
        
        // Ambil semua komentar dari response - setiap item adalah komentar
        const allComments: ApifyComment[] = [];
        let postInfo = {
          title: "Facebook Post",
          content: "",
          author: "Facebook User",
          timestamp: new Date().toISOString(),
          likes: 0,
          shares: 0
        };

        responseData.forEach((item, index) => {
          console.log(`Processing comment item ${index}:`, item);
          
          // Setiap item dalam array adalah komentar
          allComments.push({
            id: item.id || `comment_${index}`,
            author: item.profileName || item.author || `User ${index + 1}`,
            text: item.text || '',
            timestamp: item.date || item.timestamp || new Date().toISOString(),
            likes: parseInt(item.likesCount) || 0,
            replies: item.commentsCount || 0,
            imageUrl: item.imageUrl || item.image,
            attachments: item.attachments || (item.imageUrl ? [{
              type: 'image' as const,
              url: item.imageUrl,
              description: item.imageDescription || 'Gambar komentar'
            }] : undefined)
          });
          
          // Ambil info post dari item pertama (semua item memiliki postTitle yang sama)
          if (index === 0 && item.postTitle) {
            postInfo = {
              title: item.postTitle.substring(0, 100) || "Facebook Post",
              content: item.postTitle || "Post content",
              author: "Facebook Post Author",
              timestamp: item.date || new Date().toISOString(),
              likes: 0,
              shares: 0
            };
          }
        });

        console.log(`Total comments found: ${allComments.length}`);
        
        if (allComments.length > 0) {
          return {
            success: true,
            data: {
              comments: allComments,
              postData: postInfo
            }
          };
        }
      }
      
      // Jika tidak ada data atau format tidak sesuai
      console.warn('No valid data found in API response, using demo data');
      return {
        success: true,
        data: {
          comments: this.generateDemoComments(),
          postData: {
            title: "Demo - Post Facebook",
            content: "Data demo digunakan karena tidak ada data dari API.",
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

  // Helper method untuk mengembalikan demo response
  private static getDemoResponse(): ApifyResponse {
    return {
      success: true,
      data: {
        comments: this.generateDemoComments(),
        postData: {
          title: "Demo - Post Facebook",
          content: "Data demo digunakan karena masalah CORS atau tidak ada API key.",
          author: "Demo User",
          timestamp: new Date().toISOString(),
          likes: 150,
          shares: 25
        }
      }
    };
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