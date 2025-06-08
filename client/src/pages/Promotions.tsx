
import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock promotion data
const mockPromotions = [
  {
    id: 1,
    name: 'Summer Sale 2024',
    type: 'percentage',
    value: 20,
    code: 'SUMMER20',
    description: '20% off all premium listings',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'active',
    usageCount: 234
  },
  {
    id: 2,
    name: 'New User Welcome',
    type: 'fixed',
    value: 10,
    code: 'WELCOME10',
    description: '$10 credit for new users',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    usageCount: 1567
  },
  {
    id: 3,
    name: 'Black Friday Special',
    type: 'percentage',
    value: 50,
    code: 'BLACKFRIDAY',
    description: '50% off all services',
    startDate: '2023-11-24',
    endDate: '2023-11-27',
    status: 'expired',
    usageCount: 8934
  }
];

export default function Promotions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    type: 'percentage',
    value: '',
    code: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const filteredPromotions = mockPromotions.filter(promotion =>
    promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreatePromotion = () => {
    // TODO: Implement promotion creation
    console.log('Creating promotion:', newPromotion);
    setIsCreateDialogOpen(false);
    setNewPromotion({
      name: '',
      type: 'percentage',
      value: '',
      code: '',
      description: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
              <DialogDescription>
                Set up a new promotional offer for your platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Promotion Name</Label>
                <Input
                  id="name"
                  placeholder="Enter promotion name"
                  value={newPromotion.name}
                  onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Promo Code</Label>
                <Input
                  id="code"
                  placeholder="Enter promo code"
                  value={newPromotion.code}
                  onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newPromotion.type} onValueChange={(value) => setNewPromotion({...newPromotion, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    placeholder={newPromotion.type === 'percentage' ? '20' : '10.00'}
                    value={newPromotion.value}
                    onChange={(e) => setNewPromotion({...newPromotion, value: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the promotion..."
                  value={newPromotion.description}
                  onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePromotion}>
                Create Promotion
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Search promotions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Promotions ({filteredPromotions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Code</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Value</th>
                  <th className="text-left py-3 px-4 font-medium">Duration</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Usage</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromotions.map((promotion) => (
                  <tr key={promotion.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{promotion.name}</div>
                        <div className="text-sm text-gray-600">{promotion.description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{promotion.code}</code>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {promotion.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {promotion.type === 'percentage' ? `${promotion.value}%` : `$${promotion.value}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div>{promotion.startDate}</div>
                      <div>to {promotion.endDate}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(promotion.status)}</td>
                    <td className="py-3 px-4 font-medium">{promotion.usageCount}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
