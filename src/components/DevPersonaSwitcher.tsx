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
    <div className="sticky top-0 z-50 shadow-xs">
      {/* Level 0: Top Demonstration Strip (Solid Dark Spruce #1F3A30) */}
      <div className="bg-[#1F3A30] text-white py-1 px-4 text-center text-xs sm:text-[13px] font-medium tracking-wide">
        Demonstration — fictional applicant records
      </div>

      {/* Level 1: Main Institutional Navigation Header (Pure White #FFFFFF) */}
      <header className="bg-white border-b border-neutral-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Ethmoid Logo & School Name */}
          <div className="flex items-center gap-3">
            <img
              src="/ethmoid-square.jpeg"
              alt="Ethmoid logo"
              className="h-9 w-9 object-contain"
            />
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold tracking-tight text-neutral-900">
                Ethmoid
              </span>
              <span className="h-4 w-px bg-neutral-300 hidden sm:block" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-600 hidden sm:block">
                {institutionName || 'Geisinger Commonwealth School of Medicine'}
              </span>
            </div>
          </div>

          {/* Right: Institutional Persona Quick-Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-neutral-400 text-[11px] font-medium uppercase tracking-wider hidden md:inline mr-1">
              Active Persona:
            </span>
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
              {personas.map((p) => {
                const isActive = currentRole === p.role;
                return (
                  <button
                    key={p.role}
                    onClick={() => onSelectRole(p.role)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#1F3A30] text-white shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                    }`}
                    title={`Switch view to ${p.name} (${p.title})`}
                  >
                    <span className={isActive ? 'text-white' : 'text-neutral-500'}>
                      {p.icon}
                    </span>
                    <span className="hidden sm:inline">{p.name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-80 hidden lg:inline">
                      ({p.title.split(' ')[0]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
