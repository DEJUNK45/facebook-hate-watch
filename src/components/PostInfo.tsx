import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Heart, Share2, Clock, Laugh, Frown, Angry } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface PostData {
  title: string;
  content: string;
  author: string;
  timestamp: string;
  likes: number;
  shares: number;
  reactions?: {
    like: number;
    love: number;
    haha: number;
    wow: number;
    sad: number;
    angry: number;
  };
}

interface PostInfoProps {
  postData: PostData;
}

export const PostInfo = ({ postData }: PostInfoProps) => {
  return (
    <Card className="shadow-card animate-fade-in mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Informasi Postingan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="font-medium">
              {postData.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{postData.author}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(postData.timestamp), { 
                addSuffix: true, 
                locale: id 
              })}
            </div>
          </div>
        </div>

        {/* Post content */}
        <div className="space-y-2">
          {postData.title && (
            <h4 className="font-medium text-lg">{postData.title}</h4>
          )}
          <p className="text-foreground leading-relaxed">{postData.content}</p>
        </div>

        {/* Post stats */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {postData.likes} likes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              {postData.shares} shares
            </Badge>
          </div>
          
          {/* Reactions breakdown */}
          {postData.reactions && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Reaksi Postingan:</p>
              <div className="flex flex-wrap items-center gap-2">
                {postData.reactions.like > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    👍 Like: {postData.reactions.like}
                  </Badge>
                )}
                {postData.reactions.love > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    ❤️ Love: {postData.reactions.love}
                  </Badge>
                )}
                {postData.reactions.haha > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    😂 Haha: {postData.reactions.haha}
                  </Badge>
                )}
                {postData.reactions.wow > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    😮 Wow: {postData.reactions.wow}
                  </Badge>
                )}
                {postData.reactions.sad > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    😢 Sad: {postData.reactions.sad}
                  </Badge>
                )}
                {postData.reactions.angry > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    😡 Angry: {postData.reactions.angry}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};