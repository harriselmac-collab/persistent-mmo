'use client';

import { useGameContext } from '../layout';
import { useState, useRef, useEffect } from 'react';
import {
  Factory,
  Coins,
  Users,
  Boxes,
  FileText,
  Plus,
  Clock,
  ArrowRightLeft,
  UserX,
  Wrench,
  ShieldAlert,
  DollarSign,
  Briefcase,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Scale
} from 'lucide-react';

export default function IndustrialPage() {
  const {
    myCompanies,
    companyTemplates,
    productionRecipes,
    productionInputs,
    companyJobs,
    activeCompanyId,
    activeCompanyMembers,
    activeCompanyInventory,
    activeCompanyVault,
    activeCompanyProductionQueue,
    activeCompanyLogs,
    regions,
    countries,
    currencies,
    resources,
    playerResources,
    stats,
    createCompany,
    vaultCashTransfer,
    vaultResourceTransfer,
    postCompanyJob,
    applyJob,
    resignFromCompany,
    terminateEmployee,
    setEmployeeSalary,
    queueJob,
    runCompanyShift,
    selectCompany,
    refreshData,
    actionLoading,
    claimFunding
  } = useGameContext();

  // Navigation tab selections
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'vault' | 'staff' | 'production' | 'logs'>('overview');
  const [unemployedTab, setUnemployedTab] = useState<'board' | 'create'>('board');

  // Input forms
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyRegion, setNewCompanyRegion] = useState(1);
  const [newCompanyTemplate, setNewCompanyTemplate] = useState(1);

  const [vaultCashAmount, setVaultCashAmount] = useState('');
  const [vaultResourceQty, setVaultResourceQty] = useState<Record<number, string>>({});
  
  const [jobSalary, setJobSalary] = useState('');
  const [jobVacancies, setJobVacancies] = useState('');
  const [jobRegion, setJobRegion] = useState(1);

  const [queueQuantity, setQueueQuantity] = useState<Record<number, string>>({});

  const [salaryEdits, setSalaryEdits] = useState<Record<string, string>>({});
  
  // Work shift progress tracker
  const [shiftProgress, setShiftProgress] = useState(0);
  const [activeShiftCompId, setActiveShiftCompId] = useState<string | null>(null);
  const shiftTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Errors & Banners
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeCompany = myCompanies.find((c) => c.id === activeCompanyId);
  const activeTemplate = activeCompany ? companyTemplates.find((t) => t.id === (activeCompany as any).template_id) : null;
  const isOwner = activeCompany?.owner_id === stats?.profile_id;
  
  // Fetch employee role in active company
  const activeMemberRecord = activeCompanyMembers.find((m) => m.profile_id === stats?.profile_id);
  const activeRole = activeMemberRecord?.role || 'Employee';

  useEffect(() => {
    return () => {
      if (shiftTimerRef.current) clearInterval(shiftTimerRef.current);
    };
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newCompanyName.trim()) {
      setError('Company name is required.');
      return;
    }

    const res = await createCompany(newCompanyName, Number(newCompanyRegion), Number(newCompanyTemplate));
    if (res.success) {
      setSuccess(`Company "${newCompanyName}" successfully incorporated!`);
      setNewCompanyName('');
      setDashboardTab('overview');
    } else {
      setError(res.error || 'Failed to create company.');
    }
  };

  const handleClaimFunding = async () => {
    setError(null);
    setSuccess(null);
    const res = await claimFunding();
    if (res.success) {
      setSuccess('Deposited +1000 LC developer test funding into your wallet.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to claim dev funding.');
    }
  };

  const handleVaultCash = async (isDeposit: boolean) => {
    setError(null);
    setSuccess(null);
    const amt = parseFloat(vaultCashAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    if (!activeCompanyId) return;
    const res = await vaultCashTransfer(activeCompanyId, amt, isDeposit);
    if (res.success) {
      setSuccess(isDeposit ? `Successfully deposited ${amt} LC.` : `Successfully withdrew ${amt} LC.`);
      setVaultCashAmount('');
    } else {
      setError(res.error || 'Vault cash transaction failed.');
    }
  };

  const handleVaultResource = async (resourceId: number, isDeposit: boolean) => {
    setError(null);
    setSuccess(null);
    const qtyStr = vaultResourceQty[resourceId] || '';
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      setError('Enter a valid resource quantity.');
      return;
    }

    if (!activeCompanyId) return;
    const res = await vaultResourceTransfer(activeCompanyId, resourceId, qty, isDeposit);
    if (res.success) {
      setSuccess(isDeposit ? `Deposited ${qty} items.` : `Withdrew ${qty} items.`);
      setVaultResourceQty((prev) => ({ ...prev, [resourceId]: '' }));
    } else {
      setError(res.error || 'Resource vault transaction failed.');
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const sal = parseFloat(jobSalary);
    const vac = parseInt(jobVacancies);

    if (isNaN(sal) || sal <= 0) {
      setError('Wage must be a valid number.');
      return;
    }
    if (isNaN(vac) || vac <= 0) {
      setError('Vacancies count is required.');
      return;
    }

    if (!activeCompanyId) return;
    const res = await postCompanyJob(activeCompanyId, Number(jobRegion), sal, vac);
    if (res.success) {
      setSuccess('Job offer posted successfully to the labor market board.');
      setJobSalary('');
      setJobVacancies('');
    } else {
      setError(res.error || 'Failed to post job.');
    }
  };

  const handleApplyJob = async (jobId: string, companyName: string) => {
    setError(null);
    setSuccess(null);
    const res = await applyJob(jobId);
    if (res.success) {
      setSuccess(`Contract signed. You are now employed by ${companyName}!`);
      setDashboardTab('overview');
    } else {
      setError(res.error || 'Failed to apply.');
    }
  };

  const handleResign = async () => {
    if (!activeCompanyId) return;
    setError(null);
    setSuccess(null);
    const res = await resignFromCompany(activeCompanyId);
    if (res.success) {
      setSuccess('Successfully resigned from employment.');
    } else {
      setError(res.error || 'Failed to resign.');
    }
  };

  const handleTerminate = async (employeeId: string, employeeName: string) => {
    if (!activeCompanyId) return;
    setError(null);
    setSuccess(null);
    const res = await terminateEmployee(activeCompanyId, employeeId);
    if (res.success) {
      setSuccess(`Contract terminated for ${employeeName}.`);
    } else {
      setError(res.error || 'Failed to terminate employee.');
    }
  };

  const handleSetSalary = async (employeeId: string) => {
    if (!activeCompanyId) return;
    setError(null);
    setSuccess(null);
    const newSal = parseFloat(salaryEdits[employeeId] || '');
    if (isNaN(newSal) || newSal <= 0) {
      setError('Enter a valid shift salary.');
      return;
    }

    const res = await setEmployeeSalary(activeCompanyId, employeeId, newSal);
    if (res.success) {
      setSuccess('Salary updated successfully.');
      setSalaryEdits((prev) => ({ ...prev, [employeeId]: '' }));
    } else {
      setError(res.error || 'Failed to update salary.');
    }
  };

  const handleQueueRecipe = async (recipeId: number, recipeName: string) => {
    setError(null);
    setSuccess(null);
    const qtyStr = queueQuantity[recipeId] || '';
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      setError('Enter a valid batch size.');
      return;
    }

    if (!activeCompanyId) return;
    const res = await queueJob(activeCompanyId, recipeId, qty);
    if (res.success) {
      setSuccess(`Queued batch of x${qty} ${recipeName} production jobs.`);
      setQueueQuantity((prev) => ({ ...prev, [recipeId]: '' }));
    } else {
      setError(res.error || 'Failed to queue recipe.');
    }
  };

  const handlePerformShift = () => {
    if (shiftProgress > 0 || !activeCompanyId) return;
    setError(null);
    setSuccess(null);

    // Energy checklist pre-flight check
    if (stats && stats.energy < 10) {
      setError('Insufficient energy. Working shifts consumes 10 EP.');
      return;
    }

    // Vault cash checklist pre-flight check
    if (activeCompanyVault && activeCompanyVault.local_currency < (activeMemberRecord?.salary || 0.00)) {
      setError('The company has insufficient vault cash reserves to pay your shift salary.');
      return;
    }

    setActiveShiftCompId(activeCompanyId);
    setShiftProgress(0);

    const shiftDurationMs = 2500; // 2.5s work shift micro-animation
    const steps = 50;
    const intervalMs = shiftDurationMs / steps;
    let stepCount = 0;

    shiftTimerRef.current = setInterval(async () => {
      stepCount++;
      setShiftProgress(Math.min(100, Math.round((stepCount / steps) * 100)));

      if (stepCount >= steps) {
        if (shiftTimerRef.current) clearInterval(shiftTimerRef.current);
        
        // Execute shift
        const res = await runCompanyShift(activeCompanyId);
        if (res.success) {
          setSuccess(`Shift complete! Salary paid: +${res.salaryEarned} LC. Gained +${res.expRewarded} XP.`);
          refreshData();
        } else {
          setError(res.error || 'Shift processing failed.');
        }

        setShiftProgress(0);
        setActiveShiftCompId(null);
      }
    }, intervalMs);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'text-game-gold bg-zinc-950 border-game-gold/30';
      case 'Director':
        return 'text-purple-400 bg-zinc-950 border-purple-900/30';
      case 'Manager':
        return 'text-indigo-400 bg-zinc-950 border-indigo-900/30';
      case 'Accountant':
        return 'text-game-emerald bg-zinc-950 border-emerald-900/30';
      default:
        return 'text-zinc-550 bg-zinc-950 border-zinc-900';
    }
  };

  // If player is not associated with any company
  if (myCompanies.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        
        {/* Messages */}
        {error && (
          <div className="rpg-panel-stone border-red-900/60 text-red-400 p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="rpg-panel-stone border-game-gold/40 text-game-emerald p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
            <Sparkles className="h-5 w-5 shrink-0 text-game-gold-dark" />
            <span>{success}</span>
          </div>
        )}

        {/* Overview banner */}
        <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border-none">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="absolute right-0 top-0 h-40 w-40 bg-zinc-700/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 text-left relative z-10">
            <div className="p-3.5 bg-zinc-950 border border-zinc-900 text-game-gold rounded-none shrink-0 shadow-inner">
              <Factory className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold font-display text-game-gold uppercase tracking-wider filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">Industrial & Labor Command</h2>
              <p className="text-zinc-500 text-xs font-serif mt-0.5">Construct raw camps or seek active job contracts in manufacturing plants.</p>
            </div>
          </div>

          <div className="flex bg-zinc-950 border border-zinc-900 p-0.5 rounded-none relative z-10">
            <button
              onClick={() => setUnemployedTab('board')}
              className={`px-4 py-2 text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 rounded-none ${
                unemployedTab === 'board' ? 'bg-game-gold text-zinc-950 font-black shadow-sm' : 'text-zinc-500 hover:text-game-gold'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Job Board</span>
            </button>
            <button
              onClick={() => setUnemployedTab('create')}
              className={`px-4 py-2 text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 rounded-none ${
                unemployedTab === 'create' ? 'bg-game-gold text-zinc-950 font-black shadow-sm' : 'text-zinc-500 hover:text-game-gold'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Incorporate</span>
            </button>
          </div>
        </div>

        {/* Render Tab 1: Labor Board */}
        {unemployedTab === 'board' && (
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 border-none relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-sm font-bold font-display text-game-gold uppercase tracking-widest border-b border-zinc-900 pb-3 relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Available Job Offerings</h3>
            
            <div className="flex flex-col gap-3 relative z-10">
              {companyJobs.length === 0 ? (
                <div className="py-12 text-center text-zinc-550 font-serif text-xs">
                  No active company employment ads posted on the board. Create your own company or check back later!
                </div>
              ) : (
                companyJobs.map((job) => {
                  const regName = regions.find((r) => r.id === job.region_id)?.name || `Region #${job.region_id}`;
                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-none bg-zinc-950/60 border border-zinc-900 hover:border-game-gold/30 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                        <div className="p-2 bg-zinc-900 border border-zinc-800 text-game-gold rounded-none shrink-0 shadow-inner">
                          <Briefcase className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-200 font-display tracking-wide">{job.company_name}</span>
                          <span className="text-[10px] text-zinc-500 font-serif mt-1">Sector Region: {regName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t border-zinc-900 pt-3 sm:pt-0 sm:border-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-zinc-550 font-display uppercase tracking-widest">Shift Salary</span>
                          <span className="text-sm font-bold font-pixel text-game-emerald mt-0.5">{job.salary} LC</span>
                        </div>
                        <button
                          onClick={() => handleApplyJob(job.id, job.company_name || '')}
                          className="rpg-button px-4 py-2 text-xs font-display uppercase tracking-widest select-none"
                        >
                          Sign Contract
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Render Tab 2: Create Wizard */}
        {unemployedTab === 'create' && (
          <div className="max-w-2xl mx-auto w-full rpg-panel-stone p-6 rounded-none border-none relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-sm font-bold font-display text-game-gold uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-2 relative z-10 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">
              <Plus className="h-4.5 w-4.5 text-game-gold" />
              <span>Incorporate New Company</span>
            </h3>

            <form onSubmit={handleCreateCompany} className="flex flex-col gap-5 mt-5 relative z-10">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Company Name</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Genesis Logging Inc"
                  className="w-full mt-1.5 px-4 py-2.5 rounded-none bg-zinc-950 border border-zinc-900 text-zinc-200 focus:outline-none focus:border-game-gold font-display text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Operational Region</label>
                  <select
                    value={newCompanyRegion}
                    onChange={(e) => setNewCompanyRegion(Number(e.target.value))}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-none bg-zinc-950 border border-zinc-900 text-zinc-300 focus:outline-none focus:border-game-gold font-display text-sm cursor-pointer uppercase tracking-wider"
                  >
                    {regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Company Template</label>
                  <select
                    value={newCompanyTemplate}
                    onChange={(e) => setNewCompanyTemplate(Number(e.target.value))}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-none bg-zinc-950 border border-zinc-900 text-zinc-300 focus:outline-none focus:border-game-gold font-display text-sm cursor-pointer uppercase tracking-wider"
                  >
                    {companyTemplates.map((temp) => (
                      <option key={temp.id} value={temp.id}>
                        {temp.name} ({temp.cost_local} LC)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-900 flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-2 text-zinc-500 font-display uppercase tracking-wider">
                  <Coins className="h-4 w-4 text-game-gold-dark" />
                  <span>Wallet Balance:</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold font-pixel text-white">{currencies?.local_currency_balance} LC</span>
                  <button
                    type="button"
                    onClick={handleClaimFunding}
                    className="rpg-button px-2 py-1 text-[8px] tracking-widest select-none border border-game-gold"
                  >
                    Claim +1000 LC
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full h-11 rpg-button text-xs font-display uppercase tracking-widest select-none disabled:opacity-40"
              >
                Incorporate & Deduct Cost
              </button>
            </form>
          </div>
        )}

      </div>
    );
  }

  // Active corporate member view
  return (
    <div className="flex flex-col gap-6">
      
      {/* Alert banners */}
      {error && (
        <div className="rpg-panel-stone border-red-900/60 text-red-400 p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rpg-panel-stone border-game-gold/40 text-game-emerald p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
          <Sparkles className="h-5 w-5 shrink-0 text-game-gold-dark" />
          <span>{success}</span>
        </div>
      )}

      {/* Select active company tab */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-game-gold/30 pb-3">
        <div className="flex items-center gap-3">
          <label className="text-[9px] text-zinc-550 font-display uppercase tracking-widest font-bold">Active Corporate Entity:</label>
          <select
            value={activeCompanyId || ''}
            onChange={(e) => selectCompany(e.target.value || null)}
            className="bg-zinc-950 border border-zinc-900 rounded-none py-1 px-3 text-xs text-zinc-300 focus:outline-none focus:border-game-gold cursor-pointer font-display uppercase tracking-wide"
          >
            {myCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Headers */}
        <div className="flex items-center gap-1.5 p-0.5 rounded-none bg-zinc-950/40 border-b border-transparent overflow-x-auto max-w-full">
          {([
            { id: 'overview', name: 'Overview', icon: Factory },
            { id: 'vault', name: 'Vault', icon: Boxes },
            { id: 'staff', name: 'Staff', icon: Users },
            { id: 'production', name: 'Assembly Line', icon: SlidersHorizontal },
            { id: 'logs', name: 'Logs Ledger', icon: FileText }
          ] as const).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setDashboardTab(tab.id)}
                className={`px-3.5 py-1.5 text-[10px] font-bold font-display uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border-t-2 border-l-2 border-r-2 ${
                  dashboardTab === tab.id
                    ? 'bg-game-wood border-game-gold text-game-gold shadow-[0_-2px_5px_rgba(229,193,88,0.1)] translate-y-[2px]'
                    : 'bg-zinc-950/20 border-transparent text-zinc-500 hover:text-game-gold'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeCompany && (
        /* RENDER DASHBOARD TABS */
        <div className="flex flex-col gap-6">
          
          {/* TAB 1: OVERVIEW */}
          {dashboardTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Info panel */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col gap-5 text-left border-none shadow-xl">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />
                  
                  <div className="absolute right-0 top-0 h-40 w-40 bg-zinc-700/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 border-2 border-game-gold bg-game-wood text-game-gold flex items-center justify-center font-bold text-xl font-display select-none">
                      {activeCompany.name[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">{activeCompany.name}</h2>
                      <span className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold font-display tracking-wider">
                        Type: {activeTemplate?.name || 'Raw Extraction Camp'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t-2 border-game-gold/15 pt-4 my-1 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Sector coordinates</span>
                      <span className="text-xs font-bold font-display text-zinc-350 mt-1">
                        {regions.find((r) => r.id === activeCompany.region_id)?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Your corporate role</span>
                      <span className={`px-2 py-0.5 rounded-none text-[8px] font-extrabold uppercase tracking-wider border w-fit mt-1.5 ${getRoleBadgeColor(activeRole)}`}>
                        {activeRole}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 border-t-2 border-game-gold/15 pt-4 relative z-10">
                    <div className="flex justify-between text-[9px] text-zinc-550 font-display uppercase tracking-widest">
                      <span>Corporate Level {(activeCompany as any).level}</span>
                      <span>{(activeCompany as any).experience} / {((activeCompany as any).level * (activeCompany as any).level * 100)} XP</span>
                    </div>
                    <div className="w-full bg-zinc-950 border border-game-gold/15 h-2.5 mt-1 overflow-hidden p-[0.5px]">
                      <div
                        className="bg-gradient-to-r from-blue-700 to-indigo-500 h-full rounded-none transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round(((activeCompany as any).experience / ((activeCompany as any).level * (activeCompany as any).level * 100)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vault quick stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rpg-panel-stone p-5 rounded-none flex items-center justify-between border-none shadow-md relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <div className="flex flex-col text-left relative z-10">
                      <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Vault Balance</span>
                      <span className="text-2xl font-bold font-pixel text-game-emerald mt-1 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">
                        {activeCompanyVault?.local_currency.toLocaleString()} <span className="text-[10px] text-zinc-500 font-sans font-bold">LC</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="rpg-panel-stone p-5 rounded-none flex items-center justify-between border-none shadow-md relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <div className="flex flex-col text-left relative z-10">
                      <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Active Employees</span>
                      <span className="text-2xl font-bold font-pixel text-white mt-1 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.5)]">
                        {activeCompanyMembers.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perform Shift Labor Column */}
              <div className="rpg-panel-stone p-6 rounded-none flex flex-col justify-between gap-6 text-left border-none shadow-xl relative h-full">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <div className="flex flex-col gap-2 relative z-10">
                  <h3 className="text-md font-bold text-game-gold font-display uppercase tracking-widest filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">Shift Labor Station</h3>
                  <p className="text-zinc-500 font-serif text-xs leading-normal">
                    Perform physical shifts work at this facility. Extraction camps harvest raw ores directly, whereas manufacturing plants require recipes queued.
                  </p>
                </div>

                {/* Cooldown limit indicator */}
                <div className="p-3 bg-zinc-950 border border-zinc-900 text-xs flex justify-between relative z-10 font-display uppercase tracking-wider">
                  <span className="text-zinc-550">Shifts Worked Today:</span>
                  <span className="font-bold text-zinc-300 font-pixel">
                    {activeMemberRecord?.shifts_worked_today} / {activeMemberRecord?.max_daily_shifts}
                  </span>
                </div>

                <div className="flex flex-col gap-3 relative z-10">
                  {shiftProgress > 0 && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                        <span>Operating machines...</span>
                        <span>{shiftProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 border border-game-gold/15 h-2 overflow-hidden p-[0.5px]">
                        <div className="bg-gradient-to-r from-game-gold-dark to-game-gold h-full rounded-none" style={{ width: `${shiftProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePerformShift}
                    disabled={
                      actionLoading ||
                      shiftProgress > 0 ||
                      (activeMemberRecord ? activeMemberRecord.shifts_worked_today >= activeMemberRecord.max_daily_shifts : true)
                    }
                    className="w-full h-12 rpg-button text-xs font-display uppercase tracking-widest select-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Clock className="h-4.5 w-4.5 shrink-0" />
                    <span>{shiftProgress > 0 ? 'Operating Shift...' : 'Run Shift (-10 Energy)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VAULT INVENTORY LEDGER */}
          {dashboardTab === 'vault' && (
            <div className="flex flex-col gap-6">
              
              {/* Cash Ledger deposits */}
              <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left border-none relative shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-2 relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Vault Currency Transfer</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Your Wallet Balance</span>
                    <span className="text-sm font-bold font-pixel text-white mt-1">{currencies?.local_currency_balance} LC</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Vault Balance</span>
                    <span className="text-sm font-bold font-pixel text-game-emerald mt-1">{activeCompanyVault?.local_currency} LC</span>
                  </div>

                  {/* Transfer input controls */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={vaultCashAmount}
                      onChange={(e) => setVaultCashAmount(e.target.value)}
                      placeholder="Amount LC"
                      className="w-full px-3 py-1.5 rounded-none bg-zinc-950 border border-zinc-900 text-xs font-pixel text-zinc-200 focus:outline-none focus:border-game-gold"
                    />
                    <button
                      onClick={() => handleVaultCash(true)}
                      className="px-3 py-2 rpg-button text-xs font-display uppercase tracking-widest select-none shrink-0"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => handleVaultCash(false)}
                      className="px-3 py-2 rpg-button rpg-button-gold border border-game-gold text-xs font-display uppercase tracking-widest select-none shrink-0"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>

              {/* Physical Inventory Ledger grid */}
              <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left border-none relative shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-2 relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Vault Resource Inventory</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {resources.map((res) => {
                    const backpackQty = playerResources.find((p) => p.resource_id === res.id)?.quantity || 0;
                    const vaultQty = activeCompanyInventory.find((c) => c.resource_id === res.id)?.quantity || 0;

                    return (
                      <div
                        key={res.id}
                        className="p-3.5 bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-4"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-200 font-display uppercase tracking-wider">{res.name}</span>
                          <span className="text-[9px] text-zinc-550 font-pixel mt-1 flex items-center gap-3">
                            <span>Backpack: x{backpackQty}</span>
                            <span>Vault: x{vaultQty}</span>
                          </span>
                        </div>

                        {/* Transfer inputs */}
                        {['Owner', 'Director', 'Manager'].includes(activeRole) && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={vaultResourceQty[res.id] || ''}
                              onChange={(e) =>
                                setVaultResourceQty((prev) => ({ ...prev, [res.id]: e.target.value }))
                              }
                              placeholder="Qty"
                              className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-950 text-xs font-pixel text-zinc-200 focus:outline-none text-center"
                            />
                            <button
                              onClick={() => handleVaultResource(res.id, true)}
                              className="px-2.5 py-1.5 rpg-button text-[9px] font-display uppercase tracking-widest select-none"
                            >
                              Deposit
                            </button>
                            <button
                              onClick={() => handleVaultResource(res.id, false)}
                              className="px-2.5 py-1.5 rpg-button rpg-button-gold border border-game-gold text-[9px] font-display uppercase tracking-widest select-none"
                            >
                              Withdraw
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: STAFF & PAYROLL ROSTER */}
          {dashboardTab === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Employee table */}
              <div className="lg:col-span-2 rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left border-none shadow-md relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-2 relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Employee Registry</h3>
                
                <div className="flex flex-col gap-3 relative z-10">
                  {activeCompanyMembers.map((member) => (
                    <div
                      key={member.profile_id}
                      className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-game-wood border border-game-gold text-game-gold flex items-center justify-center font-bold text-sm select-none">
                          {member.username ? member.username[0].toUpperCase() : 'E'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-200 font-display tracking-wider">{member.username || 'Employee'}</span>
                          <span className={`px-2 py-0.5 rounded-none text-[8px] font-extrabold uppercase border tracking-wider w-fit mt-1.5 ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {/* Salary and limit indicators */}
                      <div className="flex flex-wrap items-center gap-6 text-right justify-between sm:justify-end">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-zinc-550 font-display uppercase tracking-widest">Shifts today</span>
                          <span className="text-xs font-bold font-pixel text-zinc-300 mt-1">
                            {member.shifts_worked_today} / {member.max_daily_shifts}
                          </span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-zinc-550 font-display uppercase tracking-widest">Shift wage</span>
                          <span className="text-xs font-bold font-pixel text-game-emerald mt-1">{member.salary} LC</span>
                        </div>

                        {/* Actions for Owners */}
                        {isOwner && member.role !== 'Owner' && (
                          <div className="flex items-center gap-2 border-t sm:border-0 border-zinc-900 pt-2 sm:pt-0 w-full sm:w-auto">
                            <input
                              type="number"
                              value={salaryEdits[member.profile_id] || ''}
                              onChange={(e) =>
                                setSalaryEdits((prev) => ({ ...prev, [member.profile_id]: e.target.value }))
                              }
                              placeholder="New salary"
                              className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-950 text-xs font-pixel text-zinc-200 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSetSalary(member.profile_id)}
                              className="rpg-button px-2.5 py-1 text-[9px] font-display uppercase tracking-widest select-none"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleTerminate(member.profile_id, member.username || '')}
                              className="rpg-button rpg-button-crimson p-1.5 border border-red-800/40 rounded-none select-none"
                              title="Terminate Contract"
                            >
                              <UserX className="h-4 w-4 shrink-0" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!isOwner && (
                  <button
                    onClick={handleResign}
                    className="w-full mt-4 h-10 rpg-button rpg-button-crimson font-display uppercase tracking-widest text-xs border border-red-800/40 relative z-10 select-none"
                  >
                    Resign from Company
                  </button>
                )}
              </div>

              {/* Post job offer Column */}
              {isOwner && (
                <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left border-none shadow-md relative h-fit">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-2 relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Post Job Opportunity</h3>
                  
                  <form onSubmit={handlePostJob} className="flex flex-col gap-4 mt-2 relative z-10">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Vacancy Region</label>
                      <select
                        value={jobRegion}
                        onChange={(e) => setJobRegion(Number(e.target.value))}
                        className="w-full mt-1.5 px-2 py-2 rounded-none bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 font-display uppercase tracking-wider"
                      >
                        {regions.map((reg) => (
                          <option key={reg.id} value={reg.id}>
                            {reg.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Wage (LC/shift)</label>
                        <input
                          type="number"
                          value={jobSalary}
                          onChange={(e) => setJobSalary(e.target.value)}
                          placeholder="e.g. 15.0"
                          className="w-full mt-1.5 px-3 py-2 rounded-none bg-zinc-955 border border-zinc-900 text-xs font-pixel text-zinc-200 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Vacancies Count</label>
                        <input
                          type="number"
                          value={jobVacancies}
                          onChange={(e) => setJobVacancies(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full mt-1.5 px-3 py-2 rounded-none bg-zinc-955 border border-zinc-900 text-xs font-pixel text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full mt-2 h-10 rpg-button text-xs font-display uppercase tracking-widest select-none disabled:opacity-40"
                    >
                      Post to Board
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASSEMBLY LINE & RECIPES */}
          {dashboardTab === 'production' && (
            <div className="flex flex-col gap-6">
              
              {/* Recipe card widgets */}
              <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left border-none shadow-md relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-2 relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Available Production Recipes</h3>
                
                {activeTemplate?.is_raw_camp ? (
                  <div className="py-6 text-zinc-550 font-serif text-xs flex flex-col items-center justify-center gap-2 relative z-10">
                    <Wrench className="h-6 w-6 text-zinc-650" />
                    <span>Raw extraction camps collect materials directly. No refinement recipes required.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 relative z-10">
                    {productionRecipes.map((recipe) => {
                      const recipeInputsList = productionInputs.filter((inRow) => inRow.recipe_id === recipe.id);
                      const outputResource = resources.find((r) => r.id === recipe.output_resource_id);

                      return (
                        <div
                          key={recipe.id}
                          className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col justify-between gap-4"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm text-zinc-200 font-display tracking-wide">{recipe.name}</span>
                            <span className="text-[10px] font-serif text-zinc-500 leading-relaxed mt-1">{recipe.description}</span>
                          </div>

                          <div className="flex flex-col gap-1.5 border-t border-b border-zinc-900 py-3">
                            <span className="text-[9px] text-zinc-550 font-display uppercase tracking-widest">Inputs Required:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {recipeInputsList.map((inRow) => {
                                const itemDetails = resources.find((r) => r.id === inRow.resource_id);
                                const availableStock = activeCompanyInventory.find((c) => c.resource_id === inRow.resource_id)?.quantity || 0;
                                
                                return (
                                  <span
                                    key={inRow.resource_id}
                                    className={`px-2.5 py-1 text-[10px] font-display uppercase tracking-wide border flex items-center gap-1.5 ${
                                      availableStock >= inRow.quantity
                                        ? 'border-zinc-900 bg-game-wood/40 text-zinc-300'
                                        : 'border-red-950/45 bg-red-950/10 text-red-450'
                                    }`}
                                  >
                                    <span>{itemDetails?.name}</span>
                                    <span className="font-extrabold font-pixel">x{inRow.quantity}</span>
                                    <span className="text-[9px] text-zinc-550 font-pixel">({availableStock})</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col text-left">
                              <span className="text-[9px] text-zinc-550 font-display uppercase tracking-widest">Yield output</span>
                              <span className="text-xs font-bold text-game-gold font-pixel mt-1">
                                +{recipe.output_quantity} {outputResource?.name || 'Refined Product'}
                              </span>
                            </div>

                            {/* Batch queue controls */}
                            {['Owner', 'Director', 'Manager'].includes(activeRole) && (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={queueQuantity[recipe.id] || ''}
                                  onChange={(e) =>
                                    setQueueQuantity((prev) => ({ ...prev, [recipe.id]: e.target.value }))
                                  }
                                  placeholder="Batch count"
                                  className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-950 text-xs font-pixel text-zinc-205 text-center focus:outline-none"
                                />
                                <button
                                  onClick={() => handleQueueRecipe(recipe.id, recipe.name)}
                                  className="rpg-button px-3 py-1 text-xs font-display uppercase tracking-widest select-none"
                                >
                                  Queue Batch
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active queues lists */}
              {!activeTemplate?.is_raw_camp && (
                <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left border-none shadow-md relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-2 relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Active Assembly Queue</h3>
                  
                  <div className="flex flex-col gap-3 relative z-10">
                    {activeCompanyProductionQueue.length === 0 ? (
                      <div className="py-8 text-center text-zinc-550 font-serif text-xs">
                        No active production jobs in the queue.
                      </div>
                    ) : (
                      activeCompanyProductionQueue.map((item) => {
                        const recipeName = productionRecipes.find((r) => r.id === item.recipe_id)?.name || `Recipe #${item.recipe_id}`;
                        const progress = Math.round((item.quantity_completed / item.quantity) * 100);

                        return (
                          <div
                            key={item.id}
                            className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-200 font-display tracking-wider">{recipeName}</span>
                                <span className="text-[10px] text-zinc-500 font-display uppercase mt-1 tracking-wider">
                                  Batch volume: {item.quantity} units
                                </span>
                              </div>

                              <span
                                className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ${
                                  item.status === 'completed'
                                    ? 'bg-emerald-950/20 text-game-emerald border-emerald-900/30'
                                    : item.status === 'running'
                                    ? 'bg-indigo-950/20 text-indigo-400 border-indigo-900/30 animate-pulse'
                                    : 'bg-zinc-900 text-zinc-500 border-zinc-950'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex justify-between text-[9px] text-zinc-550 font-pixel tracking-wider">
                                <span>Completed: {item.quantity_completed} / {item.quantity}</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="w-full bg-zinc-950 border border-game-gold/15 h-2 overflow-hidden p-[0.5px]">
                                <div className="bg-gradient-to-r from-game-gold-dark to-game-gold h-full" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: AUDIT LOGS - Redesigned as parchment Ledger scroll */}
          {dashboardTab === 'logs' && (
            <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4 text-left border-2 shadow-2xl h-full">
              <h3 className="text-sm font-bold font-display text-amber-950 border-b border-amber-950/20 pb-2 flex items-center gap-2 uppercase tracking-widest">
                <FileText className="h-4.5 w-4.5 text-amber-900" />
                <span>Corporate Activity Audit</span>
              </h3>
              
              <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                {activeCompanyLogs.length === 0 ? (
                  <div className="py-12 text-center text-amber-900/50 font-serif text-xs">
                    No logs recorded for this corporate entity yet.
                  </div>
                ) : (
                  activeCompanyLogs.map((log) => {
                    let desc = log.action;
                    let meta = '';
                    let isCost = false;

                    if (log.action === 'company.created') {
                      desc = `Founder initialized corporate charter.`;
                      meta = `Paid ${log.metadata.cost_local} LC construction fee.`;
                      isCost = true;
                    } else if (log.action === 'vault.deposit_cash') {
                      desc = `${log.actor_username || 'Operator'} deposited cash into the vault.`;
                      meta = `Local currency balance increased: +${log.metadata.amount} LC`;
                    } else if (log.action === 'vault.withdraw_cash') {
                      desc = `${log.actor_username || 'Operator'} withdrew cash from the vault.`;
                      meta = `Local currency balance decreased: -${log.metadata.amount} LC`;
                      isCost = true;
                    } else if (log.action === 'vault.deposit_resource') {
                      const resName = resources.find((r) => r.id === log.metadata.resource_id)?.name || `Resource #${log.metadata.resource_id}`;
                      desc = `${log.actor_username || 'Operator'} deposited cargo to company vault.`;
                      meta = `Cargo stacked: +${log.metadata.quantity} units of ${resName}`;
                    } else if (log.action === 'vault.withdraw_resource') {
                      const resName = resources.find((r) => r.id === log.metadata.resource_id)?.name || `Resource #${log.metadata.resource_id}`;
                      desc = `${log.actor_username || 'Operator'} withdrew cargo from company vault.`;
                      meta = `Cargo unstacked: -${log.metadata.quantity} units of ${resName}`;
                      isCost = true;
                    } else if (log.action === 'job.posted') {
                      desc = `Hiring vacancy contract created.`;
                      meta = `Shift Wage: ${log.metadata.salary} LC, Slots: ${log.metadata.vacancies}`;
                    } else if (log.action === 'employee.hired') {
                      desc = `${log.actor_username || 'Operator'} joined the company employee staff list.`;
                      meta = `Contract salary wage locked at: ${log.metadata.salary} LC/shift.`;
                    } else if (log.action === 'employee.resigned') {
                      desc = `${log.actor_username || 'Operator'} resigned from employee position.`;
                    } else if (log.action === 'employee.terminated') {
                      desc = `Contract terminated for worker employee by management.`;
                      isCost = true;
                    } else if (log.action === 'employee.salary_changed') {
                      desc = `Contract wages updated.`;
                      meta = `New Wage: ${log.metadata.new_salary} LC/shift.`;
                    } else if (log.action === 'production.queued') {
                      const rName = productionRecipes.find((r) => r.id === log.metadata.recipe_id)?.name || `Recipe #${log.metadata.recipe_id}`;
                      desc = `Production recipe queue ordered.`;
                      meta = `Queued batch: x${log.metadata.quantity} orders of ${rName}`;
                    } else if (log.action === 'labor.shift_completed') {
                      desc = `${log.actor_username || 'Operator'} completed work shift.`;
                      meta = `Shift wages paid out: -${log.metadata.wage_paid} LC. Company gained: +${log.metadata.experience_earned} XP`;
                      isCost = true;
                    }

                    return (
                      <div
                        key={log.id}
                        className="p-3 bg-amber-955/5 border-b border-amber-950/10 flex flex-col gap-0.5 hover:bg-amber-950/10 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-amber-950 font-serif leading-relaxed text-left">{desc}</span>
                          <span className="text-[9px] text-amber-900/60 font-pixel tracking-wider">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {meta && (
                          <span className={`text-[10px] font-bold font-display text-left ${isCost ? 'text-rose-800' : 'text-emerald-800'}`}>{meta}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
