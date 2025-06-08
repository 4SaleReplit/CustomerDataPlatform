
import React from 'react';
import { useLocation } from 'wouter';
import CohortEditor from '@/components/cohorts/CohortEditor';

export default function CohortBuilder() {
  const [location, setLocation] = useLocation();

  const handleSave = (data: { name: string; description: string; conditions: any[] }) => {
    console.log('Saving cohort:', data);
    // Here you would typically call an API to save the cohort
    setLocation('/cohorts');
  };

  return (
    <CohortEditor 
      onSave={handleSave}
      title="Create New Cohort"
    />
  );
}
