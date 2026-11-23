import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyBalanceListPage } from './dailyBalance/DailyBalanceListPage';

interface DailyBalancePageProps {
  onBackToDashboard?: () => void;
}

export const DailyBalancePage: React.FC<DailyBalancePageProps> = ({ onBackToDashboard }) => {
  const navigate = useNavigate();

  return (
    <DailyBalanceListPage
      onBackToDashboard={onBackToDashboard}
      onNavigateAdd={() => navigate('/daily-balance/add')}
      onNavigateEdit={(id) => navigate(`/daily-balance/edit/${id}`)}
    />
  );
};
