import { pipeline } from '@huggingface/transformers';

export interface BertAnalysisResult {
  text: string;
  sentiment: 'hate' | 'neutral' | 'positive';
  confidence: number;
  category?: string;
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

  async initializeClassifier() {
    if (this.classifier || this.isLoading) return;
    
    this.isLoading = true;
    try {
      // Using a multilingual BERT model that supports Indonesian
      this.classifier = await pipeline(
        'text-classification',
        'unitary/toxic-bert',
        { device: 'webgpu' }
      );
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU');
      this.classifier = await pipeline(
        'text-classification',
        'unitary/toxic-bert'
      );
    }
    this.isLoading = false;
  }

  async analyzeHateSpeech(comments: string[]): Promise<BertAnalysisResult[]> {
    await this.initializeClassifier();
    
    const results: BertAnalysisResult[] = [];
    
    for (const comment of comments) {
      try {
        const result = await this.classifier(comment);
        const isHate = result[0]?.label === 'TOXIC' && result[0]?.score > 0.7;
        
        results.push({
          text: comment,
          sentiment: isHate ? 'hate' : (result[0]?.score > 0.3 ? 'neutral' : 'positive'),
          confidence: result[0]?.score || 0,
          category: isHate ? this.categorizeHateSpeech(comment) : undefined
        });
      } catch (error) {
        // Fallback to keyword-based analysis
        results.push({
          text: comment,
          sentiment: this.keywordBasedAnalysis(comment),
          confidence: 0.5
        });
      }
    }
    
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
    // Simple keyword-based clustering (simplified LDA approach)
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
      comments,
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
}

export const bertService = new BertService();