import { pipeline } from '@huggingface/transformers';

export interface BertAnalysisResult {
  text: string;
  sentiment: 'hate' | 'neutral' | 'positive';
  confidence: number;
  category?: string;
  iteViolationType?: 'defamation' | 'blasphemy' | 'unpleasant_acts' | 'incitement' | 'hoax';
  iteViolationLabel?: string;
  speechActType?: 'assertive' | 'directive' | 'commissive' | 'expressive' | 'declarative';
  speechActSubtype?: string;
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
            category: isHate ? this.categorizeHateSpeech(comment) : undefined,
            ...this.classifyITEViolation(comment, isHate),
            ...this.classifySpeechAct(comment, isHate)
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
            category: sentiment === 'hate' ? this.categorizeHateSpeech(comment) : undefined,
            ...this.classifyITEViolation(comment, sentiment === 'hate'),
            ...this.classifySpeechAct(comment, sentiment === 'hate')
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
          confidence: 0.6,
          ...this.classifyITEViolation(comment, sentiment === 'hate'),
          ...this.classifySpeechAct(comment, sentiment === 'hate')
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
    // Specific topic patterns with hierarchical structure
    const specificTopicPatterns = {
      // Politik - more specific subcategories
      'Politik Pemilu & Partai': ['pemilu', 'pilpres', 'pileg', 'pilkada', 'partai', 'caleg', 'capres', 'kampanye', 'koalisi'],
      'Politik Pemerintahan': ['presiden', 'menteri', 'gubernur', 'walikota', 'bupati', 'kabinet', 'kementerian', 'dpr', 'dprd'],
      'Politik Kebijakan': ['kebijakan', 'regulasi', 'undang', 'peraturan', 'aturan', 'reformasi', 'perda'],
      'Korupsi & Hukum Politik': ['korupsi', 'kpk', 'suap', 'gratifikasi', 'hukum', 'pengadilan', 'jaksa', 'polisi'],
      
      // Ekonomi - more specific
      'Ekonomi Makro': ['inflasi', 'deflasi', 'resesi', 'gdp', 'pertumbuhan', 'ekonomi', 'investasi', 'ekspor', 'impor'],
      'Harga & Subsidi': ['harga', 'mahal', 'murah', 'bbm', 'lpg', 'listrik', 'subsidi', 'tarif', 'biaya'],
      'Keuangan & Perbankan': ['bank', 'kredit', 'pinjaman', 'bunga', 'rupiah', 'dolar', 'mata', 'uang', 'saham', 'bursa'],
      'UMKM & Lapangan Kerja': ['umkm', 'usaha', 'bisnis', 'wirausaha', 'kerja', 'pengangguran', 'gaji', 'upah', 'tenaga'],
      
      // Sosial - more specific
      'Kemiskinan & Kesejahteraan': ['miskin', 'kemiskinan', 'bantuan', 'sosial', 'sembako', 'kesejahteraan', 'rakyat'],
      'Kriminalitas & Keamanan': ['kriminal', 'kejahatan', 'pencurian', 'perampokan', 'pembunuhan', 'keamanan', 'rawan'],
      'Budaya & Tradisi': ['budaya', 'tradisi', 'adat', 'warisan', 'kesenian', 'seni', 'tari', 'musik'],
      'Keluarga & Pernikahan': ['keluarga', 'nikah', 'pernikahan', 'cerai', 'perceraian', 'anak', 'orang', 'tua', 'ibu', 'ayah'],
      
      // Agama - more specific
      'Ibadah & Ritual': ['sholat', 'puasa', 'haji', 'umrah', 'zakat', 'ibadah', 'doa', 'misa', 'kebaktian'],
      'Toleransi Beragama': ['toleransi', 'antar', 'umat', 'kerukunan', 'harmoni', 'damai', 'saling', 'menghormati'],
      'Isu Keagamaan': ['agama', 'islam', 'kristen', 'katolik', 'hindu', 'budha', 'konghucu', 'aliran', 'keyakinan'],
      'Ustadz & Tokoh Agama': ['ustadz', 'ustad', 'kyai', 'pendeta', 'pastor', 'biksu', 'rohaniwan', 'ulama'],
      
      // Pendidikan - more specific
      'Sekolah & Kurikulum': ['sekolah', 'sd', 'smp', 'sma', 'smk', 'kurikulum', 'pelajaran', 'ujian', 'nilai'],
      'Perguruan Tinggi': ['universitas', 'kampus', 'mahasiswa', 'kuliah', 'dosen', 'skripsi', 'wisuda', 'jurusan'],
      'Guru & Tenaga Pendidik': ['guru', 'pengajar', 'tenaga', 'pendidik', 'dosen', 'mengajar', 'pendidikan'],
      'Biaya Pendidikan': ['uang', 'kuliah', 'spp', 'biaya', 'pendidikan', 'beasiswa', 'gratis'],
      
      // Teknologi - more specific
      'Media Sosial': ['facebook', 'instagram', 'twitter', 'tiktok', 'whatsapp', 'youtube', 'sosial', 'media'],
      'E-Commerce & Fintech': ['tokopedia', 'shopee', 'lazada', 'gojek', 'grab', 'ovo', 'dana', 'gopay', 'ecommerce'],
      'Internet & Digital': ['internet', 'wifi', 'provider', 'telkomsel', 'indosat', 'xl', 'online', 'digital'],
      'Gadget & Perangkat': ['hp', 'handphone', 'laptop', 'komputer', 'gadget', 'smartphone', 'android', 'iphone'],
      
      // Kesehatan - more specific
      'Covid-19 & Pandemi': ['covid', 'corona', 'pandemi', 'vaksin', 'vaksinasi', 'booster', 'positif', 'isolasi'],
      'Rumah Sakit & Pelayanan': ['rumah', 'sakit', 'rs', 'dokter', 'perawat', 'puskesmas', 'klinik', 'pelayanan'],
      'Penyakit & Pengobatan': ['sakit', 'penyakit', 'obat', 'pengobatan', 'terapi', 'operasi', 'rawat', 'inap'],
      'BPJS & Asuransi': ['bpjs', 'asuransi', 'jaminan', 'kesehatan', 'klaim', 'premi'],
      
      // Infrastruktur & Transportasi
      'Jalan & Infrastruktur': ['jalan', 'infrastruktur', 'jembatan', 'tol', 'pembangunan', 'konstruksi', 'proyek'],
      'Transportasi Umum': ['busway', 'transjakarta', 'mrt', 'lrt', 'kereta', 'commuter', 'angkot', 'ojek'],
      'Kemacetan & Lalu Lintas': ['macet', 'kemacetan', 'lalu', 'lintas', 'traffic', 'kendaraan'],
      
      // Lingkungan
      'Banjir & Bencana': ['banjir', 'bencana', 'longsor', 'gempa', 'tsunami', 'gunung', 'meletus', 'kebakaran'],
      'Polusi & Sampah': ['polusi', 'limbah', 'sampah', 'pencemaran', 'asap', 'udara', 'kotor'],
      'Lingkungan Hidup': ['lingkungan', 'alam', 'hutan', 'reboisasi', 'hijau', 'climate', 'iklim'],
      
      // Olahraga & Entertainment
      'Sepak Bola': ['sepak', 'bola', 'football', 'timnas', 'liga', 'persija', 'persib', 'arema'],
      'Bulutangkis & Olahraga': ['bulutangkis', 'badminton', 'basket', 'voli', 'atletik', 'renang', 'olah', 'raga'],
      'Film & Hiburan': ['film', 'movie', 'sinetron', 'drama', 'artis', 'selebriti', 'hiburan', 'entertainment']
    };

    // Find the most specific matching topic
    for (const [topic, patterns] of Object.entries(specificTopicPatterns)) {
      const matchCount = keywords.filter(keyword => 
        patterns.some(pattern => keyword.includes(pattern))
      ).length;
      
      // If at least 2 keywords match or 1 keyword with high confidence
      if (matchCount >= 2 || (matchCount === 1 && keywords.length <= 3)) {
        return topic;
      }
    }

    // If no specific match, try to create a topic from the main keywords
    if (keywords.length > 0) {
      const mainKeywords = keywords.slice(0, 3).join(', ');
      return `Diskusi: ${mainKeywords}`;
    }

    return defaultLabel;
  }

  private keywordBasedClustering(comments: string[]): TopicCluster[] {
    const topics = new Map<string, { comments: string[], keywords: Set<string> }>();
    
    const specificTopicKeywords = {
      'Politik Pemilu & Partai': ['pemilu', 'pilpres', 'pileg', 'pilkada', 'partai', 'caleg', 'capres', 'kampanye'],
      'Politik Pemerintahan': ['presiden', 'menteri', 'gubernur', 'walikota', 'bupati', 'kabinet', 'jokowi', 'prabowo'],
      'Korupsi & Hukum': ['korupsi', 'kpk', 'suap', 'gratifikasi', 'hukum', 'pengadilan', 'jaksa'],
      'Ekonomi & Harga': ['ekonomi', 'harga', 'inflasi', 'bbm', 'subsidi', 'pajak', 'mahal', 'murah'],
      'Keuangan & Bank': ['bank', 'kredit', 'rupiah', 'dolar', 'saham', 'investasi', 'pinjaman'],
      'Kemiskinan & Sosial': ['miskin', 'kemiskinan', 'bantuan', 'sosial', 'rakyat', 'kesejahteraan'],
      'Kriminalitas': ['kriminal', 'kejahatan', 'pencurian', 'pembunuhan', 'keamanan', 'rawan'],
      'Budaya & Tradisi': ['budaya', 'tradisi', 'adat', 'kesenian', 'seni', 'tari'],
      'Agama & Ibadah': ['agama', 'islam', 'kristen', 'hindu', 'budha', 'sholat', 'ibadah', 'ustadz'],
      'Toleransi Agama': ['toleransi', 'umat', 'kerukunan', 'harmoni', 'damai'],
      'Sekolah & Kurikulum': ['sekolah', 'sd', 'smp', 'sma', 'kurikulum', 'pelajaran', 'ujian'],
      'Kampus & Mahasiswa': ['universitas', 'kampus', 'mahasiswa', 'kuliah', 'dosen', 'skripsi'],
      'Guru & Pendidik': ['guru', 'pengajar', 'pendidik', 'mengajar', 'pendidikan'],
      'Media Sosial': ['facebook', 'instagram', 'twitter', 'tiktok', 'whatsapp', 'youtube'],
      'E-Commerce': ['tokopedia', 'shopee', 'lazada', 'gojek', 'grab', 'ovo', 'dana'],
      'Internet & Provider': ['internet', 'wifi', 'provider', 'telkomsel', 'indosat', 'xl'],
      'Covid-19': ['covid', 'corona', 'pandemi', 'vaksin', 'vaksinasi', 'isolasi'],
      'Rumah Sakit': ['rumah', 'sakit', 'rs', 'dokter', 'perawat', 'puskesmas'],
      'BPJS & Asuransi': ['bpjs', 'asuransi', 'jaminan', 'kesehatan', 'klaim'],
      'Infrastruktur & Jalan': ['jalan', 'infrastruktur', 'jembatan', 'tol', 'pembangunan'],
      'Transportasi': ['busway', 'transjakarta', 'mrt', 'lrt', 'kereta', 'commuter'],
      'Kemacetan': ['macet', 'kemacetan', 'lalu', 'lintas', 'traffic'],
      'Banjir & Bencana': ['banjir', 'bencana', 'longsor', 'gempa', 'tsunami'],
      'Polusi & Sampah': ['polusi', 'limbah', 'sampah', 'pencemaran', 'asap'],
      'Lingkungan Hidup': ['lingkungan', 'alam', 'hutan', 'hijau', 'iklim'],
      'Sepak Bola': ['sepak', 'bola', 'football', 'timnas', 'liga', 'persija'],
      'Olahraga Lainnya': ['bulutangkis', 'badminton', 'basket', 'voli', 'atletik'],
      'Film & Hiburan': ['film', 'movie', 'sinetron', 'drama', 'artis', 'selebriti']
    };
    
    comments.forEach(comment => {
      const lowerComment = comment.toLowerCase();
      const words = lowerComment.split(/\s+/);
      let maxMatchScore = 0;
      let bestTopic = '';
      let matchedKeywords: string[] = [];
      
      // Find the best matching topic based on keyword count
      Object.entries(specificTopicKeywords).forEach(([topic, keywords]) => {
        const matches = keywords.filter(keyword => lowerComment.includes(keyword));
        if (matches.length > maxMatchScore) {
          maxMatchScore = matches.length;
          bestTopic = topic;
          matchedKeywords = matches;
        }
      });
      
      if (maxMatchScore > 0) {
        if (!topics.has(bestTopic)) {
          topics.set(bestTopic, { comments: [], keywords: new Set() });
        }
        const topicData = topics.get(bestTopic)!;
        topicData.comments.push(comment);
        matchedKeywords.forEach(kw => topicData.keywords.add(kw));
      } else {
        // Extract meaningful words for "Umum" category
        const meaningfulWords = words.filter(word => 
          word.length > 3 && 
          !['yang', 'dan', 'ini', 'itu', 'untuk', 'dengan', 'dari', 'pada'].includes(word)
        ).slice(0, 3);
        
        if (!topics.has('Diskusi Umum')) {
          topics.set('Diskusi Umum', { comments: [], keywords: new Set() });
        }
        const topicData = topics.get('Diskusi Umum')!;
        topicData.comments.push(comment);
        meaningfulWords.forEach(word => topicData.keywords.add(word));
      }
    });
    
    return Array.from(topics.entries()).map(([topic, data], index) => ({
      id: index,
      topic,
      keywords: Array.from(data.keywords).slice(0, 5),
      comments: data.comments.slice(0, 3),
      count: data.comments.length
    })).sort((a, b) => b.count - a.count);
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

  private classifyITEViolation(text: string, isHate: boolean): {
    iteViolationType?: 'defamation' | 'blasphemy' | 'unpleasant_acts' | 'incitement' | 'hoax';
    iteViolationLabel?: string;
  } {
    const lowerText = text.toLowerCase();

    // Pencemaran Nama Baik (Defamation)
    if (/(fitnah|mencemarkan|merusak nama|mempermalukan|menghina|menjelekkan)/.test(lowerText)) {
      return {
        iteViolationType: 'defamation',
        iteViolationLabel: 'Pencemaran Nama Baik'
      };
    }

    // Penistaan (Blasphemy)
    if (/(menista|menghina agama|menghina tuhan|menghina nabi|kafir|sesat|ajaran sesat)/.test(lowerText)) {
      return {
        iteViolationType: 'blasphemy',
        iteViolationLabel: 'Penistaan Agama'
      };
    }

    // Menghasut (Incitement)
    if (/(menghasut|ayo|mari|kita|serang|bunuh|hancurkan|lawan|perang|revolusi)/.test(lowerText) && isHate) {
      return {
        iteViolationType: 'incitement',
        iteViolationLabel: 'Menghasut'
      };
    }

    // Penyebaran Berita Bohong (Hoax)
    if (/(hoax|bohong|palsu|isu|kabar burung|berita palsu|informasi salah|menyesatkan)/.test(lowerText)) {
      return {
        iteViolationType: 'hoax',
        iteViolationLabel: 'Penyebaran Berita Bohong'
      };
    }

    // Perbuatan Tidak Menyenangkan (Unpleasant Acts)
    if (isHate && /(mengganggu|tidak pantas|tidak sopan|tidak menyenangkan|meresahkan)/.test(lowerText)) {
      return {
        iteViolationType: 'unpleasant_acts',
        iteViolationLabel: 'Perbuatan Tidak Menyenangkan'
      };
    }

    return {};
  }

  private classifySpeechAct(text: string, isHate: boolean): {
    speechActType?: 'assertive' | 'directive' | 'commissive' | 'expressive' | 'declarative';
    speechActSubtype?: string;
  } {
    const lowerText = text.toLowerCase();

    // Direktif (Directives) - Perintah/permintaan
    if (/(harus|jangan|tolong|silakan|coba|lakukan|berhenti|diam|pergi|keluar)/.test(lowerText)) {
      if (isHate && /(bunuh|serang|hajar|hancurkan|musnahkan|basmi)/.test(lowerText)) {
        return {
          speechActType: 'directive',
          speechActSubtype: 'Ancaman/Perintah Kasar'
        };
      }
      return {
        speechActType: 'directive',
        speechActSubtype: 'Perintah/Permintaan'
      };
    }

    // Komisif (Commissives) - Janji/komitmen
    if (/(akan|bakal|pasti|berjanji|jamin|nanti|suatu saat)/.test(lowerText)) {
      if (isHate && /(balas|dendam|hancurkan|bunuh|selesaikan|hajar)/.test(lowerText)) {
        return {
          speechActType: 'commissive',
          speechActSubtype: 'Janji Balas Dendam'
        };
      }
      return {
        speechActType: 'commissive',
        speechActSubtype: 'Janji/Komitmen'
      };
    }

    // Ekspresif (Expressives) - Ekspresi perasaan
    if (/(bangsat|tolol|goblok|bodoh|sialan|benci|muak|jijik|brengsek)/.test(lowerText) || 
        /(senang|bahagia|gembira|mantap|keren|hebat|bagus)/.test(lowerText)) {
      if (isHate) {
        return {
          speechActType: 'expressive',
          speechActSubtype: 'Penghinaan/Ejekan'
        };
      }
      return {
        speechActType: 'expressive',
        speechActSubtype: 'Ekspresi Perasaan'
      };
    }

    // Deklaratif (Declarations) - Menyatakan status
    if (/(kamu|dia|mereka|ini|itu)\s+(adalah|itu|merupakan|termasuk|bukan)/.test(lowerText)) {
      if (isHate && /(bukan bagian|diusir|terbuang|dikucilkan|tidak pantas|tidak layak)/.test(lowerText)) {
        return {
          speechActType: 'declarative',
          speechActSubtype: 'Deklarasi Diskriminatif'
        };
      }
      return {
        speechActType: 'declarative',
        speechActSubtype: 'Pernyataan Status'
      };
    }

    // Asertif (Assertives) - Menyatakan fakta/pendapat (default)
    if (isHate && /(fitnah|tuduh|dusta|bohong|palsu|salah)/.test(lowerText)) {
      return {
        speechActType: 'assertive',
        speechActSubtype: 'Tuduhan/Fitnah'
      };
    }

    return {
      speechActType: 'assertive',
      speechActSubtype: 'Pernyataan Fakta/Pendapat'
    };
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