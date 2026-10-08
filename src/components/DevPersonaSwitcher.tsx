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
    <div className="bg-[#1F3A30] border-b border-[#2D5949] text-emerald-100 px-4 py-2 text-xs font-medium sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Institution Identity */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#264639] border border-[#7EAE9B]/40 flex items-center justify-center p-0.5 overflow-hidden shrink-0 shadow-inner">
            <img
              src="/ethmoid-square.jpeg"
              alt="Ethmoid"
              className="w-full h-full object-contain filter brightness-110"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-tight text-sm">
              Ethmoid
            </span>
            <span className="text-[#7EAE9B] font-semibold text-[11px] hidden sm:inline">
              &bull; {institutionName}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#142720] text-[#7EAE9B] border border-[#7EAE9B]/30 tracking-wide uppercase">
            Demonstration &bull; Fictional Records
          </span>
        </div>

        {/* Right: Quick-switch persona buttons */}
        <div className="flex items-center gap-2">
          <span className="text-emerald-200/70 mr-1 text-[11px] uppercase tracking-wider hidden md:inline">
            Active Persona:
          </span>
          {personas.map((p) => {
            const isActive = currentRole === p.role;
            return (
              <button
                key={p.role}
                onClick={() => onSelectRole(p.role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-[#7EAE9B] text-[#142720] border-[#7EAE9B] font-bold shadow-sm'
                    : 'bg-[#264639] hover:bg-[#2D5949] text-emerald-100 border-[#2D5949] hover:text-white'
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
