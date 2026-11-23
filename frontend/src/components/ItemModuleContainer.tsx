import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemListPage } from './items/ItemListPage';

export const ItemModuleContainer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ItemListPage
      onNavigateAdd={() => navigate('/items/add')}
      onNavigateEdit={(id) => navigate(`/items/edit/${id}`)}
    />
  );
};
