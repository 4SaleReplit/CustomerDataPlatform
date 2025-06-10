import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { SiSnowflake } from 'react-icons/si';

export default function NetworkPolicy() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const replitIPRanges = [
    "34.106.136.0/22",
    "34.106.140.0/22", 
    "34.106.144.0/22",
    "34.106.148.0/22"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <SiSnowflake className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Snowflake Network Policy Setup
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Configure your Snowflake network policy to allow connections from Replit and enable data access for your cohort management platform.
          </p>
        </div>

        {/* Status Alert */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Network Policy Required
                </h3>
                <p className="text-orange-700 dark:text-orange-300 mt-1">
                  Your Snowflake account requires network policy whitelisting. Add Replit IP ranges to enable database connections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-step Guide */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Step 1: IP Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">1</Badge>
                Replit IP Ranges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Add these IP ranges to your Snowflake network policy:
              </p>
              
              <div className="space-y-2">
                {replitIPRanges.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <code className="text-sm font-mono">{ip}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(ip)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(replitIPRanges.join('\n'))}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All IP Ranges
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Snowflake Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">2</Badge>
                Snowflake Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">SQL Command:</h4>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <code className="text-xs font-mono block whitespace-pre-wrap">
{`CREATE NETWORK POLICY replit_access
  ALLOWED_IP_LIST = (
    '34.106.136.0/22',
    '34.106.140.0/22', 
    '34.106.144.0/22',
    '34.106.148.0/22'
  );

ALTER ACCOUNT SET NETWORK_POLICY = replit_access;`}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`CREATE NETWORK POLICY replit_access\n  ALLOWED_IP_LIST = (\n    '34.106.136.0/22',\n    '34.106.140.0/22', \n    '34.106.144.0/22',\n    '34.106.148.0/22'\n  );\n\nALTER ACCOUNT SET NETWORK_POLICY = replit_access;`)}
                    className="mt-2 w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy SQL Commands
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alternative Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">3</Badge>
              Alternative Configuration Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              
              <div className="space-y-3">
                <h4 className="font-medium">Via Snowflake Web UI:</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600 dark:text-gray-300">
                  <li>Login to Snowflake Web UI</li>
                  <li>Go to Admin → Security → Network Policies</li>
                  <li>Create new policy "replit_access"</li>
                  <li>Add IP ranges to allowed list</li>
                  <li>Set as account-level policy</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Via SnowSQL CLI:</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600 dark:text-gray-300">
                  <li>Connect using SnowSQL</li>
                  <li>Execute network policy SQL</li>
                  <li>Verify policy is active</li>
                  <li>Test connection from Replit</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Verification Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                After configuring the network policy, verify the setup:
              </p>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">1. Check Policy</h4>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                    SHOW NETWORK POLICIES;
                  </code>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">2. Test Connection</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Refresh dashboard tiles to test Snowflake connectivity
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">3. Monitor Logs</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Check application logs for successful query execution
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Links */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <a href="https://docs.snowflake.com/en/user-guide/network-policies" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Snowflake Network Policies Documentation
                </a>
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <a href="https://docs.snowflake.com/en/sql-reference/sql/create-network-policy" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  CREATE NETWORK POLICY Reference
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}