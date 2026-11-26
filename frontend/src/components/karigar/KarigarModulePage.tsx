import React, { useState } from 'react';
import { Users2, Package, PackageCheck, TrendingDown, Layers, Gem } from 'lucide-react';
import { KarigarListPage } from './KarigarListPage';
import { KarigarAddPage } from './KarigarAddPage';
import { KarigarEditPage } from './KarigarEditPage';
import { KarigarIssueListPage } from './KarigarIssueListPage';
import { KarigarIssueAddPage } from './KarigarIssueAddPage';
import { KarigarIssueEditPage } from './KarigarIssueEditPage';
import { KarigarReceiveListPage } from './KarigarReceiveListPage';
import { KarigarReceiveAddPage } from './KarigarReceiveAddPage';
import { KarigarReportsPage, KarigarReportType } from './KarigarReportsPage';

type Section =
  | 'master'
  | 'issue'
  | 'receive'
  | 'outstanding'
  | 'issue-rec'
  | 'lot'
  | 'dia-stn-balance'
  | 'dia-stn-group'
  | 'dia-stn-issue-rec';

interface Props {
  onBackToDashboard: () => void;
}

const NAV_TABS: { id: Section; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'master',            label: 'Karigar Master',    icon: Users2 },
  { id: 'issue',             label: 'Issue',             icon: Package },
  { id: 'receive',           label: 'Receive',           icon: PackageCheck },
  { id: 'outstanding',       label: 'Outstanding',       icon: TrendingDown },
  { id: 'issue-rec',         label: 'Issue / Rec',       icon: Layers },
  { id: 'lot',               label: 'Lot Report',        icon: Layers },
  { id: 'dia-stn-balance',   label: 'Dia/Stn Balance',   icon: Gem },
  { id: 'dia-stn-group',     label: 'Dia/Stn Group Bal', icon: Gem },
  { id: 'dia-stn-issue-rec', label: 'Dia/Stn Issue/Rec', icon: Gem },
];

export const KarigarModulePage: React.FC<Props> = ({ onBackToDashboard }) => {
  const [section, setSection] = useState<Section>('master');
  const [subView, setSubView] = useState<'list' | 'add' | 'edit'>('list');
  const [editId, setEditId]   = useState<number>(0);

  const switchSection = (sec: Section) => {
    setSection(sec);
    setSubView('list');
    setEditId(0);
  };

  const renderContent = () => {
    if (section === 'master') {
      if (subView === 'add') return <KarigarAddPage onBackToList={() => setSubView('list')} />;
      if (subView === 'edit') return <KarigarEditPage recordId={editId} onBackToList={() => setSubView('list')} />;
      return (
        <KarigarListPage
          onBackToDashboard={onBackToDashboard}
          onNavigateAdd={() => setSubView('add')}
          onNavigateEdit={(id) => { setEditId(id); setSubView('edit'); }}
        />
      );
    }

    if (section === 'issue') {
      if (subView === 'add') return <KarigarIssueAddPage onBackToList={() => setSubView('list')} />;
      if (subView === 'edit') return <KarigarIssueEditPage recordId={editId} onBackToList={() => setSubView('list')} />;
      return (
        <KarigarIssueListPage
          onNavigateAdd={() => setSubView('add')}
          onNavigateEdit={(id) => { setEditId(id); setSubView('edit'); }}
        />
      );
    }

    if (section === 'receive') {
      if (subView === 'add') return <KarigarReceiveAddPage onBackToList={() => setSubView('list')} />;
      return <KarigarReceiveListPage onNavigateAdd={() => setSubView('add')} />;
    }

    return <KarigarReportsPage initialReport={section as KarigarReportType} />;
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9]">
      {/* Karigar Module Top Sub-Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {NAV_TABS.map(tab => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};
