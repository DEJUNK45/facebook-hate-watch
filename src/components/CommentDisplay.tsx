import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import EmojiDisplay from '@/components/EmojiDisplay';

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

interface CommentDisplayProps {
  comment: ApifyComment;
  classification: string;
  getClassificationBadge: (classification: string) => JSX.Element;
}

const CommentDisplay = ({ comment, classification, getClassificationBadge }: CommentDisplayProps) => {
  const [showImage, setShowImage] = useState(true);

  const hasVisualContent = comment.imageUrl || (comment.attachments && comment.attachments.length > 0);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{comment.author}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(comment.timestamp).toLocaleString('id-ID')}
          </p>
        </div>
        {getClassificationBadge(classification)}
      </div>

      {/* Text Content */}
      {comment.text && (
        <div className="text-sm">
          <EmojiDisplay text={comment.text} />
        </div>
      )}

      {/* Visual Content */}
      {hasVisualContent && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImage(!showImage)}
              className="text-xs"
            >
              {showImage ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showImage ? 'Sembunyikan' : 'Tampilkan'} Gambar
            </Button>
            <Badge variant="secondary" className="text-xs">
              Komentar dengan gambar
            </Badge>
          </div>

          {showImage && (
            <div className="space-y-2">
              {/* Primary image */}
              {comment.imageUrl && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={comment.imageUrl}
                    alt="Gambar komentar"
                    className="w-full max-h-64 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Attachments */}
              {comment.attachments?.map((attachment, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {attachment.type === 'image' && (
                    <div>
                      <img
                        src={attachment.url}
                        alt={attachment.description || `Lampiran ${index + 1}`}
                        className="w-full max-h-64 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {attachment.description && (
                        <p className="p-2 text-xs text-muted-foreground bg-secondary/20">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                  )}
                  {attachment.type === 'link' && (
                    <div className="p-3 bg-secondary/20">
                      <p className="text-xs text-muted-foreground mb-1">Link:</p>
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline break-all"
                      >
                        {attachment.url}
                      </a>
                      {attachment.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comment metadata */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex gap-4">
          {comment.likes && comment.likes > 0 && (
            <span>👍 {comment.likes}</span>
          )}
          {comment.replies && comment.replies > 0 && (
            <span>💬 {comment.replies} balasan</span>
          )}
        </div>
        {hasVisualContent && (
          <Badge variant="outline" className="text-xs">
            Media
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default CommentDisplay;