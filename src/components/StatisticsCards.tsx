import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageCircle, ThumbsUp, BarChart3 } from 'lucide-react';

interface StatisticsCardsProps {
  statistics: {
    total: number;
    hate: number;
    neutral: number;
    positive: number;
    hatePercentage: number;
    neutralPercentage: number;
    positivePercentage: number;
  };
}

export const StatisticsCards = ({ statistics }: StatisticsCardsProps) => {
  const cards = [
    {
      title: 'Total Komentar',
      value: statistics.total,
      icon: MessageCircle,
      color: 'bg-primary',
      textColor: 'text-primary-foreground'
    },
    {
      title: 'Ujaran Kebencian',
      value: statistics.hate,
      percentage: statistics.hatePercentage,
      icon: AlertTriangle,
      color: 'bg-destructive',
      textColor: 'text-destructive-foreground'
    },
    {
      title: 'Komentar Positif',
      value: statistics.positive,
      percentage: statistics.positivePercentage,
      icon: ThumbsUp,
      color: 'bg-accent',
      textColor: 'text-accent-foreground'
    },
    {
      title: 'Komentar Netral',
      value: statistics.neutral,
      percentage: statistics.neutralPercentage,
      icon: BarChart3,
      color: 'bg-secondary',
      textColor: 'text-secondary-foreground'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={card.title} className="shadow-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-md ${card.color}`}>
              <card.icon className={`h-4 w-4 ${card.textColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-foreground">
                {card.value}
              </div>
              {card.percentage !== undefined && (
                <Badge 
                  variant={card.title === 'Ujaran Kebencian' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {card.percentage}%
                </Badge>
              )}
            </div>
            {card.percentage !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      card.title === 'Ujaran Kebencian' ? 'bg-destructive' :
                      card.title === 'Komentar Positif' ? 'bg-accent' : 'bg-secondary'
                    }`}
                    style={{ width: `${card.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};