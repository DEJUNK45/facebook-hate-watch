import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Heart, Reply, AlertTriangle, CheckCircle, Minus, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes?: number;
  replies?: number;
  parentId?: string;
}

interface AnalysisResult {
  comment: Comment;
  sentiment: 'hate' | 'neutral' | 'positive';
  category?: string;
  confidence: number;
}

interface ThreadedCommentsListProps {
  analysisResults: AnalysisResult[];
}

export const ThreadedCommentsList = ({ analysisResults }: ThreadedCommentsListProps) => {
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

  // Organisir komentar dalam struktur parent-child
  const organizeThreads = () => {
    const parentComments: AnalysisResult[] = [];
    const childrenMap: Record<string, AnalysisResult[]> = {};

    // Pisahkan parent dan child comments
    analysisResults.forEach(result => {
      if (!result.comment.parentId) {
        parentComments.push(result);
      } else {
        if (!childrenMap[result.comment.parentId]) {
          childrenMap[result.comment.parentId] = [];
        }
        childrenMap[result.comment.parentId].push(result);
      }
    });

    return { parentComments, childrenMap };
  };

  const { parentComments, childrenMap } = organizeThreads();

  const renderComment = (result: AnalysisResult, depth: number = 0) => {
    const children = childrenMap[result.comment.id] || [];
    const hasReplies = children.length > 0;

    return (
      <div key={result.comment.id} className="relative">
        {/* Vertical line for thread connection */}
        {depth > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-border" 
            style={{ left: `${(depth - 1) * 24 + 12}px` }}
          />
        )}
        
        <div
          className={`border rounded-lg p-4 space-y-3 animate-fade-in hover:shadow-md transition-shadow ${
            depth > 0 ? 'ml-6 mt-3' : ''
          }`}
          style={{ 
            animationDelay: `${analysisResults.indexOf(result) * 50}ms`,
            marginLeft: depth > 0 ? `${depth * 24}px` : '0'
          }}
        >
          {/* Header dengan avatar dan info user */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {depth > 0 && (
                <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
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
          <div className={depth > 0 ? 'pl-7' : 'pl-11'}>
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
              {hasReplies && (
                <div className="flex items-center gap-1">
                  <Reply className="h-3 w-3" />
                  {children.length} balasan
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Render child comments recursively */}
        {hasReplies && (
          <div className="mt-2">
            {children.map(child => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Thread Komentar ({analysisResults.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Komentar ditampilkan dalam struktur thread dengan garis penghubung parent-child
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {parentComments.map(result => renderComment(result, 0))}
          
          {parentComments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Tidak ada komentar untuk ditampilkan
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
