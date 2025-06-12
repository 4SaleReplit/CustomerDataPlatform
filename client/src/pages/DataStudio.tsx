import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, BarChart3, FileText, Activity, ArrowRight } from 'lucide-react';

export function DataStudio() {
  const features = [
    {
      title: 'Dashboards',
      description: 'Create and manage interactive dashboards with multiple visualization tiles',
      icon: BarChart3,
      href: '/data-studio/dashboards',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
    },
    {
      title: 'Explores',
      description: 'Build data visualizations and custom metrics with advanced analytics',
      icon: Activity,
      href: '/data-studio/explores',
      color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
    },
    {
      title: 'SQL Editor',
      description: 'Advanced SQL editor with syntax highlighting, autocomplete, and query execution',
      icon: Database,
      href: '/data-studio/sql',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
    },
    {
      title: 'File System',
      description: 'Organize dashboards and tiles in folders with team collaboration features',
      icon: FileText,
      href: '/data-studio/files',
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
    },
    {
      title: 'Lineage',
      description: 'Track data lineage and dependencies across your data pipeline',
      icon: Activity,
      href: '/data-studio/lineage',
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
    },
    {
      title: 'Data Explorer',
      description: 'Browse databases, tables, and columns with detailed schema information',
      icon: Database,
      href: '/data-studio/explorer',
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Data Studio</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive data analytics and management workspace for advanced users
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                <Button asChild className="w-full">
                  <Link href={feature.href}>
                    Open {feature.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Studio Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Advanced Analytics</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time SQL query execution</li>
                <li>• Interactive data visualization</li>
                <li>• Custom dashboard creation</li>
                <li>• Collaborative workspaces</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Data Management</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Schema exploration and documentation</li>
                <li>• Data lineage tracking</li>
                <li>• File and folder organization</li>
                <li>• Team collaboration tools</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}