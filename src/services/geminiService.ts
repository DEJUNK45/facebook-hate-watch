export interface GeminiAnalysisResult {
  text: string;
  sentiment: 'hate' | 'neutral' | 'positive';
  confidence: number;
  iteViolationType?: 'defamation' | 'blasphemy' | 'unpleasant_acts' | 'incitement' | 'hoax';
  iteViolationLabel?: string;
  speechActType?: 'assertive' | 'directive' | 'commissive' | 'expressive' | 'declarative';
  speechActSubtype?: string;
  category?: string;
  uiteViolation?: {
    hasViolation: boolean;
    articles: string[];
    severity: 'low' | 'medium' | 'high';
    description: string;
  };
}

class GeminiService {
  private apiKey: string = '';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async analyzeComments(comments: string[]): Promise<GeminiAnalysisResult[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API Key belum diatur');
    }

    const results: GeminiAnalysisResult[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < comments.length; i += batchSize) {
      const batch = comments.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(comment => this.analyzeSingleComment(comment))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async analyzeSingleComment(comment: string): Promise<GeminiAnalysisResult> {
    const prompt = `Analisis komentar media sosial berikut dalam Bahasa Indonesia dengan detail:

KOMENTAR: "${comment}"

Berikan analisis dalam format JSON dengan field berikut:
1. sentiment: "hate" | "neutral" | "positive"
2. confidence: angka 0-1
3. iteViolationType: salah satu dari "defamation" (Pencemaran Nama Baik), "blasphemy" (Penistaan), "unpleasant_acts" (Perbuatan Tidak Menyenangkan), "incitement" (Menghasut), "hoax" (Penyebaran Berita Bohong), atau null jika tidak ada
4. iteViolationLabel: label Indonesia dari tipe pelanggaran
5. speechActType: salah satu dari "assertive", "directive", "commissive", "expressive", "declarative"
6. speechActSubtype: jika agresif, tentukan subtipe seperti "Tuduhan/Fitnah", "Ancaman/Perintah Kasar", "Janji Balas Dendam", "Penghinaan/Ejekan", "Deklarasi Diskriminatif"
7. category: kategori hate speech seperti "SARA", "Penghinaan", "Provokasi", atau null
8. uiteViolation: {
     hasViolation: boolean,
     articles: array pasal UU ITE yang relevan,
     severity: "low" | "medium" | "high",
     description: penjelasan pelanggaran
   }

DEFINISI TINDAK TUTUR:
- Asertif: Menyatakan fakta/pendapat (Agresif: Tuduhan/Fitnah)
- Direktif: Memerintah/meminta (Agresif: Ancaman/Perintah Kasar)
- Komisif: Berjanji/berkomitmen (Agresif: Janji Balas Dendam)
- Ekspresif: Mengekspresikan perasaan (Agresif: Penghinaan/Ejekan)
- Deklaratif: Menyatakan status baru (Agresif: Deklarasi Diskriminatif)

Jawab HANYA dengan JSON, tanpa penjelasan tambahan.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No response from Gemini');
      }

      // Extract JSON from response (it might be wrapped in ```json```)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      const analysis = JSON.parse(jsonText);

      return {
        text: comment,
        sentiment: analysis.sentiment || 'neutral',
        confidence: analysis.confidence || 0.7,
        iteViolationType: analysis.iteViolationType,
        iteViolationLabel: analysis.iteViolationLabel,
        speechActType: analysis.speechActType,
        speechActSubtype: analysis.speechActSubtype,
        category: analysis.category,
        uiteViolation: analysis.uiteViolation
      };

    } catch (error) {
      console.error('Error analyzing comment with Gemini:', error);
      // Return fallback result
      return {
        text: comment,
        sentiment: 'neutral',
        confidence: 0.5,
      };
    }
  }
}

export const geminiService = new GeminiService();
