import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface RoleSelectorProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  users: User[];
  isAiReclassifying: boolean;
}

export function RoleSelector({ currentUser, onUserChange, users, isAiReclassifying }: RoleSelectorProps) {
  return (
    <div className="w-full bg-slate-900 text-slate-100 px-4 py-3 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-display font-bold text-white tracking-wider">
          NX
        </div>
        <div>
          <span className="font-display font-semibold text-sm tracking-wide text-white">NEXUS SUPPORT</span>
          <span className="text-[10px] text-indigo-400 font-bold block leading-none uppercase">Enterprise AI System</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <ShieldCheck size={14} className="text-indigo-400" /> Simulate Workspace Persona:
        </span>
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          {users.map((user) => {
            const isSelected = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                onClick={() => onUserChange(user)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-slate-600 text-[10px] flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span>{user.name.split(' ')[0]}</span>
                <span className="text-[9px] uppercase opacity-75 font-bold tracking-wider px-1 bg-slate-950/40 rounded">
                  {user.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAiReclassifying && (
          <div className="text-xs text-indigo-400 font-medium flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-900 px-2.5 py-1 rounded-full animate-pulse">
            <RefreshCw size={12} className="animate-spin" />
            AI Sweep Active...
          </div>
        )}
        <div className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
          UTC: 2026-06-29
        </div>
      </div>
    </div>
  );
}
