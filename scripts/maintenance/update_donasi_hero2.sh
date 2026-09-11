#!/bin/bash
sed -i 's/<div className="bg-amber-500 py-16 md:py-24">/<div className="bg-slate-950 py-16 md:py-24 relative overflow-hidden">\n        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-900\/40 via-slate-950 to-slate-950 -z-10"><\/div>/g' app/\(public\)/donasi/page.tsx
sed -i 's/<p className="text-amber-50/<p className="text-slate-400 relative z-10/g' app/\(public\)/donasi/page.tsx
