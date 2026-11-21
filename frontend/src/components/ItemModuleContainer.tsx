import React, { useState } from 'react';
import { ItemListPage } from './ItemListPage';
import { ItemFormPage } from './ItemFormPage';
import { ItemRecord } from '../types';

export const ItemModuleContainer: React.FC = () => {
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);

  if (view === 'add') {
    return (
      <ItemFormPage
        item={null}
        onBack={() => setView('list')}
        onSaved={() => setView('list')}
      />
    );
  }

  if (view === 'edit' && editingItem) {
    return (
      <ItemFormPage
        item={editingItem}
        onBack={() => {
          setEditingItem(null);
          setView('list');
        }}
        onSaved={() => {
          setEditingItem(null);
          setView('list');
        }}
      />
    );
  }

  return (
    <ItemListPage
      onAddNew={() => setView('add')}
      onEditItem={(item) => {
        setEditingItem(item);
        setView('edit');
      }}
    />
  );
};
