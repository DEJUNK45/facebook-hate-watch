import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Users, MessageCircle } from 'lucide-react';
import { EntityTarget } from '@/services/bertService';

interface EntityTargetsProps {
  entities: EntityTarget[];
}

const EntityTargets = ({ entities }: EntityTargetsProps) => {
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <User className="w-4 h-4" />;
      case 'group':
        return <Users className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'person':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'group':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-green-100 text-green-800 hover:bg-green-100';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'person':
        return 'Nama Orang';
      case 'group':
        return 'Kelompok';
      default:
        return 'Kata Ganti';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Target & Entitas yang Disebutkan</CardTitle>
        <p className="text-sm text-muted-foreground">
          Analisis entitas yang menjadi target dalam komentar (nama, kata ganti, dll)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entities.map((entity, index) => (
            <Card key={index} className="border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getEntityIcon(entity.type)}
                    <span className="font-medium capitalize">{entity.entity}</span>
                    <Badge className={getEntityColor(entity.type)}>
                      {getTypeLabel(entity.type)}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {entity.mentions} sebutan
                  </span>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contoh Komentar:</p>
                  <p className="text-xs text-foreground line-clamp-2">
                    {entity.comments[0] || 'Tidak ada komentar'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {entities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada entitas atau target yang terdeteksi</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EntityTargets;