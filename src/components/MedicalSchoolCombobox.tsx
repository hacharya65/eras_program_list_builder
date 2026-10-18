'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CANONICAL_MEDICAL_SCHOOLS,
  searchMedicalSchools,
  isValidMedicalSchool,
  getCanonicalMedicalSchoolName,
} from '@/domain/medical-schools-database';
import { Check, ChevronDown, Search, X, Building2, AlertCircle } from 'lucide-react';

export interface MedicalSchoolComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  autoFocus?: boolean;
  label?: string;
}

export function MedicalSchoolCombobox({
  value,
  onChange,
  id,
  placeholder = 'Type to search all 255 accredited medical schools...',
  required = false,
  disabled = false,
  error = null,
  className = '',
  autoFocus = false,
  label,
}: MedicalSchoolComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Sync internal search input with external value
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Filtered schools based on search input
  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) {
      return CANONICAL_MEDICAL_SCHOOLS;
    }
    return searchMedicalSchools(searchTerm, 50);
  }, [searchTerm]);

  const isSelectedValid = useMemo(() => isValidMedicalSchool(value), [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCloseDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, searchTerm]);

  const handleCloseDropdown = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);

    // Enforce selection from database: If typed text isn't a valid selection, revert to chosen value
    const canonical = getCanonicalMedicalSchoolName(searchTerm);
    if (canonical) {
      onChange(canonical);
      setSearchTerm(canonical);
    } else {
      setSearchTerm(value || '');
    }
  };

  const handleSelectSchool = (school: string) => {
    onChange(school);
    setSearchTerm(school);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSchools.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSchools.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredSchools.length) {
          handleSelectSchool(filteredSchools[highlightedIndex]);
        } else if (isOpen && filteredSchools.length === 1) {
          handleSelectSchool(filteredSchools[0]);
        } else if (isOpen) {
          const canonical = getCanonicalMedicalSchoolName(searchTerm);
          if (canonical) {
            handleSelectSchool(canonical);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleCloseDropdown();
        break;
      case 'Tab':
        handleCloseDropdown();
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-neutral-700 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input Field with Icons */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
          <Building2 className="w-4 h-4 text-[#1F3A30]" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={searchTerm}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-10 pr-16 py-2.5 sm:py-3 text-xs sm:text-sm border rounded-xl bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3A30] transition-all font-medium ${
            error
              ? 'border-rose-400 ring-1 ring-rose-300'
              : isSelectedValid
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-neutral-300'
          }`}
        />

        {/* Clear & Dropdown Chevron Buttons */}
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded-md transition-colors cursor-pointer"
              title="Clear selection"
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                if (!isOpen && inputRef.current) {
                  inputRef.current.focus();
                }
              }
            }}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer"
            title="Toggle medical school dropdown"
            tabIndex={-1}
          >
            <ChevronDown
              className={`w-4 h-4 text-neutral-500 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Verified School Badge when validly selected */}
      {isSelectedValid && !isOpen && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Accredited Institution Verified</span>
        </div>
      )}

      {/* Error Message */}
      {error && !isOpen && (
        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {/* Floating Dropdown Listbox */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          {/* Header Status Bar */}
          <div className="px-3.5 py-2 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="font-semibold text-neutral-700">
              Select directly from accredited database:
            </span>
            <span className="text-neutral-400">
              {filteredSchools.length} of {CANONICAL_MEDICAL_SCHOOLS.length} schools
            </span>
          </div>

          {/* Scrollable List */}
          <ul
            ref={listboxRef}
            role="listbox"
            className="max-h-60 overflow-y-auto divide-y divide-neutral-100/60 text-xs py-1 scrollbar-thin"
          >
            {filteredSchools.length === 0 ? (
              <li className="px-4 py-4 text-center text-xs text-neutral-400">
                <AlertCircle className="w-4 h-4 mx-auto mb-1 text-neutral-300" />
                No accredited medical school matched &quot;{searchTerm}&quot;.
                <br />
                <span className="text-[11px] text-neutral-400">
                  Please select directly from the 255 accredited institutions.
                </span>
              </li>
            ) : (
              filteredSchools.map((school, index) => {
                const isSelected = value === school;
                const isHighlighted = highlightedIndex === index;

                return (
                  <li
                    key={school}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectSchool(school)}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EAF2EE] text-[#1F3A30] font-bold'
                        : isHighlighted
                        ? 'bg-neutral-100/90 text-neutral-900 font-medium'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="truncate pr-2">{school}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
