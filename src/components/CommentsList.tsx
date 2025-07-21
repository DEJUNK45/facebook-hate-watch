import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Heart, Reply, AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes?: number;
  replies?: number;
}

interface AnalysisResult {
  comment: Comment;
  sentiment: 'hate' | 'neutral' | 'positive';
  category?: string;
  confidence: number;
}

interface CommentsListProps {
  analysisResults: AnalysisResult[];
}

export const CommentsList = ({ analysisResults }: CommentsListProps) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'hate':
        return <AlertTriangle className="h-4 w-4" />;
      case 'positive':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'hate':
        return 'destructive';
      case 'positive':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'hate':
        return 'Ujaran Kebencian';
      case 'positive':
        return 'Positif';
      default:
        return 'Netral';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Analisis Komentar ({analysisResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysisResults.map((result, index) => (
            <div
              key={result.comment.id}
              className="border rounded-lg p-4 space-y-3 animate-fade-in hover:shadow-md transition-shadow"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header dengan avatar dan info user */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-medium">
                      {result.comment.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-sm">{result.comment.author}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(result.comment.timestamp), { 
                        addSuffix: true, 
                        locale: id 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getSentimentColor(result.sentiment)} className="flex items-center gap-1">
                    {getSentimentIcon(result.sentiment)}
                    {getSentimentLabel(result.sentiment)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(result.confidence * 100)}%
                  </Badge>
                </div>
              </div>

              {/* Konten komentar */}
              <div className="pl-11">
                <p className="text-sm text-foreground leading-relaxed">
                  {result.comment.text}
                </p>
                
                {/* Kategori ujaran kebencian jika ada */}
                {result.category && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-destructive border-destructive">
                      {result.category}
                    </Badge>
                  </div>
                )}

                {/* Stats komentar */}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {result.comment.likes && result.comment.likes > 0 && (
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {result.comment.likes}
                    </div>
                  )}
                  {result.comment.replies && result.comment.replies > 0 && (
                    <div className="flex items-center gap-1">
                      <Reply className="h-3 w-3" />
                      {result.comment.replies} balasan
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};