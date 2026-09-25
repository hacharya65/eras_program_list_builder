'use client';

import React from 'react';
import { UserRole } from '@/domain/types';
import { Stethoscope, UserCheck, ShieldCheck, GraduationCap, Building2 } from 'lucide-react';

interface DevPersonaSwitcherProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  institutionName: string;
}

export function DevPersonaSwitcher({
  currentRole,
  onSelectRole,
  institutionName,
}: DevPersonaSwitcherProps) {
  const personas: { role: UserRole; name: string; title: string; icon: React.ReactNode; badgeClass: string }[] = [
    {
      role: 'student',
      name: 'Alex Rivera',
      title: 'MS4 Applicant',
      icon: <GraduationCap className="w-4 h-4 text-sky-400" />,
      badgeClass: 'bg-sky-950 text-sky-300 border-sky-800',
    },
    {
      role: 'advisor',
      name: 'Dr. Marcus Chen',
      title: 'Faculty Advisor',
      icon: <Stethoscope className="w-4 h-4 text-emerald-400" />,
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      role: 'admin',
      name: 'Dr. Evelyn Taylor',
      title: 'Dean of Student Affairs',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2.5 text-xs font-medium sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Indicator */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-100 flex items-center gap-1.5 tracking-wide uppercase text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {institutionName}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 hidden sm:inline">Testing Toolbar: Instant Persona Switcher</span>
        </div>

        {/* Right: Quick-switch buttons */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 mr-1 text-[11px] uppercase tracking-wider hidden md:inline">View As:</span>
          {personas.map((p) => {
            const isActive = currentRole === p.role;
            return (
              <button
                key={p.role}
                onClick={() => onSelectRole(p.role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? `${p.badgeClass} ring-2 ring-sky-500/40 font-semibold shadow-inner`
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title={`Switch to ${p.title}`}
              >
                {p.icon}
                <span>{p.name}</span>
                <span className="text-[10px] opacity-75 hidden lg:inline">({p.title})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
