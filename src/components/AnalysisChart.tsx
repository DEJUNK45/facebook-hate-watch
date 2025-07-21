import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, CheckCircle, Minus } from 'lucide-react';

interface AnalysisChartProps {
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

export const AnalysisChart = ({ statistics }: AnalysisChartProps) => {
  const chartData = [
    {
      name: 'Ujaran Kebencian',
      count: statistics.hate,
      percentage: statistics.hatePercentage,
      color: 'bg-destructive',
      icon: AlertTriangle,
      textColor: 'text-destructive'
    },
    {
      name: 'Komentar Positif',
      count: statistics.positive,
      percentage: statistics.positivePercentage,
      color: 'bg-accent',
      icon: CheckCircle,
      textColor: 'text-accent'
    },
    {
      name: 'Komentar Netral',
      count: statistics.neutral,
      percentage: statistics.neutralPercentage,
      color: 'bg-secondary',
      icon: Minus,
      textColor: 'text-secondary-foreground'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Progress Chart */}
      <Card className="shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Distribusi Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {chartData.map((item, index) => (
            <div key={item.name} className="space-y-2" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.textColor}`} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{item.count}</span>
                  <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                </div>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2"
                style={{
                  background: 'hsl(var(--secondary))'
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Visual Summary */}
      <Card className="shadow-card animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ringkasan Visual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total Comments */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {statistics.total}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Komentar Dianalisis
              </div>
            </div>

            {/* Risk Level */}
            <div className="p-4 rounded-lg border-2" style={{
              borderColor: statistics.hatePercentage > 20 ? 'hsl(var(--destructive))' :
                          statistics.hatePercentage > 10 ? 'hsl(var(--warning))' : 'hsl(var(--accent))',
              backgroundColor: statistics.hatePercentage > 20 ? 'hsl(var(--destructive) / 0.1)' :
                              statistics.hatePercentage > 10 ? 'hsl(var(--warning) / 0.1)' : 'hsl(var(--accent) / 0.1)'
            }}>
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">
                  {statistics.hatePercentage > 20 ? 'Tingkat Tinggi' :
                   statistics.hatePercentage > 10 ? 'Tingkat Sedang' : 'Tingkat Rendah'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Risiko Ujaran Kebencian
                </div>
              </div>
            </div>

            {/* Top Category */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {chartData.map((item) => (
                <div key={item.name} className="p-2 rounded bg-muted">
                  <div className={`text-lg font-bold ${item.textColor}`}>
                    {item.percentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.name.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};