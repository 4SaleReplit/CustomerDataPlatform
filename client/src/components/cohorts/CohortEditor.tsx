import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Plus, Trash2, Calculator, Tags, Play, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
  // Basic User Info
  { value: 'USER_ID', label: 'User ID', type: 'number' },
  { value: 'USER_TYPE', label: 'User Type', type: 'string' },
  { value: 'PHONE', label: 'Phone Number', type: 'string' },
  { value: 'CURRENT_CREDITS_IN_WALLET', label: 'Current Credits in Wallet', type: 'number' },
  { value: 'IS_BLOCK', label: 'Is Blocked', type: 'boolean' },
  
  // Date Fields
  { value: 'USER_ACCOUNT_CREATION_DATE', label: 'Account Creation Date', type: 'date' },
  { value: 'FIRST_PAID_LISTING_DATE', label: 'First Paid Listing Date', type: 'date' },
  { value: 'LAST_PAID_LISTING_DATE', label: 'Last Paid Listing Date', type: 'date' },
  { value: 'FIRST_TRANSACTION_DATE', label: 'First Transaction Date', type: 'date' },
  { value: 'LAST_TRANSACTION_DATE', label: 'Last Transaction Date', type: 'date' },
  
  // Activity Metrics
  { value: 'DAYS_SINCE_LAST_PAID_LISTING', label: 'Days Since Last Paid Listing', type: 'number' },
  { value: 'DAYS_SINCE_LAST_PAID_TRANSACTION', label: 'Days Since Last Paid Transaction', type: 'number' },
  { value: 'DAYS_SINCE_LAST_TRANSACTION', label: 'Days Since Last Transaction', type: 'number' },
  { value: 'ACTIVE_MONTHS_LAST_6', label: 'Active Months (Last 6)', type: 'number' },
  { value: 'ACTIVE_WEEKS_LAST_12', label: 'Active Weeks (Last 12)', type: 'number' },
  
  // Listing Counts
  { value: 'PAID_LISTINGS_COUNT', label: 'Paid Listings Count', type: 'number' },
  { value: 'FREE_LISTINGS_COUNT', label: 'Free Listings Count', type: 'number' },
  { value: 'TOTAL_LISTINGS_COUNT', label: 'Total Listings Count', type: 'number' },
  { value: 'OFFICE_LISTINGS_COUNT', label: 'Office Listings Count', type: 'number' },
  
  // Credits & Spending
  { value: 'TOTAL_CREDITS_SPENT', label: 'Total Credits Spent', type: 'number' },
  { value: 'TOTAL_PREMIUM_CREDITS_SPENT', label: 'Total Premium Credits Spent', type: 'number' },
  { value: 'TOTAL_FREE_CREDITS_SPENT', label: 'Total Free Credits Spent', type: 'number' },
  
  // Add-ons
  { value: 'EXTRA_ADDONS_COUNT', label: 'Extra Add-ons Count', type: 'number' },
  { value: 'EXTRA_ADDONS_TOTAL_CREDITS', label: 'Extra Add-ons Total Credits', type: 'number' },
  { value: 'EXTRA_ADDONS_PREMIUM_CREDITS', label: 'Extra Add-ons Premium Credits', type: 'number' },
  { value: 'EXTRA_ADDONS_FREE_CREDITS', label: 'Extra Add-ons Free Credits', type: 'number' },
  
  // Arrays & Categories
  { value: 'VERTICALS_LISTED_IN', label: 'Verticals Listed In', type: 'array' },
  { value: 'LEVELS_1_LISTED_IN', label: 'Level 1 Categories Listed In', type: 'array' },
  { value: 'PLANS_OR_BUNDLES_USED', label: 'Plans or Bundles Used', type: 'array' },
  
  // Favorites & Preferences
  { value: 'FAVORITE_VERTICAL', label: 'Favorite Vertical', type: 'string' },
  { value: 'FAVORITE_LEVEL_1', label: 'Favorite Level 1 Category', type: 'string' },
  { value: 'FAVORITE_PLAN_OR_BUNDLE', label: 'Favorite Plan or Bundle', type: 'string' },
  { value: 'FAVORITE_EXTRA_ADDON', label: 'Favorite Extra Add-on', type: 'string' },
  { value: 'TOP_EXTRA_ADDONS', label: 'Top Extra Add-ons', type: 'string' },
  
  // Category Counts
  { value: 'NUMBER_OF_VERTICALS_LISTED_IN', label: 'Number of Verticals Listed In', type: 'number' },
  { value: 'NUMBER_OF_LEVEL1_CATEGORIES_LISTED_IN', label: 'Number of Level 1 Categories Listed In', type: 'number' },
  { value: 'IS_MULTIVERTICAL_USER', label: 'Is Multi-Vertical User', type: 'boolean' },
  
  // Plan-specific Listings
  { value: 'BASIC_LISTINGS_COUNT', label: 'Basic Listings Count', type: 'number' },
  { value: 'BASIC_CREDITS_SPENT', label: 'Basic Credits Spent', type: 'number' },
  { value: 'PRO_LISTINGS_COUNT', label: 'Pro Listings Count', type: 'number' },
  { value: 'PRO_CREDITS_SPENT', label: 'Pro Credits Spent', type: 'number' },
  { value: 'EXTRA_LISTINGS_COUNT', label: 'Extra Listings Count', type: 'number' },
  { value: 'EXTRA_CREDITS_SPENT', label: 'Extra Credits Spent', type: 'number' },
  { value: 'PLUS_LISTINGS_COUNT', label: 'Plus Listings Count', type: 'number' },
  { value: 'PLUS_CREDITS_SPENT', label: 'Plus Credits Spent', type: 'number' },
  { value: 'SUPER_LISTINGS_COUNT', label: 'Super Listings Count', type: 'number' },
  { value: 'SUPER_CREDITS_SPENT', label: 'Super Credits Spent', type: 'number' },
  { value: 'STANDARD_LISTINGS_COUNT', label: 'Standard Listings Count', type: 'number' },
  { value: 'STANDARD_CREDITS_SPENT', label: 'Standard Credits Spent', type: 'number' },
  { value: 'PREMIUM_LISTINGS_COUNT', label: 'Premium Listings Count', type: 'number' },
  { value: 'PREMIUM_CREDITS_SPENT', label: 'Premium Credits Spent', type: 'number' },
  { value: 'OPTIMUM_LISTINGS_COUNT', label: 'Optimum Listings Count', type: 'number' },
  { value: 'OPTIMUM_CREDITS_SPENT', label: 'Optimum Credits Spent', type: 'number' },
  
  // Office-specific Listings
  { value: 'CAR_OFFICES_LISTINGS_COUNT', label: 'Car Offices Listings Count', type: 'number' },
  { value: 'CAR_OFFICES_CREDITS_SPENT', label: 'Car Offices Credits Spent', type: 'number' },
  { value: 'PROPERTY_OFFICES_LISTINGS_COUNT', label: 'Property Offices Listings Count', type: 'number' },
  { value: 'PROPERTY_OFFICES_CREDITS_SPENT', label: 'Property Offices Credits Spent', type: 'number' },
  { value: 'ELECTRONICS_SHOPS_LISTINGS_COUNT', label: 'Electronics Shops Listings Count', type: 'number' },
  { value: 'ELECTRONICS_SHOPS_CREDITS_SPENT', label: 'Electronics Shops Credits Spent', type: 'number' },
  
  // Add-on specific Listings
  { value: 'ADDON_PINNING_LISTINGS_COUNT', label: 'Add-on Pinning Listings Count', type: 'number' },
  { value: 'ADDON_PINNING_CREDITS_SPENT', label: 'Add-on Pinning Credits Spent', type: 'number' },
  { value: 'ADDON_EXTENDED_LISTINGS_COUNT', label: 'Add-on Extended Listings Count', type: 'number' },
  { value: 'ADDON_EXTENDED_CREDITS_SPENT', label: 'Add-on Extended Credits Spent', type: 'number' },
  { value: 'ADDON_PROMOTED_LISTINGS_COUNT', label: 'Add-on Promoted Listings Count', type: 'number' },
  { value: 'ADDON_PROMOTED_CREDITS_SPENT', label: 'Add-on Promoted Credits Spent', type: 'number' },
  { value: 'ADDON_PINNING_SHUFFLE_LISTINGS_COUNT', label: 'Add-on Pinning Shuffle Listings Count', type: 'number' },
  { value: 'ADDON_PINNING_SHUFFLE_CREDITS_SPENT', label: 'Add-on Pinning Shuffle Credits Spent', type: 'number' },
  { value: 'ADDON_PREMIUM_LISTINGS_COUNT', label: 'Add-on Premium Listings Count', type: 'number' },
  { value: 'ADDON_PREMIUM_CREDITS_SPENT', label: 'Add-on Premium Credits Spent', type: 'number' },
  { value: 'ADDON_POWER_PIN_LISTINGS_COUNT', label: 'Add-on Power Pin Listings Count', type: 'number' },
  { value: 'ADDON_POWER_PIN_CREDITS_SPENT', label: 'Add-on Power Pin Credits Spent', type: 'number' },
  { value: 'ADDON_REFRESH_LISTINGS_COUNT', label: 'Add-on Refresh Listings Count', type: 'number' },
  { value: 'ADDON_REFRESH_CREDITS_SPENT', label: 'Add-on Refresh Credits Spent', type: 'number' },
  { value: 'ADDON_VIP_LISTINGS_COUNT', label: 'Add-on VIP Listings Count', type: 'number' },
  { value: 'ADDON_VIP_CREDITS_SPENT', label: 'Add-on VIP Credits Spent', type: 'number' },
  
  // Offers
  { value: 'OFFER_50_DAYS_USED', label: 'Offer 50% Days Used', type: 'number' },
  { value: 'OFFER_BARAKA_DAYS_USED', label: 'Offer Baraka Days Used', type: 'number' },
  { value: 'OFFER_TOTAL_DAYS_USED', label: 'Offer Total Days Used', type: 'number' },
  { value: 'OFFER_50_PERCENTAGE', label: 'Offer 50% Percentage', type: 'number' },
  { value: 'OFFER_BARAKA_PERCENTAGE', label: 'Offer Baraka Percentage', type: 'number' },
  { value: 'OFFER_TOTAL_PERCENTAGE', label: 'Offer Total Percentage', type: 'number' }
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

const booleanOperators = [
  { value: 'equals', label: 'Is True' },
  { value: 'not_equals', label: 'Is False' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' }
];

const arrayOperators = [
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'contains_all', label: 'Contains All' },
  { value: 'contains_any', label: 'Contains Any' },
  { value: 'array_length_equals', label: 'Array Length Equals' },
  { value: 'array_length_greater_than', label: 'Array Length Greater Than' },
  { value: 'array_length_less_than', label: 'Array Length Less Than' },
  { value: 'is_empty', label: 'Is Empty Array' },
  { value: 'is_not_empty', label: 'Is Not Empty Array' },
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
  const [sqlQuery, setSqlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<{ count: number; userIds: string[] } | null>(null);
  const { toast } = useToast();

  const getOperatorsForAttribute = (attributeValue: string) => {
    const attribute = userAttributes.find(attr => attr.value === attributeValue);
    if (!attribute) return stringOperators;
    
    switch (attribute.type) {
      case 'number':
        return numberOperators;
      case 'date':
        return dateOperators;
      case 'boolean':
        return booleanOperators;
      case 'array':
        return arrayOperators;
      case 'string':
      default:
        return stringOperators;
    }
  };

  const getInputPlaceholder = (operator: string, attributeType: string) => {
    // Array type placeholders
    if (attributeType === 'array') {
      if (operator === 'contains' || operator === 'not_contains') return 'Enter value to search in array';
      if (operator === 'contains_all' || operator === 'contains_any') return 'Enter comma-separated values';
      if (operator.includes('array_length_')) return 'Enter number';
      return 'Enter array value';
    }
    
    // Boolean type (no value input needed for most boolean operators)
    if (attributeType === 'boolean') {
      return 'No value needed';
    }
    
    // String type placeholders
    if (operator === 'regex') return 'Enter regex pattern (e.g., ^[A-Z].*)';
    if (operator === 'like') return 'Enter SQL pattern (e.g., %example%)';
    if (operator === 'in' || operator === 'not_in') return 'Enter comma-separated values';
    
    // Number type placeholders
    if (attributeType === 'number') {
      if (operator === 'between' || operator === 'not_between') return 'Enter range (e.g., 10,100)';
      return 'Enter number';
    }
    
    // Date type placeholders
    if (attributeType === 'date') {
      if (operator.includes('in_last_') || operator.includes('in_next_')) return 'Enter number of days/weeks/months/years';
      if (operator === 'before' || operator === 'after' || operator === 'equals') return 'YYYY-MM-DD or YYYY-MM-DD HH:MM:SS';
      if (operator === 'between') return 'Start date, End date (YYYY-MM-DD)';
      return 'Enter date (YYYY-MM-DD)';
    }
    
    return 'Enter value';
  };

  const shouldShowValueInput = (operator: string, attributeType: string = 'string') => {
    // Boolean operators typically don't need value input except for null checks
    if (attributeType === 'boolean') {
      return ['is_null', 'is_not_null'].includes(operator);
    }
    
    // Array operators that don't need value input
    if (attributeType === 'array') {
      return !['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(operator);
    }
    
    // General operators that don't need value input
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

  const handleSave = async () => {
    if (!cohortName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a cohort name",
        variant: "destructive"
      });
      return;
    }

    if (conditions.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one condition",
        variant: "destructive"
      });
      return;
    }

    try {
      const cohortData = {
        name: cohortName,
        description: cohortDescription || '',
        conditions: conditions,
        calculationQuery: sqlQuery,
        userCount: queryResult?.count || 0,
        status: 'active' as const,
        syncStatus: 'not_synced' as const
      };

      await apiRequest('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cohortData)
      });

      toast({
        title: "Cohort saved successfully",
        description: `Created cohort "${cohortName}" with ${queryResult?.count || 0} users.`
      });

      // Call the original onSave for navigation
      onSave({
        name: cohortName,
        description: cohortDescription,
        conditions: conditions
      });

    } catch (error) {
      console.error('Save cohort error:', error);
      toast({
        title: "Failed to save cohort",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const getSelectedSegmentTag = (tagName: string) => {
    return mockSegmentTags.find(tag => tag.name === tagName);
  };

  const getSelectedAttribute = (attributeValue: string) => {
    return userAttributes.find(attr => attr.value === attributeValue);
  };

  const buildSqlCondition = (condition: Condition): string => {
    if (condition.type === 'segment') {
      // For segments, we'll assume they're stored as tags or computed fields
      return `${condition.segmentTag} = 1`;
    }

    if (!condition.attribute || !condition.operator) return '';

    const attribute = condition.attribute;
    const operator = condition.operator;
    const value = condition.value || '';
    const attributeType = getSelectedAttribute(attribute)?.type || 'string';

    switch (operator) {
      case 'equals':
        if (attributeType === 'boolean') return `${attribute} = 1`;
        if (attributeType === 'string') return `${attribute} = '${value}'`;
        return `${attribute} = ${value}`;
      
      case 'not_equals':
        if (attributeType === 'boolean') return `${attribute} = 0`;
        if (attributeType === 'string') return `${attribute} != '${value}'`;
        return `${attribute} != ${value}`;
      
      case 'greater_than':
        return `${attribute} > ${value}`;
      
      case 'less_than':
        return `${attribute} < ${value}`;
      
      case 'greater_than_equal':
        return `${attribute} >= ${value}`;
      
      case 'less_than_equal':
        return `${attribute} <= ${value}`;
      
      case 'contains':
        if (attributeType === 'array') return `ARRAY_CONTAINS(${attribute}, '${value}')`;
        return `${attribute} LIKE '%${value}%'`;
      
      case 'not_contains':
        if (attributeType === 'array') return `NOT ARRAY_CONTAINS(${attribute}, '${value}')`;
        return `${attribute} NOT LIKE '%${value}%'`;
      
      case 'starts_with':
        return `${attribute} LIKE '${value}%'`;
      
      case 'ends_with':
        return `${attribute} LIKE '%${value}'`;
      
      case 'between':
        const [min, max] = value.split(',').map(v => v.trim());
        if (attributeType === 'date') return `${attribute} BETWEEN '${min}' AND '${max}'`;
        return `${attribute} BETWEEN ${min} AND ${max}`;
      
      case 'in':
        const inValues = value.split(',').map(v => v.trim());
        if (attributeType === 'string') {
          return `${attribute} IN (${inValues.map(v => `'${v}'`).join(', ')})`;
        }
        return `${attribute} IN (${inValues.join(', ')})`;
      
      case 'not_in':
        const notInValues = value.split(',').map(v => v.trim());
        if (attributeType === 'string') {
          return `${attribute} NOT IN (${notInValues.map(v => `'${v}'`).join(', ')})`;
        }
        return `${attribute} NOT IN (${notInValues.join(', ')})`;
      
      case 'is_null':
        return `${attribute} IS NULL`;
      
      case 'is_not_null':
        return `${attribute} IS NOT NULL`;
      
      case 'is_empty':
        if (attributeType === 'array') return `ARRAY_SIZE(${attribute}) = 0`;
        return `${attribute} = ''`;
      
      case 'is_not_empty':
        if (attributeType === 'array') return `ARRAY_SIZE(${attribute}) > 0`;
        return `${attribute} != ''`;
      
      case 'like':
        return `${attribute} LIKE '${value}'`;
      
      case 'regex':
        return `REGEXP_LIKE(${attribute}, '${value}')`;
      
      case 'before':
        return `${attribute} < '${value}'`;
      
      case 'after':
        return `${attribute} > '${value}'`;
      
      case 'in_last_days':
        return `${attribute} >= CURRENT_DATE - INTERVAL ${value} DAY`;
      
      case 'in_last_weeks':
        return `${attribute} >= CURRENT_DATE - INTERVAL ${value} WEEK`;
      
      case 'in_last_months':
        return `${attribute} >= CURRENT_DATE - INTERVAL ${value} MONTH`;
      
      case 'in_last_years':
        return `${attribute} >= CURRENT_DATE - INTERVAL ${value} YEAR`;
      
      case 'contains_all':
        const allValues = value.split(',').map(v => v.trim());
        return allValues.map(v => `ARRAY_CONTAINS(${attribute}, '${v}')`).join(' AND ');
      
      case 'contains_any':
        const anyValues = value.split(',').map(v => v.trim());
        return `(${anyValues.map(v => `ARRAY_CONTAINS(${attribute}, '${v}')`).join(' OR ')})`;
      
      case 'array_length_equals':
        return `ARRAY_SIZE(${attribute}) = ${value}`;
      
      case 'array_length_greater_than':
        return `ARRAY_SIZE(${attribute}) > ${value}`;
      
      case 'array_length_less_than':
        return `ARRAY_SIZE(${attribute}) < ${value}`;
      
      default:
        return '';
    }
  };

  const buildSqlQuery = (conditions: Condition[]): string => {
    const baseQuery = 'SELECT USER_ID FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4';
    
    if (conditions.length === 0) {
      return baseQuery;
    }

    const validConditions = conditions.filter(condition => {
      if (condition.type === 'segment') return condition.segmentTag;
      return condition.attribute && condition.operator;
    });

    if (validConditions.length === 0) {
      return baseQuery;
    }

    const whereClause = validConditions.map((condition, index) => {
      const sqlCondition = buildSqlCondition(condition);
      if (index === 0) return sqlCondition;
      
      const logicalOp = condition.logicalOperator || 'AND';
      return `${logicalOp} ${sqlCondition}`;
    }).join('\n  ');

    return `${baseQuery}\nWHERE ${whereClause}`;
  };

  // Build SQL query whenever conditions change
  useEffect(() => {
    const query = buildSqlQuery(conditions);
    setSqlQuery(query);
  }, [conditions]);

  const executeSqlQuery = async () => {
    if (!sqlQuery.trim() || conditions.length === 0) {
      toast({
        title: "No conditions",
        description: "Please add at least one condition before executing the query.",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Execute count query
      const countQuery = sqlQuery.replace('SELECT USER_ID', 'SELECT COUNT(*) as count');
      const countResult = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: countQuery })
      });

      if (!countResult.success) {
        throw new Error(countResult.error || 'Query execution failed');
      }

      const count = countResult.rows[0][0];

      // Execute limited query to get sample user IDs
      const limitedQuery = `${sqlQuery}\nLIMIT 100`;
      const userResult = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: limitedQuery })
      });

      if (!userResult.success) {
        throw new Error(userResult.error || 'User query execution failed');
      }

      const userIds = userResult.rows.map((row: any[]) => row[0].toString());

      setQueryResult({ count, userIds });
      setEstimatedSize(count);

      toast({
        title: "Query executed successfully",
        description: `Found ${count} users matching the criteria.`
      });

    } catch (error) {
      console.error('Query execution error:', error);
      toast({
        title: "Query execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlQuery);
    toast({
      title: "SQL copied",
      description: "The SQL query has been copied to your clipboard."
    });
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

                          {shouldShowValueInput(condition.operator || '', getSelectedAttribute(condition.attribute || '')?.type || 'string') && (
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

          {/* SQL Query Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                SQL Query Preview
                <div className="flex gap-2">
                  <Button
                    onClick={copySqlToClipboard}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    onClick={executeSqlQuery}
                    disabled={isExecuting || conditions.length === 0}
                    variant="default"
                    size="sm"
                    className="h-8 px-3"
                  >
                    {isExecuting ? (
                      <>Executing...</>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Execute Query
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border">
                <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
                  {sqlQuery || 'SELECT USER_ID FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'}
                </pre>
              </div>
              
              {queryResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Total Users Found: {queryResult.count.toLocaleString()}
                    </span>
                  </div>
                  
                  {queryResult.userIds.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700 dark:text-gray-300">
                        Sample User IDs (first 100 results):
                      </Label>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border max-h-40 overflow-y-auto">
                        <div className="text-sm font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
                          {queryResult.userIds.slice(0, 30).join(', ')}
                          {queryResult.userIds.length > 30 && ' ...'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {conditions.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Add conditions above to build and preview your SQL query
                </p>
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
