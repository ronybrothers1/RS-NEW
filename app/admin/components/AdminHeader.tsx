"use client";

import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AdminHeader({ user }: { user: any }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Placeholder for breadcrumbs or title */}
      </div>
      
      <div className="flex items-center space-x-4">
        <Link href="/" target="_blank" className="text-sm text-slate-500 hover:text-teal-600 font-medium">
          Lihat Website
        </Link>
        
        <div className="h-6 w-px bg-slate-200"></div>
        
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900">{user?.name}</span>
            <span className="text-xs text-slate-500">{user?.role}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="h-4 w-4" />
          </div>
        </div>

        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-slate-50"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
