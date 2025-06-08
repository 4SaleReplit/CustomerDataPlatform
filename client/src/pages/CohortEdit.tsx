import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import CohortEditor from '@/components/cohorts/CohortEditor';

export default function CohortEdit() {
  const [location, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  
  // Fetch cohort data from database
  const { data: cohortData, isLoading, error } = useQuery({
    queryKey: ['/api/cohorts', id],
    queryFn: () => apiRequest(`/api/cohorts/${id}`),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading cohort...</div>
        </div>
      </div>
    );
  }

  if (error || !cohortData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Error loading cohort</div>
          <div className="text-sm text-gray-600 mt-2">
            {error?.message || 'Cohort not found'}
          </div>
        </div>
      </div>
    );
  }

  // Parse conditions from database JSON
  const conditions = Array.isArray(cohortData.conditions) ? cohortData.conditions : [];

  const handleSave = async (data: { name: string; description: string; conditions: any[] }) => {
    try {
      await apiRequest(`/api/cohorts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          conditions: data.conditions
        }),
      });
      
      // Redirect back to cohorts list after successful update
      setLocation('/cohorts');
    } catch (error) {
      console.error('Failed to update cohort:', error);
      // Handle error - could show a toast notification
    }
  };

  return (
    <CohortEditor 
      initialName={cohortData.name}
      initialDescription={cohortData.description || ''}
      initialConditions={conditions}
      onSave={handleSave}
      title={`Edit Cohort: ${cohortData.name}`}
      backUrl="/cohorts"
    />
  );
}