import React from 'react';
import { TransactionListPage } from './transactions';

export const TransactionPage: React.FC<{ onBackToDashboard?: () => void }> = ({ onBackToDashboard }) => {
  return <TransactionListPage onBackToDashboard={onBackToDashboard} />;
};

export default TransactionPage;
