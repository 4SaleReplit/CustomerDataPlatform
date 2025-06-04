
import React from 'react';
import { Link } from 'react-router-dom';
import { Database, UserCheck, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Registration by Invitation Only</CardTitle>
          <CardDescription>Access to Customer CDP is by invitation only</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-blue-50 p-6 rounded-lg">
              <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Invitation Required</h3>
              <p className="text-sm text-gray-600">
                New accounts can only be created by administrators. Please contact your administrator to receive an invitation.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-4">Already have an account?</p>
            <Link to="/login">
              <Button className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
