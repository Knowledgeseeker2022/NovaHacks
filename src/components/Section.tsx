import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

export const Section: React.FC<SectionProps> = ({ title, children, isActive, onClick }) => {
  return (
    <div className="mb-6 border rounded-lg shadow-sm bg-white overflow-hidden">
      <button
        onClick={onClick}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {isActive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      <div
        className={clsx(
          'transition-all duration-300 ease-in-out',
          isActive ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};