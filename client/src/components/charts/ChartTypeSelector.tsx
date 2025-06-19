import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartType } from './EChartsRenderer';
import { 
  BarChart3, LineChart, PieChart, Activity, Columns, 
  Map, Radar, Filter, Gauge, Share2, TreePine, Sun, Network,
  CandlestickChart, Box, GitBranch, MapPin,
  Image, Waves, Calendar, Dot, Split
} from 'lucide-react';

interface ChartTypeSelectorProps {
  onSelectChartType: (type: ChartType) => void;
  trigger?: React.ReactNode;
}

interface ChartTypeInfo {
  type: ChartType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'basic' | 'statistical' | 'advanced' | 'specialized';
  useCase: string;
  complexity: 'simple' | 'medium' | 'complex';
}

const chartTypes: ChartTypeInfo[] = [
  // Basic Charts
  {
    type: 'line',
    name: 'Line Chart',
    description: 'Shows trends over time with connected data points',
    icon: <LineChart className="h-5 w-5" />,
    category: 'basic',
    useCase: 'Time series, trends, continuous data',
    complexity: 'simple'
  },
  {
    type: 'bar',
    name: 'Bar Chart',
    description: 'Horizontal bars for comparing categories',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'basic',
    useCase: 'Category comparison, rankings',
    complexity: 'simple'
  },
  {
    type: 'column',
    name: 'Column Chart',
    description: 'Vertical bars for comparing values across categories',
    icon: <Columns className="h-5 w-5" />,
    category: 'basic',
    useCase: 'Category comparison, vertical layout',
    complexity: 'simple'
  },
  {
    type: 'pie',
    name: 'Pie Chart',
    description: 'Shows proportions and percentages of a whole',
    icon: <PieChart className="h-5 w-5" />,
    category: 'basic',
    useCase: 'Parts of whole, percentages',
    complexity: 'simple'
  },
  {
    type: 'area',
    name: 'Area Chart',
    description: 'Line chart with filled area showing volume',
    icon: <Activity className="h-5 w-5" />,
    category: 'basic',
    useCase: 'Volume over time, cumulative data',
    complexity: 'simple'
  },
  {
    type: 'scatter',
    name: 'Scatter Plot',
    description: 'Shows correlation between two variables',
    icon: <Dot className="h-5 w-5" />,
    category: 'basic',
    useCase: 'Correlation, distribution, outliers',
    complexity: 'medium'
  },

  // Statistical Charts
  {
    type: 'heatmap',
    name: 'Heatmap',
    description: 'Color-coded matrix showing data density',
    icon: <Map className="h-5 w-5" />,
    category: 'statistical',
    useCase: 'Data density, correlations, patterns',
    complexity: 'medium'
  },
  {
    type: 'boxplot',
    name: 'Box Plot',
    description: 'Statistical distribution with quartiles',
    icon: <Box className="h-5 w-5" />,
    category: 'statistical',
    useCase: 'Statistical analysis, outliers, distribution',
    complexity: 'complex'
  },
  {
    type: 'candlestick',
    name: 'Candlestick',
    description: 'Financial chart showing OHLC data',
    icon: <CandlestickChart className="h-5 w-5" />,
    category: 'statistical',
    useCase: 'Financial data, stock prices, trading',
    complexity: 'complex'
  },
  {
    type: 'parallel',
    name: 'Parallel Coordinates',
    description: 'Multi-dimensional data visualization',
    icon: <ParallelCoordinates className="h-5 w-5" />,
    category: 'statistical',
    useCase: 'Multi-variable analysis, patterns',
    complexity: 'complex'
  },

  // Advanced Charts
  {
    type: 'radar',
    name: 'Radar Chart',
    description: 'Multi-axis comparison in circular layout',
    icon: <Radar className="h-5 w-5" />,
    category: 'advanced',
    useCase: 'Multi-criteria comparison, profiles',
    complexity: 'medium'
  },
  {
    type: 'funnel',
    name: 'Funnel Chart',
    description: 'Shows process stages with decreasing values',
    icon: <Filter className="h-5 w-5" />,
    category: 'advanced',
    useCase: 'Conversion rates, process flows',
    complexity: 'medium'
  },
  {
    type: 'gauge',
    name: 'Gauge Chart',
    description: 'Circular meter showing single value progress',
    icon: <Gauge className="h-5 w-5" />,
    category: 'advanced',
    useCase: 'KPIs, progress indicators, scores',
    complexity: 'medium'
  },
  {
    type: 'sankey',
    name: 'Sankey Diagram',
    description: 'Flow diagram showing data movement',
    icon: <Share2 className="h-5 w-5" />,
    category: 'advanced',
    useCase: 'Data flows, energy transfers, processes',
    complexity: 'complex'
  },
  {
    type: 'treemap',
    name: 'Treemap',
    description: 'Nested rectangles showing hierarchical data',
    icon: <TreePine className="h-5 w-5" />,
    category: 'advanced',
    useCase: 'Hierarchical data, proportions, portfolios',
    complexity: 'medium'
  },
  {
    type: 'sunburst',
    name: 'Sunburst Chart',
    description: 'Circular hierarchical visualization',
    icon: <Sun className="h-5 w-5" />,
    category: 'advanced',
    useCase: 'Hierarchical data, nested categories',
    complexity: 'complex'
  },

  // Specialized Charts
  {
    type: 'graph',
    name: 'Network Graph',
    description: 'Nodes and edges showing relationships',
    icon: <Network className="h-5 w-5" />,
    category: 'specialized',
    useCase: 'Network analysis, relationships, connections',
    complexity: 'complex'
  },
  {
    type: 'tree',
    name: 'Tree Diagram',
    description: 'Hierarchical tree structure visualization',
    icon: <GitBranch className="h-5 w-5" />,
    category: 'specialized',
    useCase: 'Organizational charts, decision trees',
    complexity: 'complex'
  },
  {
    type: 'map',
    name: 'Geographic Map',
    description: 'Geographic data visualization on world map',
    icon: <MapPin className="h-5 w-5" />,
    category: 'specialized',
    useCase: 'Geographic data, regional analysis',
    complexity: 'complex'
  },
  {
    type: 'pictorial',
    name: 'Pictorial Chart',
    description: 'Visual chart with custom symbols and shapes',
    icon: <Image className="h-5 w-5" />,
    category: 'specialized',
    useCase: 'Visual storytelling, presentations',
    complexity: 'medium'
  },
  {
    type: 'themeRiver',
    name: 'Theme River',
    description: 'Flowing visualization showing changes over time',
    icon: <Waves className="h-5 w-5" />,
    category: 'specialized',
    useCase: 'Thematic changes over time, evolution',
    complexity: 'complex'
  },
  {
    type: 'calendar',
    name: 'Calendar Heatmap',
    description: 'Calendar layout with color-coded values',
    icon: <Calendar className="h-5 w-5" />,
    category: 'specialized',
    useCase: 'Daily data patterns, activity tracking',
    complexity: 'medium'
  }
];

export function ChartTypeSelector({ onSelectChartType, trigger }: ChartTypeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { id: 'all', name: 'All Charts', count: chartTypes.length },
    { id: 'basic', name: 'Basic', count: chartTypes.filter(c => c.category === 'basic').length },
    { id: 'statistical', name: 'Statistical', count: chartTypes.filter(c => c.category === 'statistical').length },
    { id: 'advanced', name: 'Advanced', count: chartTypes.filter(c => c.category === 'advanced').length },
    { id: 'specialized', name: 'Specialized', count: chartTypes.filter(c => c.category === 'specialized').length }
  ];

  const filteredCharts = selectedCategory === 'all' 
    ? chartTypes 
    : chartTypes.filter(chart => chart.category === selectedCategory);

  const handleSelectChart = (type: ChartType) => {
    onSelectChartType(type);
    setIsOpen(false);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <BarChart3 className="h-4 w-4 mr-2" />
            Select Chart Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Chart Type</DialogTitle>
          <DialogDescription>
            Choose from {chartTypes.length} visualization types powered by Apache ECharts
          </DialogDescription>
        </DialogHeader>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>

        {/* Chart Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredCharts.map((chart) => (
              <Card 
                key={chart.type} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => handleSelectChart(chart.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {chart.icon}
                      <CardTitle className="text-sm">{chart.name}</CardTitle>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getComplexityColor(chart.complexity)}`}
                    >
                      {chart.complexity}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {chart.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    <strong>Best for:</strong> {chart.useCase}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}