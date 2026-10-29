import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, UserX } from 'lucide-react';
import { Avatar } from '../common/Avatar';
/**
 * Anchored assignee dropdown for the People card: members with avatars and
 * names, an Unassigned option, and a search box when the member list is
 * large. Keyboard model: the search box (when present) takes focus on open
 * and supports ArrowUp/ArrowDown/Enter; every option is a real button so
 * Tab + Enter always work. Escape/outside-click are handled by the owner.
 */
export const AssigneePickerPanel = ({ members, value, onSelect, }) => {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    // Only large lists get a search box; small ones stay a plain Tab-able list.
    const showSearch = members.length > 5;
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return members;
        return members.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }, [members, query]);
    // Focus the search box as soon as a searchable panel opens.
    useEffect(() => {
        if (showSearch)
            inputRef.current?.focus();
    }, [showSearch]);
    // While searching, pre-highlight the first match so Enter selects it.
    useEffect(() => {
        setActiveIndex(showSearch && filtered.length > 0 ? 0 : -1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, showSearch]);
    // Keep the keyboard cursor in view while arrowing through options.
    useEffect(() => {
        if (activeIndex < 0)
            return;
        listRef.current
            ?.querySelector(`[data-option-index="${activeIndex}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);
    const handleSearchKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const target = filtered[activeIndex];
            if (target)
                onSelect(target.id);
        }
    };
    const rowClassName = (selected, active) => `w-full flex items-center gap-2 px-3 py-2 text-left fe-control transition-colors ${selected
        ? 'bg-[#deebff] text-[#0747a6] font-semibold'
        : active
            ? 'bg-slate-100 text-[#343A40]'
            : 'text-[#343A40] hover:bg-slate-50'}`;
    return (<div className="absolute left-0 right-0 top-full mt-1 z-30 min-w-[240px] bg-white rounded-xl shadow-2xl border border-[#e2e5ea] overflow-hidden animate-scale-in" data-testid="assignee-picker">
      {showSearch && (<div className="p-2 border-b border-[#eef0f3]">
          <span className="relative block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Search members…" aria-label="Search members" className="w-full rounded-lg border border-[#e2e5ea] bg-white pl-8 pr-2.5 py-1.5 fe-control focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"/>
          </span>
        </div>)}

      {filtered.length === 0 ? (<p className="px-3 py-3 fe-meta text-center">
          No members match “{query.trim()}”.
        </p>) : (<div className="max-h-56 overflow-y-auto py-1" role="listbox" aria-label="Project members" ref={listRef}>
          <button type="button" role="option" aria-selected={!value} onClick={() => onSelect(undefined)} className={rowClassName(!value, false)}>
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
              <UserX className="w-3 h-3"/>
            </span>
            <span className="flex-1 truncate">Unassigned</span>
            {!value && <Check className="w-3.5 h-3.5 flex-shrink-0"/>}
          </button>

          {filtered.map((user, index) => (<button key={user.id} type="button" role="option" aria-selected={value === user.id} data-option-index={index} onClick={() => onSelect(user.id)} onMouseEnter={() => setActiveIndex(index)} className={rowClassName(value === user.id, activeIndex === index)}>
              <Avatar name={user.name} color={user.avatarColor} size="xs"/>
              <span className="flex-1 truncate">{user.name}</span>
              {value === user.id && <Check className="w-3.5 h-3.5 flex-shrink-0"/>}
            </button>))}
        </div>)}
    </div>);
};
