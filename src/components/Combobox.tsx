import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ── Types ─────────────────────────────────────────────── */

interface Option {
  value: string;
  label: string;
}

interface ComboboxProps {
  id?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/* ── Constants ─────────────────────────────────────────── */

const ITEM_HEIGHT    = 40;  // px per option row
const VISIBLE_HEIGHT = 240; // max dropdown viewport height (matches max-h-60)
const BUFFER_ITEMS   = 3;   // extra rows rendered above/below the visible area

/* ── Component ─────────────────────────────────────────── */

export default function Combobox({
  id = 'combobox',
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  required = false,
  disabled = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen]             = useState(false);
  const [inputValue, setInputValue]     = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [scrollTop, setScrollTop]       = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef   = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  /* ── Sync input text with the current selection ──────── */

  useEffect(() => {
    if (!isOpen) {
      setInputValue(selectedOption?.label ?? '');
    }
  }, [selectedOption, isOpen]);

  /* ── Debounce the search query (150 ms) ──────────────── */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue), 150);
    return () => clearTimeout(timer);
  }, [inputValue]);

  /* ── Filter & rank options ───────────────────────────── */

  const filteredOptions = debouncedQuery === ''
    ? options
    : [...options]
        .filter(opt => opt.label.toLowerCase().includes(debouncedQuery.toLowerCase()))
        .sort((a, b) => {
          const q = debouncedQuery.toLowerCase();
          const aStarts = a.label.toLowerCase().startsWith(q);
          const bStarts = b.label.toLowerCase().startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return  1;
          return 0;
        });

  /* ── Close on outside click ──────────────────────────── */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Reset focus & scroll when the list opens/changes ── */

  useEffect(() => {
    if (isOpen && value) {
      const idx = filteredOptions.findIndex(opt => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
    setScrollTop(0);
    if (optionsListRef.current) optionsListRef.current.scrollTop = 0;
  }, [filteredOptions.length, isOpen, value]);

  /* ── Keep the focused item visible ───────────────────── */

  useEffect(() => {
    if (focusedIndex < 0 || !optionsListRef.current) return;

    const container  = optionsListRef.current;
    const itemTop    = focusedIndex * ITEM_HEIGHT;
    const itemBottom = itemTop + ITEM_HEIGHT;

    if (itemBottom > container.scrollTop + VISIBLE_HEIGHT) {
      container.scrollTop = itemBottom - VISIBLE_HEIGHT;
    } else if (itemTop < container.scrollTop) {
      container.scrollTop = itemTop;
    }
  }, [focusedIndex]);

  /* ── Helpers ─────────────────────────────────────────── */

  const selectOption = (opt: Option) => {
    onChange(opt.value);
    setIsOpen(false);
  };

  const openDropdown = () => {
    setInputValue('');
    setDebouncedQuery('');
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
    } else {
      openDropdown();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /* ── Keyboard navigation ─────────────────────────────── */

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const count = filteredOptions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { openDropdown(); }
        else if (count > 0) { setFocusedIndex(prev => (prev + 1) % count); }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) { openDropdown(); }
        else if (count > 0) { setFocusedIndex(prev => (prev - 1 + count) % count); }
        break;

      case 'PageDown':
        e.preventDefault();
        if (isOpen && count > 0) setFocusedIndex(prev => Math.min(prev + 10, count - 1));
        break;

      case 'PageUp':
        e.preventDefault();
        if (isOpen && count > 0) setFocusedIndex(prev => Math.max(prev - 10, 0));
        break;

      case 'Home':
        e.preventDefault();
        if (isOpen && count > 0) setFocusedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        if (isOpen && count > 0) setFocusedIndex(count - 1);
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen) {
          if (focusedIndex >= 0 && focusedIndex < count) selectOption(filteredOptions[focusedIndex]);
          else if (count > 0) selectOption(filteredOptions[0]);
        } else {
          openDropdown();
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;

      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  /* ── Virtual scroll calculations ─────────────────────── */

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
  const endIndex   = Math.min(
    filteredOptions.length - 1,
    Math.floor((scrollTop + VISIBLE_HEIGHT) / ITEM_HEIGHT) + BUFFER_ITEMS,
  );

  const visibleOptions = filteredOptions
    .slice(startIndex, endIndex + 1)
    .map((opt, i) => ({ opt, index: startIndex + i }));

  const listHeight = filteredOptions.length === 0
    ? 48
    : Math.min(VISIBLE_HEIGHT, filteredOptions.length * ITEM_HEIGHT);

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Trigger input */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? `${id}-listbox` : undefined}
          aria-activedescendant={focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined}
          className="w-full bg-white border border-slate-300 py-3 pl-3.5 pr-10 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-kerala-navy focus:ring-2 focus:ring-kerala-navy/10 rounded cursor-pointer transition-all placeholder-slate-400"
          placeholder={isOpen ? 'Type to search...' : placeholder}
          value={isOpen ? inputValue : (selectedOption?.label ?? '')}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true);
            setInputValue(e.target.value);
          }}
          onFocus={() => {
            if (!disabled && !isOpen) openDropdown();
            setTimeout(() => inputRef.current?.select(), 50);
          }}
          onClick={() => { if (isOpen) inputRef.current?.select(); }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required && !value}
          autoComplete="off"
        />

        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          aria-label={isOpen ? 'Close choices list' : 'Open choices list'}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 border-l border-slate-200 hover:text-kerala-navy transition-colors cursor-pointer"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded shadow-lg overflow-hidden flex flex-col"
          >
            <div
              ref={optionsListRef}
              id={`${id}-listbox`}
              role="listbox"
              aria-label={placeholder}
              onScroll={handleScroll}
              style={{ height: `${listHeight}px` }}
              className="overflow-y-auto overflow-x-hidden py-1 font-sans relative"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3.5 py-3 text-xs sm:text-sm text-slate-500 italic">
                  No results found
                </div>
              ) : (
                <div style={{ height: `${filteredOptions.length * ITEM_HEIGHT}px`, position: 'relative', width: '100%' }}>
                  {visibleOptions.map(({ opt, index }) => {
                    const isSelected = opt.value === value;
                    const isFocused  = index === focusedIndex;
                    return (
                      <button
                        key={`${opt.value}-${index}`}
                        id={`${id}-option-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        type="button"
                        onClick={() => selectOption(opt)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        style={{
                          position: 'absolute',
                          top: `${index * ITEM_HEIGHT}px`,
                          left: 0,
                          right: 0,
                          height: `${ITEM_HEIGHT}px`,
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-kerala-navy text-white font-semibold'
                            : isFocused
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate pr-2">{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0 text-kerala-gold" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
