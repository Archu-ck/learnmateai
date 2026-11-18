"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
  description?: string;
}

interface NeumorphicSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  icon?: React.ReactNode;
  showSearch?: boolean;
  disabled?: boolean;
  minWidth?: string;
}

export default function NeumorphicSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  icon,
  showSearch,
  disabled = false,
  minWidth = "min-w-[180px]",
}: NeumorphicSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Enable search automatically if options >= 5 unless explicitly set
  const enableSearch = showSearch !== undefined ? showSearch : options.length >= 6;

  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  return (
    <div ref={containerRef} className={`relative inline-block ${minWidth} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
          isOpen
            ? "neu-inset text-indigo-700 border-indigo-300 shadow-inner"
            : "neu-btn text-slate-800 hover:text-indigo-600"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon && <span className="text-indigo-600 shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="neu-pill px-1.5 py-0.2 text-[9px] font-black uppercase text-indigo-700 bg-indigo-50/90 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-full min-w-[220px] max-w-[340px] neu-card p-2 z-50 rounded-2xl shadow-xl border border-white/90 bg-[#edf2f7]/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
          role="listbox"
        >
          {/* Optional Search Filter */}
          {enableSearch && (
            <div className="p-1.5 pb-2 mb-1 border-b border-white/80">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="neu-input !pl-7 pr-2.5 py-1 text-[11px] w-full font-medium rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 scrollbar-slim">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-[11px] text-slate-400 font-medium">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "neu-inset text-indigo-700 bg-white/50 border border-indigo-200"
                        : "neu-btn text-slate-700 hover:text-indigo-600 hover:bg-white/40"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0 truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description && (
                          <span className="block text-[10px] text-slate-400 font-normal truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span
                          className={`neu-pill px-1.5 py-0.2 text-[9px] font-black uppercase ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "text-indigo-700 bg-indigo-50/80"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={13} className="text-indigo-600 font-black shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
