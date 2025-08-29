import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface SentimentChartProps {
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

export const SentimentChart = ({ statistics }: SentimentChartProps) => {
  const pieData = [
    { name: 'Ujaran Kebencian', value: statistics.hate, percentage: statistics.hatePercentage, color: '#ef4444' },
    { name: 'Netral', value: statistics.neutral, percentage: statistics.neutralPercentage, color: '#6b7280' },
    { name: 'Positif', value: statistics.positive, percentage: statistics.positivePercentage, color: '#10b981' }
  ];

  const barData = [
    { name: 'Ujaran Kebencian', value: statistics.hate, color: '#ef4444' },
    { name: 'Netral', value: statistics.neutral, color: '#6b7280' },
    { name: 'Positif', value: statistics.positive, color: '#10b981' }
  ];

  const COLORS = ['#ef4444', '#6b7280', '#10b981'];

  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} komentar ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Visualisasi Sebaran Sentimen
        </CardTitle>
        <CardDescription>
          Grafik distribusi komentar berdasarkan analisis sentimen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Pie Chart
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Bar Chart
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pie" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                  <Legend 
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bar" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    className="text-sm"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value} komentar
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600">{statistics.hate}</div>
            <div className="text-sm text-red-600/80">Ujaran Kebencian</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-bold text-gray-600">{statistics.neutral}</div>
            <div className="text-sm text-gray-600/80">Netral</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600">{statistics.positive}</div>
            <div className="text-sm text-green-600/80">Positif</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};