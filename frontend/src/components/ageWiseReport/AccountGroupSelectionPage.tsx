
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Layers,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AccountGroupItem } from '../../types';
import { fetchAgeWiseGroups } from '../../services/api';

interface AccountGroupSelectionPageProps {
  initialSelectedIds: number[];
  onApplySelection: (selectedGroups: AccountGroupItem[]) => void;
  onCancel: () => void;
}

export const AccountGroupSelectionPage: React.FC<AccountGroupSelectionPageProps> = ({
  onApplySelection,
  onCancel,
}) => {
  const [groups, setGroups] = useState<AccountGroupItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    document.title = 'Age-wise-list | Rudra Silver';
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');

    fetchAgeWiseGroups('')
      .then((list) => {
        setGroups(list);
      })
      .catch((err) => {
        console.error('Failed to load account groups:', err);
        setError('Failed to load account groups. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return groups;

    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.nature || '').toLowerCase().includes(q)
    );
  }, [groups, search]);

  const handleGroupClick = (group: AccountGroupItem) => {
    // Open Age Wise Report directly for the clicked account group
    onApplySelection([group]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Layers className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Select Account Groups
                </h1>

                <p className="text-xs text-slate-500 mt-1">
                  Click on an account group to open its Age Wise Report
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 flex items-center justify-center transition-all duration-200"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Account Groups Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Search */}
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by group name or nature..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200"
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-medium text-slate-500">
                {filteredGroups.length} Account Groups
              </span>

              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          {/* Group List */}
          <div className="max-h-[520px] overflow-y-auto">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-sm font-medium">
                  Loading account groups...
                </span>
              </div>
            ) : error ? (
              <div className="py-12 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                {search.trim()
                  ? 'No groups match your search.'
                  : 'No account groups found.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupClick(group)}
                    className="group w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-left bg-white hover:bg-blue-50/70 border-l-[3px] border-l-transparent hover:border-l-blue-600 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                  >
                    {/* Group Icon */}
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-all duration-200">
                      <Layers className="w-5 h-5" />
                    </div>

                    {/* Group Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                        {group.name}
                      </div>

                      {group.nature && (
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          {group.nature}
                        </div>
                      )}
                    </div>

                    {/* Open Report */}
                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-100 transition-all duration-200">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/70">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-blue-600">Tip:</span>{' '}
              Click any account group name to view its Age Wise Report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
