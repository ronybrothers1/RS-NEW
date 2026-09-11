#!/bin/bash
sed -i 's/<div className="bg-teal-700 py-16 md:py-24">/<div className="bg-slate-950 py-16 md:py-24 relative overflow-hidden">\n        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900\/40 via-slate-950 to-slate-950 -z-10"><\/div>/g' app/\(public\)/donasi/page.tsx
sed -i 's/<p className="text-teal-100/<p className="text-slate-400 relative z-10/g' app/\(public\)/donasi/page.tsx
sed -i 's/<h1 className="text-3xl md:text-5xl font-bold text-white mb-6">/<h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 relative z-10">/g' app/\(public\)/donasi/page.tsx
