import React, { useState } from 'react';
import { AccountGroupItem } from '../../types';
import { AccountGroupSelectionPage } from './AccountGroupSelectionPage';
import { AgeWiseReportPage, AgeWiseReportState } from './AgeWiseReportPage';
import { AgeWiseLedgerPage } from './AgeWiseLedgerPage';

interface AgeWiseModulePageProps {
  onBackToDashboard?: () => void;
}

type Screen = 'groups' | 'report' | 'ledger';

export const AgeWiseModulePage: React.FC<AgeWiseModulePageProps> = ({
  onBackToDashboard,
}) => {
  const [screen, setScreen] = useState<Screen>('groups');
  const [selectedGroups, setSelectedGroups] = useState<AccountGroupItem[]>([]);
  const [selectedPartyKey, setSelectedPartyKey] = useState<string>('');

  const [reportState, setReportState] = useState<AgeWiseReportState>({
    asOnDate: new Date().toISOString().split('T')[0],
    city: 'all',
    location: 'all',
    refBy: 'all',
    interval: 15,
    balanceType: 'gold',
    search: '',
    page: 1,
    limit: 25,
    sortBy: 'account_name',
    sortOrder: 'asc',
  });

  if (screen === 'groups') {
    return (
      <AccountGroupSelectionPage
        initialSelectedIds={selectedGroups.map((g) => g.id)}
        onApplySelection={(groups) => {
          setSelectedGroups(groups);
          setScreen('report');
        }}
        onCancel={() => {
          if (onBackToDashboard) {
            onBackToDashboard();
          } else {
            setScreen('report');
          }
        }}
      />
    );
  }

  if (screen === 'ledger') {
    return (
      <AgeWiseLedgerPage
        partyKey={selectedPartyKey}
        asOnDate={reportState.asOnDate}
        onBackToReport={() => setScreen('report')}
      />
    );
  }

  // screen === 'report'
  return (
    <AgeWiseReportPage
      selectedGroups={selectedGroups}
      state={reportState}
      onChangeState={setReportState}
      onChangeGroups={() => setScreen('groups')}
      onOpenLedger={(partyKey) => {
        setSelectedPartyKey(partyKey);
        setScreen('ledger');
      }}
    />
  );
};
