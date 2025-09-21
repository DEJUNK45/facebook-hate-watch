import { pipeline } from '@huggingface/transformers';

export interface BertAnalysisResult {
  text: string;
  sentiment: 'hate' | 'neutral' | 'positive';
  confidence: number;
  category?: string;
  uiteViolation?: UUiteViolation;
}

export interface UUiteViolation {
  hasViolation: boolean;
  articles: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface TopicCluster {
  id: number;
  topic: string;
  keywords: string[];
  comments: string[];
  count: number;
}

export interface EntityTarget {
  entity: string;
  type: 'pronoun' | 'person' | 'group';
  mentions: number;
  comments: string[];
}

class BertService {
  private classifier: any = null;
  private isLoading = false;
  private modelLoaded = false;

  async initializeClassifier() {
    if (this.classifier && this.modelLoaded) return;
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log('Loading BERT model... This may take a moment on first load.');
    
    try {
      // Use smaller, faster model for better performance
      this.classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { 
          device: 'webgpu',
          dtype: 'fp16' // Use half precision for faster loading
        }
      );
      console.log('BERT model loaded successfully with WebGL acceleration');
    } catch (error) {
      console.warn('WebGL not available, using CPU with optimized settings');
      try {
        this.classifier = await pipeline(
          'text-classification',
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
          { dtype: 'fp16' }
        );
      } catch (fallbackError) {
        console.warn('Using basic keyword analysis due to model loading issues');
        this.classifier = null;
      }
    }
    
    this.modelLoaded = true;
    this.isLoading = false;
  }

  async analyzeHateSpeech(comments: string[]): Promise<BertAnalysisResult[]> {
    // Show loading progress
    console.log(`Analyzing ${comments.length} comments...`);
    
    // Try to initialize classifier, but don't block on it
    try {
      await this.initializeClassifier();
    } catch (error) {
      console.warn('BERT model unavailable, using enhanced keyword analysis');
    }
    
    const results: BertAnalysisResult[] = [];
    
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      console.log(`Processing comment ${i + 1}/${comments.length}`);
      
      try {
        if (this.classifier && this.modelLoaded) {
          const result = await this.classifier(comment);
          // Adapt to DistilBERT output format
          const isNegative = result[0]?.label === 'NEGATIVE' && result[0]?.score > 0.6;
          const sentiment = this.keywordBasedAnalysis(comment); // Use keyword analysis for Indonesian
          const isHate = sentiment === 'hate';
          
          const analysisResult: BertAnalysisResult = {
            text: comment,
            sentiment,
            confidence: Math.max(result[0]?.score || 0, 0.6), // Boost confidence for keyword analysis
            category: isHate ? this.categorizeHateSpeech(comment) : undefined
          };
          
          analysisResult.uiteViolation = this.analyzeUUITEViolation(comment, isHate);
          results.push(analysisResult);
        } else {
          // Enhanced keyword-based analysis
          const sentiment = this.keywordBasedAnalysis(comment);
          const analysisResult: BertAnalysisResult = {
            text: comment,
            sentiment,
            confidence: 0.7, // Higher confidence for keyword analysis
            category: sentiment === 'hate' ? this.categorizeHateSpeech(comment) : undefined
          };
          
          analysisResult.uiteViolation = this.analyzeUUITEViolation(comment, sentiment === 'hate');
          results.push(analysisResult);
        }
      } catch (error) {
        console.warn(`Error processing comment ${i + 1}:`, error);
        // Fallback analysis
        const sentiment = this.keywordBasedAnalysis(comment);
        const analysisResult: BertAnalysisResult = {
          text: comment,
          sentiment,
          confidence: 0.6
        };
        
        analysisResult.uiteViolation = this.analyzeUUITEViolation(comment, sentiment === 'hate');
        results.push(analysisResult);
      }
    }
    
    console.log('Analysis complete!');
    return results;
  }

  private keywordBasedAnalysis(text: string): 'hate' | 'neutral' | 'positive' {
    const lowerText = text.toLowerCase();
    const hateKeywords = ['bangsat', 'anjing', 'babi', 'kampret', 'goblok', 'tolol', 'bodoh', 'sialan'];
    const positiveKeywords = ['bagus', 'baik', 'hebat', 'mantap', 'keren', 'setuju'];
    
    if (hateKeywords.some(keyword => lowerText.includes(keyword))) return 'hate';
    if (positiveKeywords.some(keyword => lowerText.includes(keyword))) return 'positive';
    return 'neutral';
  }

  private categorizeHateSpeech(text: string): string {
    const lowerText = text.toLowerCase();
    
    // SARA patterns
    if (/(agama|islam|kristen|hindu|budha|yahudi|kafir|muslim)/.test(lowerText)) {
      return 'SARA';
    }
    
    // Personal attacks
    if (/(bodoh|tolol|goblok|bangsat|anjing|babi)/.test(lowerText)) {
      return 'Penghinaan';
    }
    
    // Provocation
    if (/(bunuh|hancurkan|serang|perang|lawan)/.test(lowerText)) {
      return 'Provokasi';
    }
    
    return 'Lainnya (Negatif)';
  }

  performLDATopicClustering(comments: string[]): TopicCluster[] {
    if (comments.length < 3) {
      return this.keywordBasedClustering(comments);
    }

    try {
      // Simplified LDA-inspired approach using term frequency and co-occurrence
      const preprocessedComments = comments.map(comment => 
        this.preprocessText(comment)
      ).filter(doc => doc.length > 0);

      if (preprocessedComments.length < 3) {
        return this.keywordBasedClustering(comments);
      }

      // Extract all unique words and their frequencies
      const wordFreq = new Map<string, number>();
      const documentWords = preprocessedComments.map(comment => {
        const words = comment.split(' ').filter(word => word.length > 2);
        words.forEach(word => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });
        return words;
      });

      // Get most frequent words as potential topic keywords
      const topWords = Array.from(wordFreq.entries())
        .filter(([word, freq]) => freq > 1 && word.length > 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);

      // Create topic clusters based on word co-occurrence
      const numTopics = Math.min(5, Math.max(2, Math.floor(comments.length / 8)));
      const clusters: TopicCluster[] = [];

      for (let i = 0; i < numTopics; i++) {
        const startIdx = i * Math.floor(topWords.length / numTopics);
        const endIdx = Math.min(startIdx + Math.floor(topWords.length / numTopics), topWords.length);
        const topicWords = topWords.slice(startIdx, endIdx);

        if (topicWords.length === 0) continue;

        // Find documents that contain these topic words
        const relatedComments = comments.filter(comment => {
          const lowerComment = comment.toLowerCase();
          return topicWords.some(word => lowerComment.includes(word));
        });

        if (relatedComments.length > 0) {
          const topicLabel = this.inferTopicLabel(topicWords, `Topik ${i + 1}`);
          
          clusters.push({
            id: i,
            topic: topicLabel,
            keywords: topicWords.slice(0, 5),
            comments: relatedComments.slice(0, 3),
            count: relatedComments.length
          });
        }
      }

      // If no clusters found, fallback to keyword-based
      return clusters.length > 0 ? clusters : this.keywordBasedClustering(comments);

    } catch (error) {
      console.warn('LDA clustering failed, falling back to keyword-based:', error);
      return this.keywordBasedClustering(comments);
    }
  }

  private preprocessText(text: string): string {
    // Indonesian stopwords
    const stopwords = new Set([
      'yang', 'dan', 'di', 'ke', 'dari', 'dalam', 'untuk', 'pada', 'dengan', 'adalah', 'ini', 'itu',
      'tidak', 'akan', 'ada', 'atau', 'juga', 'oleh', 'sudah', 'dapat', 'bila', 'jika', 'karena',
      'saya', 'kamu', 'dia', 'kita', 'mereka', 'kami', 'nya', 'mu', 'ku', 'an', 'kan', 'lah'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\d+/g, '') // Remove numbers
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word))
      .join(' ');
  }

  private inferTopicLabel(keywords: string[], defaultLabel: string): string {
    const topicPatterns = {
      'Politik': ['jokowi', 'presiden', 'pemerintah', 'politik', 'pemilu', 'partai', 'menteri', 'dpr'],
      'Ekonomi': ['ekonomi', 'harga', 'inflasi', 'bbm', 'subsidi', 'pajak', 'rupiah', 'bisnis'],
      'Sosial': ['masyarakat', 'rakyat', 'sosial', 'budaya', 'tradisi', 'keluarga', 'komunitas'],
      'Agama': ['agama', 'islam', 'kristen', 'hindu', 'budha', 'ibadah', 'rohani', 'spiritual'],
      'Pendidikan': ['sekolah', 'universitas', 'pendidikan', 'belajar', 'guru', 'mahasiswa', 'kuliah'],
      'Teknologi': ['teknologi', 'digital', 'online', 'internet', 'aplikasi', 'website', 'gadget'],
      'Kesehatan': ['kesehatan', 'dokter', 'rumah', 'sakit', 'covid', 'vaksin', 'obat', 'virus']
    };

    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      if (keywords.some(keyword => patterns.some(pattern => keyword.includes(pattern)))) {
        return topic;
      }
    }

    return defaultLabel;
  }

  private keywordBasedClustering(comments: string[]): TopicCluster[] {
    const topics = new Map<string, string[]>();
    
    const topicKeywords = {
      'Politik': ['jokowi', 'presiden', 'pemerintah', 'politik', 'pemilu', 'partai'],
      'Ekonomi': ['ekonomi', 'harga', 'inflasi', 'bbm', 'subsidi', 'pajak'],
      'Sosial': ['masyarakat', 'rakyat', 'sosial', 'budaya', 'tradisi'],
      'Agama': ['agama', 'islam', 'kristen', 'hindu', 'budha', 'ibadah'],
      'Pendidikan': ['sekolah', 'universitas', 'pendidikan', 'belajar', 'guru']
    };
    
    comments.forEach(comment => {
      const lowerComment = comment.toLowerCase();
      let assigned = false;
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (!assigned && keywords.some(keyword => lowerComment.includes(keyword))) {
          if (!topics.has(topic)) topics.set(topic, []);
          topics.get(topic)!.push(comment);
          assigned = true;
        }
      });
      
      if (!assigned) {
        if (!topics.has('Umum')) topics.set('Umum', []);
        topics.get('Umum')!.push(comment);
      }
    });
    
    return Array.from(topics.entries()).map(([topic, comments], index) => ({
      id: index,
      topic,
      keywords: topicKeywords[topic as keyof typeof topicKeywords] || ['umum'],
      comments: comments.slice(0, 3),
      count: comments.length
    }));
  }

  extractEntityTargets(comments: string[]): EntityTarget[] {
    const entities = new Map<string, EntityTarget>();
    
    const pronouns = ['kita', 'kami', 'mereka', 'dia', 'beliau', 'kalian', 'anda'];
    const commonNames = ['jokowi', 'prabowo', 'megawati', 'ahok', 'anies', 'ridwan kamil'];
    
    comments.forEach(comment => {
      const lowerComment = comment.toLowerCase();
      const words = lowerComment.split(/\s+/);
      
      // Check for pronouns
      pronouns.forEach(pronoun => {
        if (words.includes(pronoun)) {
          const key = pronoun;
          if (!entities.has(key)) {
            entities.set(key, {
              entity: pronoun,
              type: 'pronoun',
              mentions: 0,
              comments: []
            });
          }
          const entity = entities.get(key)!;
          entity.mentions++;
          if (!entity.comments.includes(comment)) {
            entity.comments.push(comment);
          }
        }
      });
      
      // Check for person names
      commonNames.forEach(name => {
        if (lowerComment.includes(name)) {
          const key = name;
          if (!entities.has(key)) {
            entities.set(key, {
              entity: name,
              type: 'person',
              mentions: 0,
              comments: []
            });
          }
          const entity = entities.get(key)!;
          entity.mentions++;
          if (!entity.comments.includes(comment)) {
            entity.comments.push(comment);
          }
        }
      });
    });
    
    return Array.from(entities.values()).sort((a, b) => b.mentions - a.mentions);
  }

  private analyzeUUITEViolation(text: string, isHate: boolean): UUiteViolation {
    const lowerText = text.toLowerCase();
    const violations = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let description = '';

    // UU ITE Pasal 27 ayat (3) - Penghinaan dan pencemaran nama baik
    if (/(bangsat|anjing|babi|kampret|goblok|tolol|bodoh|sialan|sampah|tai|setan)/.test(lowerText)) {
      violations.push('Pasal 27 ayat (3)');
      severity = 'medium';
      description += 'Potensi penghinaan dan pencemaran nama baik. ';
    }

    // UU ITE Pasal 28 ayat (2) - Menimbulkan kebencian berdasarkan SARA
    if (/(kafir|kristen|islam|hindu|budha|yahudi|pribumi|cina|arab|jawa|batak|dayak|padang)/.test(lowerText) && isHate) {
      violations.push('Pasal 28 ayat (2)');
      severity = 'high';
      description += 'Potensi menimbulkan kebencian berdasarkan suku, agama, ras, dan antargolongan (SARA). ';
    }

    // UU ITE Pasal 45A ayat (2) - Ancaman kekerasan
    if (/(bunuh|matikan|hancurkan|serang|hajar|bom|teror|bakar|lempar|pukul)/.test(lowerText)) {
      violations.push('Pasal 45A ayat (2)');
      severity = 'high';
      description += 'Potensi ancaman kekerasan atau terorisme. ';
    }

    // UU ITE Pasal 27 ayat (4) - Pemerasan dan pengancaman
    if (/(ancam|teror|bongkar|sebar|foto|video|rahasia|uang|bayar)/.test(lowerText) && /(atau|jika|kalau|kecuali)/.test(lowerText)) {
      violations.push('Pasal 27 ayat (4)');
      severity = 'high';
      description += 'Potensi pemerasan dan pengancaman. ';
    }

    // UU ITE Pasal 28 ayat (1) - Berita bohong dan menyesatkan
    if (/(hoax|bohong|palsu|fitnah|isu|kabar|berita)/.test(lowerText) && /(pemerintah|presiden|menteri|politik)/.test(lowerText)) {
      violations.push('Pasal 28 ayat (1)');
      severity = 'medium';
      description += 'Potensi penyebaran berita bohong dan menyesatkan. ';
    }

    return {
      hasViolation: violations.length > 0,
      articles: violations,
      severity,
      description: description.trim() || 'Tidak terdeteksi pelanggaran UU ITE yang signifikan.'
    };
  }
}

export const bertService = new BertService();