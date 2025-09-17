import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopicCluster } from '@/services/bertService';

interface TopicClusteringProps {
  clusters: TopicCluster[];
}

const TopicClustering = ({ clusters }: TopicClusteringProps) => {
  const getTopicColor = (topic: string) => {
    const colors = {
      'Politik': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'Ekonomi': 'bg-green-100 text-green-800 hover:bg-green-100', 
      'Sosial': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'Agama': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      'Pendidikan': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      'Umum': 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    };
    return colors[topic as keyof typeof colors] || colors['Umum'];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Pengelompokan Topik (LDA)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Analisis topik dari komentar menggunakan Latent Dirichlet Allocation
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getTopicColor(cluster.topic)}>
                    {cluster.topic}
                  </Badge>
                  <span className="text-sm font-semibold text-primary">
                    {cluster.count} komentar
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Kata Kunci:</p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contoh Komentar:</p>
                  <p className="text-xs text-foreground line-clamp-2">
                    {cluster.comments[0] || 'Tidak ada komentar'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicClustering;