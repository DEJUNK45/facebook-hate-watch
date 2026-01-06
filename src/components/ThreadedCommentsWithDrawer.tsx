import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Heart, 
  Reply, 
  AlertTriangle, 
  CheckCircle, 
  Minus, 
  ChevronRight,
  MessagesSquare
} from 'lucide-react';
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
  imageUrl?: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'link';
    url: string;
    description?: string;
  }>;
}

interface AnalysisResult {
  comment: Comment;
  sentiment: 'hate' | 'neutral' | 'positive';
  category?: string;
  confidence: number;
}

interface ThreadedCommentsWithDrawerProps {
  analysisResults: AnalysisResult[];
  showImages?: boolean;
}

export const ThreadedCommentsWithDrawer = ({ 
  analysisResults, 
  showImages = true 
}: ThreadedCommentsWithDrawerProps) => {
  const [selectedParent, setSelectedParent] = useState<AnalysisResult | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const getSentimentColor = (sentiment: string): "destructive" | "default" | "secondary" | "outline" => {
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

  const openRepliesDrawer = (parent: AnalysisResult) => {
    setSelectedParent(parent);
    setIsDrawerOpen(true);
  };

  const renderCommentCard = (result: AnalysisResult, depth: number = 0, isInDrawer: boolean = false) => {
    const children = childrenMap[result.comment.id] || [];
    const hasReplies = children.length > 0;

    return (
      <div key={result.comment.id} className="relative">
        {/* Garis vertikal untuk thread connection */}
        {depth > 0 && (
          <>
            {/* Garis vertikal utama */}
            <div 
              className="absolute w-0.5 bg-primary/30" 
              style={{ 
                left: `${(depth - 1) * 28 + 16}px`,
                top: 0,
                bottom: hasReplies && isInDrawer ? 0 : 'auto',
                height: hasReplies && isInDrawer ? '100%' : '50%'
              }}
            />
            {/* Garis horizontal ke komentar */}
            <div 
              className="absolute h-0.5 bg-primary/30" 
              style={{ 
                left: `${(depth - 1) * 28 + 16}px`,
                top: '24px',
                width: '12px'
              }}
            />
          </>
        )}

        <div
          className={`border rounded-lg p-4 space-y-3 hover:shadow-md transition-all bg-card ${
            depth > 0 ? 'border-l-2 border-l-primary/40' : ''
          }`}
          style={{ 
            marginLeft: depth > 0 ? `${depth * 28}px` : '0',
            marginTop: depth > 0 ? '8px' : '0'
          }}
        >
          {/* Header dengan avatar dan info user */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {depth > 0 && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Reply className="h-3 w-3 text-primary" />
                </div>
              )}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {result.comment.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">{result.comment.author}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(result.comment.timestamp), { 
                    addSuffix: true, 
                    locale: id 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={getSentimentColor(result.sentiment)} className="flex items-center gap-1 text-xs">
                {getSentimentIcon(result.sentiment)}
                <span className="hidden sm:inline">{getSentimentLabel(result.sentiment)}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Math.round(result.confidence * 100)}%
              </Badge>
            </div>
          </div>

          {/* Konten komentar */}
          <div className={depth > 0 ? 'pl-5' : 'pl-11'}>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {result.comment.text}
            </p>
            
            {/* Gambar jika ada */}
            {showImages && result.comment.imageUrl && (
              <div className="mt-3">
                <img 
                  src={result.comment.imageUrl} 
                  alt="Comment attachment" 
                  className="max-w-full max-h-48 rounded-lg border"
                />
              </div>
            )}

            {/* Kategori ujaran kebencian jika ada */}
            {result.category && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs text-destructive border-destructive">
                  {result.category}
                </Badge>
              </div>
            )}

            {/* Stats komentar dan tombol lihat balasan */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {result.comment.likes && result.comment.likes > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {result.comment.likes}
                  </div>
                )}
                {hasReplies && !isInDrawer && (
                  <div className="flex items-center gap-1">
                    <MessagesSquare className="h-3 w-3" />
                    {children.length} balasan
                  </div>
                )}
              </div>

              {/* Tombol untuk membuka drawer balasan (hanya di view utama) */}
              {hasReplies && !isInDrawer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openRepliesDrawer(result)}
                  className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
                >
                  <MessageSquare className="h-3 w-3" />
                  Lihat {children.length} Balasan
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Render child comments inline di drawer */}
        {hasReplies && isInDrawer && (
          <div className="relative">
            {children.map((child, idx) => (
              <div key={child.comment.id} className="relative">
                {/* Garis penghubung ke sibling berikutnya */}
                {idx < children.length - 1 && (
                  <div 
                    className="absolute w-0.5 bg-primary/20" 
                    style={{ 
                      left: `${depth * 28 + 16}px`,
                      top: '50%',
                      bottom: '-50%',
                    }}
                  />
                )}
                {renderCommentCard(child, depth + 1, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const selectedChildren = selectedParent ? (childrenMap[selectedParent.comment.id] || []) : [];

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Thread Komentar ({analysisResults.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Klik "Lihat Balasan" untuk melihat sub-komentar dengan garis penghubung hirarki
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {parentComments.map(result => renderCommentCard(result, 0, false))}
            
            {parentComments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada komentar untuk ditampilkan
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Drawer/Sheet untuk menampilkan balasan */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[70vh]">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessagesSquare className="h-5 w-5 text-primary" />
              Thread Balasan ({selectedChildren.length + 1} komentar)
            </SheetTitle>
            <SheetDescription>
              Menampilkan komentar induk dan semua balasannya
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100%-80px)] mt-4 pr-4">
            <div className="space-y-2 pb-6">
              {/* Parent comment */}
              {selectedParent && renderCommentCard(selectedParent, 0, true)}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};
