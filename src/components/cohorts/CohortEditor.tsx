import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface Condition {
  id: string;
  type: 'attribute' | 'segment';
  attribute?: string;
  operator?: string;
  value?: string;
  segmentTag?: string;
  logicalOperator?: 'AND' | 'OR';
}

interface CohortEditorProps {
  initialName?: string;
  initialDescription?: string;
  initialConditions?: Condition[];
  onSave: (data: { name: string; description: string; conditions: Condition[] }) => void;
  backUrl?: string;
  title?: string;
}

const mockSegmentTags = [
  { id: '1', name: 'is_top_lister', description: 'Users with more than 10 total listings', userCount: 5432 },
  { id: '2', name: 'is_high_value', description: 'Users with CLTV > $500', userCount: 2341 },
  { id: '3', name: 'is_mobile_user', description: 'Users who primarily use mobile app', userCount: 8976 },
  { id: '4', name: 'is_electronics_seller', description: 'Users who list primarily in Electronics', userCount: 1247 },
  { id: '5', name: 'is_new_user', description: 'Users registered in the last 7 days', userCount: 892 }
];

const userAttributes = [
  { value: 'user_type', label: 'User Type', type: 'string' },
  { value: 'total_listings_count', label: 'Total Listings Count', type: 'number' },
  { value: 'paid_listings_count', label: 'Paid Listings Count', type: 'number' },
  { value: 'current_credits_in_wallet', label: 'Current Credits', type: 'number' },
  { value: 'user_account_creation_date', label: 'Account Creation Date', type: 'date' },
  { value: 'last_app_open_date', label: 'Last App Open Date', type: 'date' },
  { value: 'favorite_vertical', label: 'Favorite Vertical', type: 'string' },
  { value: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'string' },
  { value: 'user_email', label: 'User Email', type: 'string' },
  { value: 'user_phone', label: 'User Phone', type: 'string' },
  { value: 'average_listing_price', label: 'Average Listing Price', type: 'number' },
  { value: 'total_revenue', label: 'Total Revenue', type: 'number' }
];

const stringOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'regex', label: 'Matches Regex' },
  { value: 'like', label: 'Like (SQL Pattern)' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' }
];

const numberOperators = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'not_equals', label: 'Not Equals (≠)' },
  { value: 'greater_than', label: 'Greater Than (>)' },
  { value: 'less_than', label: 'Less Than (<)' },
  { value: 'greater_than_equal', label: 'Greater Than or Equal (≥)' },
  { value: 'less_than_equal', label: 'Less Than or Equal (≤)' },
  { value: 'between', label: 'Between' },
  { value: 'not_between', label: 'Not Between' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' }
];

const dateOperators = [
  { value: 'equals', label: 'On Date' },
  { value: 'not_equals', label: 'Not On Date' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between Dates' },
  { value: 'in_last_days', label: 'In Last X Days' },
  { value: 'in_next_days', label: 'In Next X Days' },
  { value: 'in_last_weeks', label: 'In Last X Weeks' },
  { value: 'in_last_months', label: 'In Last X Months' },
  { value: 'in_last_years', label: 'In Last X Years' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' }
];

export default function CohortEditor({
  initialName = '',
  initialDescription = '',
  initialConditions = [{ id: '1', type: 'attribute', attribute: '', operator: '', value: '' }],
  onSave,
  backUrl = '/cohorts',
  title = 'Create New Cohort'
}: CohortEditorProps) {
  const [cohortName, setCohortName] = useState(initialName);
  const [cohortDescription, setCohortDescription] = useState(initialDescription);
  const [conditions, setConditions] = useState<Condition[]>(initialConditions);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);

  const getOperatorsForAttribute = (attributeValue: string) => {
    const attribute = userAttributes.find(attr => attr.value === attributeValue);
    if (!attribute) return stringOperators;
    
    switch (attribute.type) {
      case 'number':
        return numberOperators;
      case 'date':
        return dateOperators;
      case 'string':
      default:
        return stringOperators;
    }
  };

  const getInputPlaceholder = (operator: string, attributeType: string) => {
    if (operator === 'regex') return 'Enter regex pattern (e.g., ^[A-Z].*)';
    if (operator === 'like') return 'Enter SQL pattern (e.g., %example%)';
    if (operator === 'in' || operator === 'not_in') return 'Enter comma-separated values';
    if (operator === 'between' || operator === 'not_between') return 'Enter range (e.g., 10,100)';
    if (operator.includes('in_last_') || operator.includes('in_next_')) return 'Enter number of days/weeks/months/years';
    if (attributeType === 'date' && (operator === 'before' || operator === 'after' || operator === 'equals')) return 'YYYY-MM-DD or YYYY-MM-DD HH:MM:SS';
    if (operator === 'between' && attributeType === 'date') return 'Start date, End date (YYYY-MM-DD)';
    return 'Enter value';
  };

  const shouldShowValueInput = (operator: string) => {
    return !['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(operator);
  };

  const addCondition = (type: 'attribute' | 'segment' = 'attribute') => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      type: type,
      logicalOperator: 'AND'
    };

    if (type === 'attribute') {
      newCondition.attribute = '';
      newCondition.operator = '';
      newCondition.value = '';
    } else {
      newCondition.segmentTag = '';
    }

    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(condition => condition.id !== id));
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(condition => {
      if (condition.id === id) {
        const updatedCondition = { ...condition, [field]: value };
        if (field === 'attribute') {
          updatedCondition.operator = '';
          updatedCondition.value = '';
        }
        if (field === 'operator') {
          updatedCondition.value = '';
        }
        return updatedCondition;
      }
      return condition;
    }));
  };

  const calculateEstimate = () => {
    const mockSize = Math.floor(Math.random() * 50000) + 1000;
    setEstimatedSize(mockSize);
  };

  const handleSave = () => {
    onSave({
      name: cohortName,
      description: cohortDescription,
      conditions: conditions
    });
  };

  const getSelectedSegmentTag = (tagName: string) => {
    return mockSegmentTags.find(tag => tag.name === tagName);
  };

  const getSelectedAttribute = (attributeValue: string) => {
    return userAttributes.find(attr => attr.value === attributeValue);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={backUrl}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cohorts
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Cohort Name</Label>
                <Input
                  id="name"
                  placeholder="Enter cohort name..."
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this cohort..."
                  value={cohortDescription}
                  onChange={(e) => setCohortDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conditions</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addCondition('attribute')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Attribute
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addCondition('segment')}>
                    <Tags className="mr-2 h-4 w-4" />
                    Add Segment Tag
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="space-y-4">
                  {index > 0 && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={condition.logicalOperator}
                        onValueChange={(value) => updateCondition(condition.id, 'logicalOperator', value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={condition.type === 'attribute' ? 'default' : 'secondary'}>
                        {condition.type === 'attribute' ? 'Attribute' : 'Segment Tag'}
                      </Badge>
                      {getSelectedAttribute(condition.attribute || '')?.type && (
                        <Badge variant="outline" className="text-xs">
                          {getSelectedAttribute(condition.attribute || '')?.type}
                        </Badge>
                      )}
                      {conditions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(condition.id)}
                          className="text-red-600 hover:text-red-700 ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {condition.type === 'attribute' ? (
                      <div className="space-y-4">
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <Label>Attribute</Label>
                            <Select
                              value={condition.attribute}
                              onValueChange={(value) => updateCondition(condition.id, 'attribute', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select attribute" />
                              </SelectTrigger>
                              <SelectContent>
                                {userAttributes.map((attr) => (
                                  <SelectItem key={attr.value} value={attr.value}>
                                    <div className="flex items-center gap-2">
                                      <span>{attr.label}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {attr.type}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex-1">
                            <Label>Operator</Label>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                              disabled={!condition.attribute}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                {getOperatorsForAttribute(condition.attribute || '').map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {shouldShowValueInput(condition.operator || '') && (
                            <div className="flex-1">
                              <Label>Value</Label>
                              <Input
                                placeholder={getInputPlaceholder(
                                  condition.operator || '', 
                                  getSelectedAttribute(condition.attribute || '')?.type || 'string'
                                )}
                                value={condition.value}
                                onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                                disabled={!condition.operator}
                              />
                            </div>
                          )}
                        </div>
                        
                        {condition.operator && (
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <p className="text-blue-800 font-medium">
                              Operator Info: {getOperatorsForAttribute(condition.attribute || '').find(op => op.value === condition.operator)?.label}
                            </p>
                            {condition.operator === 'regex' && (
                              <p className="text-blue-600 text-xs mt-1">
                                Use standard regex patterns. Example: ^[A-Z].* (starts with uppercase letter)
                              </p>
                            )}
                            {condition.operator === 'like' && (
                              <p className="text-blue-600 text-xs mt-1">
                                Use SQL LIKE patterns. % for wildcard, _ for single character. Example: %gmail%
                              </p>
                            )}
                            {(condition.operator === 'in' || condition.operator === 'not_in') && (
                              <p className="text-blue-600 text-xs mt-1">
                                Enter comma-separated values. Example: value1,value2,value3
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label>Segment Tag</Label>
                          <Select
                            value={condition.segmentTag}
                            onValueChange={(value) => updateCondition(condition.id, 'segmentTag', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select segment tag" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockSegmentTags.map((tag) => (
                                <SelectItem key={tag.id} value={tag.name}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">{tag.name}</span>
                                    <span className="text-xs text-gray-500">({tag.userCount.toLocaleString()} users)</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {condition.segmentTag && (
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <p className="text-blue-800 font-medium">{getSelectedSegmentTag(condition.segmentTag)?.description}</p>
                            <p className="text-blue-600 text-xs mt-1">
                              Current users: {getSelectedSegmentTag(condition.segmentTag)?.userCount.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {conditions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No conditions added yet.</p>
                  <p className="text-sm">Add attribute conditions or segment tags to define your cohort.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Size Estimation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={calculateEstimate} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Size
              </Button>
              
              {estimatedSize !== null && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Estimated users</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {estimatedSize.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Segment Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockSegmentTags.slice(0, 5).map((tag) => (
                <div key={tag.id} className="p-2 border rounded text-sm">
                  <div className="font-mono text-xs text-blue-600">{tag.name}</div>
                  <div className="text-gray-600 text-xs">{tag.description}</div>
                  <div className="text-xs text-gray-500">{tag.userCount.toLocaleString()} users</div>
                </div>
              ))}
              <Link to="/segments" className="block">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Segment Tags
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleSave} className="w-full">
                Save Cohort
              </Button>
              <Button variant="outline" className="w-full">
                Save as Draft
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
