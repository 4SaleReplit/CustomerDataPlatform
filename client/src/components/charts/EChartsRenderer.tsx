import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useEffect, useMemo } from 'react';

// Chart type definitions
export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'scatter' 
  | 'area' 
  | 'column'
  | 'heatmap' 
  | 'radar' 
  | 'funnel' 
  | 'gauge' 
  | 'sankey' 
  | 'treemap' 
  | 'sunburst'
  | 'graph'
  | 'candlestick'
  | 'boxplot'
  | 'parallel'
  | 'tree'
  | 'map'
  | 'pictorial'
  | 'themeRiver'
  | 'calendar';

interface EChartsRendererProps {
  type: ChartType;
  data: any[];
  title?: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  customOptions?: any;
  onChartReady?: (chartInstance: any) => void;
}

export function EChartsRenderer({
  type,
  data,
  title = '',
  width = '100%',
  height = 400,
  theme = 'light',
  customOptions = {},
  onChartReady
}: EChartsRendererProps) {
  
  // Generate ECharts options based on type and data
  const chartOptions = useMemo(() => {
    const baseOptions = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme === 'dark' ? '#2d3748' : '#ffffff',
        borderColor: theme === 'dark' ? '#4a5568' : '#e2e8f0',
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }
      },
      legend: {
        bottom: 10,
        textStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      backgroundColor: 'transparent'
    };

    switch (type) {
      case 'line':
        return generateLineChart(data, baseOptions, theme);
      case 'bar':
        return generateBarChart(data, baseOptions, theme);
      case 'column':
        return generateColumnChart(data, baseOptions, theme);
      case 'pie':
        return generatePieChart(data, baseOptions, theme);
      case 'area':
        return generateAreaChart(data, baseOptions, theme);
      case 'scatter':
        return generateScatterChart(data, baseOptions, theme);
      case 'heatmap':
        return generateHeatmapChart(data, baseOptions, theme);
      case 'radar':
        return generateRadarChart(data, baseOptions, theme);
      case 'funnel':
        return generateFunnelChart(data, baseOptions, theme);
      case 'gauge':
        return generateGaugeChart(data, baseOptions, theme);
      case 'sankey':
        return generateSankeyChart(data, baseOptions, theme);
      case 'treemap':
        return generateTreemapChart(data, baseOptions, theme);
      case 'sunburst':
        return generateSunburstChart(data, baseOptions, theme);
      case 'graph':
        return generateGraphChart(data, baseOptions, theme);
      case 'candlestick':
        return generateCandlestickChart(data, baseOptions, theme);
      case 'boxplot':
        return generateBoxplotChart(data, baseOptions, theme);
      case 'parallel':
        return generateParallelChart(data, baseOptions, theme);
      case 'tree':
        return generateTreeChart(data, baseOptions, theme);
      case 'map':
        return generateMapChart(data, baseOptions, theme);
      case 'pictorial':
        return generatePictorialChart(data, baseOptions, theme);
      case 'themeRiver':
        return generateThemeRiverChart(data, baseOptions, theme);
      case 'calendar':
        return generateCalendarChart(data, baseOptions, theme);
      default:
        return generateLineChart(data, baseOptions, theme);
    }
  }, [type, data, title, theme]);

  // Merge with custom options
  const finalOptions = useMemo(() => {
    return echarts.util.merge(chartOptions, customOptions, true);
  }, [chartOptions, customOptions]);

  return (
    <ReactECharts
      option={finalOptions}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height 
      }}
      theme={theme}
      onChartReady={onChartReady}
      opts={{ renderer: 'canvas' }}
    />
  );
}

// Chart generation functions
function generateLineChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    xAxis: {
      type: 'category',
      data: data.map(item => item.name || item.x || item.category),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      type: 'line',
      data: data.map(item => item.value || item.y || 0),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3 }
    }]
  };
}

function generateBarChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    xAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name || item.category),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      type: 'bar',
      data: data.map(item => item.value || item.y || 0),
      barWidth: '60%'
    }]
  };
}

function generateColumnChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    xAxis: {
      type: 'category',
      data: data.map(item => item.name || item.category),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      type: 'bar',
      data: data.map(item => item.value || item.y || 0),
      barWidth: '60%'
    }]
  };
}

function generatePieChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#06b6d4', '#84cc16']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0891b2', '#65a30d'];

  return {
    ...baseOptions,
    color: colors,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: 'Data',
      type: 'pie',
      radius: '50%',
      center: ['50%', '50%'],
      data: data.map(item => ({
        value: item.value || item.y || 0,
        name: item.name || item.category || 'Unknown'
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };
}

function generateAreaChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    xAxis: {
      type: 'category',
      data: data.map(item => item.name || item.x || item.category),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      type: 'line',
      data: data.map(item => item.value || item.y || 0),
      smooth: true,
      areaStyle: {
        opacity: 0.6
      },
      symbol: 'none'
    }]
  };
}

function generateScatterChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    xAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      type: 'scatter',
      data: data.map(item => [item.x || 0, item.y || item.value || 0]),
      symbolSize: 8
    }]
  };
}

function generateHeatmapChart(data: any[], baseOptions: any, theme: string) {
  return {
    ...baseOptions,
    tooltip: {
      position: 'top'
    },
    xAxis: {
      type: 'category',
      data: [...Array.from(new Set(data.map(item => item.x || item.category)))],
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'category',
      data: Array.from(new Set(data.map(item => item.y || item.series))),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    visualMap: {
      min: Math.min(...data.map(item => item.value || 0)),
      max: Math.max(...data.map(item => item.value || 0)),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      textStyle: { color: theme === 'dark' ? '#ffffff' : '#333333' }
    },
    series: [{
      type: 'heatmap',
      data: data.map(item => [item.x || 0, item.y || 0, item.value || 0]),
      label: {
        show: true
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };
}

function generateRadarChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Extract indicators from data
  const indicators = data.length > 0 && data[0].indicators 
    ? data[0].indicators 
    : Object.keys(data[0] || {}).filter(key => key !== 'name').map(key => ({ name: key, max: 100 }));

  return {
    ...baseOptions,
    color: colors,
    radar: {
      indicator: indicators,
      center: ['50%', '50%'],
      radius: '70%',
      axisName: {
        color: theme === 'dark' ? '#a0aec0' : '#718096'
      }
    },
    series: [{
      type: 'radar',
      data: data.map(item => ({
        value: indicators.map(ind => item[ind.name] || 0),
        name: item.name || 'Series'
      }))
    }]
  };
}

function generateFunnelChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}'
    },
    series: [{
      name: 'Funnel',
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 60,
      width: '80%',
      min: 0,
      max: Math.max(...data.map(item => item.value || 0)),
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside'
      },
      data: data.map(item => ({
        value: item.value || 0,
        name: item.name || item.category || 'Unknown'
      }))
    }]
  };
}

function generateGaugeChart(data: any[], baseOptions: any, theme: string) {
  const value = data[0]?.value || 0;
  const max = data[0]?.max || 100;

  return {
    ...baseOptions,
    series: [{
      name: 'Gauge',
      type: 'gauge',
      progress: {
        show: true
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%'
      },
      data: [{
        value: value,
        name: data[0]?.name || 'Progress'
      }],
      max: max
    }]
  };
}

function generateSankeyChart(data: any[], baseOptions: any, theme: string) {
  return {
    ...baseOptions,
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: {
        focus: 'adjacency'
      },
      data: data.filter(item => item.nodes).flatMap(item => item.nodes) || [],
      links: data.filter(item => item.links).flatMap(item => item.links) || []
    }]
  };
}

function generateTreemapChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    series: [{
      type: 'treemap',
      data: data.map(item => ({
        name: item.name || item.category,
        value: item.value || 0,
        children: item.children || []
      }))
    }]
  };
}

function generateSunburstChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    series: [{
      type: 'sunburst',
      data: data,
      radius: [0, '90%'],
      center: ['50%', '50%'],
      sort: null,
      emphasis: {
        focus: 'ancestor'
      },
      levels: [{}, {
        r0: '15%',
        r: '35%',
        itemStyle: {
          borderWidth: 2
        },
        label: {
          rotate: 'tangential'
        }
      }, {
        r0: '35%',
        r: '70%',
        label: {
          align: 'right'
        }
      }]
    }]
  };
}

function generateGraphChart(data: any[], baseOptions: any, theme: string) {
  return {
    ...baseOptions,
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [{
      type: 'graph',
      layout: 'force',
      symbolSize: 50,
      roam: true,
      label: {
        show: true
      },
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: [4, 10],
      data: data.filter(item => item.nodes).flatMap(item => item.nodes) || [],
      links: data.filter(item => item.links).flatMap(item => item.links) || [],
      lineStyle: {
        opacity: 0.9,
        width: 2,
        curveness: 0
      }
    }]
  };
}

function generateCandlestickChart(data: any[], baseOptions: any, theme: string) {
  return {
    ...baseOptions,
    xAxis: {
      type: 'category',
      data: data.map(item => item.date || item.name),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      type: 'candlestick',
      data: data.map(item => [item.open, item.close, item.low, item.high])
    }]
  };
}

function generateBoxplotChart(data: any[], baseOptions: any, theme: string) {
  return {
    ...baseOptions,
    xAxis: {
      type: 'category',
      data: data.map(item => item.name || item.category),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      name: 'boxplot',
      type: 'boxplot',
      data: data.map(item => item.data || [item.min, item.q1, item.median, item.q3, item.max])
    }]
  };
}

function generateParallelChart(data: any[], baseOptions: any, theme: string) {
  const dimensions = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'name') : [];
  
  return {
    ...baseOptions,
    parallelAxis: dimensions.map((dim, index) => ({
      dim: index,
      name: dim,
      nameTextStyle: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    })),
    series: [{
      type: 'parallel',
      lineStyle: {
        width: 2
      },
      data: data.map(item => dimensions.map(dim => item[dim] || 0))
    }]
  };
}

function generateTreeChart(data: any[], baseOptions: any, theme: string) {
  return {
    ...baseOptions,
    series: [{
      type: 'tree',
      data: data,
      top: '1%',
      left: '7%',
      bottom: '1%',
      right: '20%',
      symbolSize: 7,
      label: {
        position: 'left',
        verticalAlign: 'middle',
        align: 'right',
        fontSize: 9
      },
      leaves: {
        label: {
          position: 'right',
          verticalAlign: 'middle',
          align: 'left'
        }
      },
      emphasis: {
        focus: 'descendant'
      },
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750
    }]
  };
}

function generateMapChart(data: any[], baseOptions: any, theme: string) {
  // Fallback to bar chart for geographic data since map regions aren't loaded
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.country || item.name || item.region),
      axisLabel: { 
        color: theme === 'dark' ? '#a0aec0' : '#718096',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      name: 'Geographic Distribution',
      type: 'bar',
      data: data.map(item => item.users || item.value || 0),
      barWidth: '60%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };
}

function generatePictorialChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    xAxis: {
      type: 'category',
      data: data.map(item => item.name || item.category),
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#718096' }
    },
    series: [{
      type: 'pictorialBar',
      symbol: 'rect',
      data: data.map(item => item.value || 0),
      barCategoryGap: '-130%',
      symbolRepeat: true,
      symbolSize: [12, 4],
      symbolMargin: 1,
      symbolPosition: 'start'
    }]
  };
}

function generateThemeRiverChart(data: any[], baseOptions: any, theme: string) {
  const colors = theme === 'dark' 
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return {
    ...baseOptions,
    color: colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(0,0,0,0.2)',
          width: 1,
          type: 'solid'
        }
      }
    },
    singleAxis: {
      top: 50,
      bottom: 50,
      axisTick: {},
      axisLabel: {},
      type: 'time',
      axisPointer: {
        animation: true,
        label: {
          show: true
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          opacity: 0.2
        }
      }
    },
    series: [{
      type: 'themeRiver',
      emphasis: {
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.8)'
        }
      },
      data: data
    }]
  };
}

function generateCalendarChart(data: any[], baseOptions: any, theme: string) {
  const currentYear = new Date().getFullYear();
  
  return {
    ...baseOptions,
    visualMap: {
      min: Math.min(...data.map(item => item.value || 0)),
      max: Math.max(...data.map(item => item.value || 0)),
      type: 'continuous',
      orient: 'horizontal',
      left: 'center',
      top: 65,
      textStyle: { color: theme === 'dark' ? '#ffffff' : '#333333' }
    },
    calendar: {
      top: 120,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: currentYear,
      itemStyle: {
        borderWidth: 0.5
      },
      yearLabel: { show: false }
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: data.map(item => [item.date || item.name, item.value || 0])
    }]
  };
}