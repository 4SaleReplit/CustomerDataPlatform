
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CohortEditor from '@/components/cohorts/CohortEditor';

export default function CohortBuilder() {
  const navigate = useNavigate();

  const handleSave = (data: { name: string; description: string; conditions: any[] }) => {
    console.log('Saving cohort:', data);
    // Here you would typically call an API to save the cohort
    navigate('/cohorts');
  };

  return (
    <CohortEditor 
      onSave={handleSave}
      title="Create New Cohort"
    />
  );
}
