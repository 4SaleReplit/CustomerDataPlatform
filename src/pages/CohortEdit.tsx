
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CohortEditor from '@/components/cohorts/CohortEditor';

// Mock cohort data - in a real app this would come from an API
const mockCohorts = [
  {
    id: 1,
    name: 'Premium Users',
    description: 'Users with premium account type',
    conditions: [
      {
        id: '1',
        type: 'attribute' as const,
        attribute: 'user_type',
        operator: 'equals',
        value: 'premium'
      }
    ]
  },
  {
    id: 2,
    name: 'Active Listers',
    description: 'Users who posted listings in the last 30 days',
    conditions: [
      {
        id: '1',
        type: 'attribute' as const,
        attribute: 'total_listings_count',
        operator: 'greater_than',
        value: '0'
      },
      {
        id: '2',
        type: 'attribute' as const,
        attribute: 'last_app_open_date',
        operator: 'in_last_days',
        value: '30',
        logicalOperator: 'AND' as const
      }
    ]
  }
];

export default function CohortEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Find the cohort by ID
  const cohort = mockCohorts.find(c => c.id === parseInt(id || '0'));
  
  if (!cohort) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-red-600">Cohort not found</h1>
        <p className="text-gray-600 mt-2">The cohort you're looking for doesn't exist.</p>
      </div>
    );
  }

  const handleSave = (data: { name: string; description: string; conditions: any[] }) => {
    console.log('Updating cohort:', { id, ...data });
    // Here you would typically call an API to update the cohort
    navigate('/cohorts');
  };

  return (
    <CohortEditor 
      initialName={cohort.name}
      initialDescription={cohort.description}
      initialConditions={cohort.conditions}
      onSave={handleSave}
      title={`Edit Cohort: ${cohort.name}`}
    />
  );
}
