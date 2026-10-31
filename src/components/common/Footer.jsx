import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E4EBE6] bg-white py-4 px-6 text-xs text-[#718078]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16865B] animate-pulse"></span>
          <span>© 2025 AAROGYA LINK. Rural & Regional Telehealth Network. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a href="#" className="hover:text-[#16865B] transition-colors">Emergency Protocols</a>
          <a href="#" className="hover:text-[#16865B] transition-colors">Dialect Support</a>
          <a href="#" className="hover:text-[#16865B] transition-colors">Health Privacy</a>
        </div>
      </div>
    </footer>
  );
}
