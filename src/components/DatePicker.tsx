import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { dateToDmy, formatDmyInput, parseDmy } from '../utils';

const WEEKDAYS_HR = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
const MONTHS_HR = [
  'Siječanj',
  'Veljača',
  'Ožujak',
  'Travanj',
  'Svibanj',
  'Lipanj',
  'Srpanj',
  'Kolovoz',
  'Rujan',
  'Listopad',
  'Studeni',
  'Prosinac',
];

export interface DatePickerProps {
  /** dd/mm/yyyy (or empty). */
  value: string;
  /** Fires with the current dd/mm/yyyy text; may be incomplete while the user types. */
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  /** Tailwind classes applied to the underlying text input. */
  inputClassName?: string;
  /** Render a small calendar icon on the right of the input. Default true. */
  showIcon?: boolean;
  /** When true, the input is visually borderless (used inside spreadsheet cells). */
  bare?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

const POPUP_WIDTH = 296;
const POPUP_HEIGHT = 340;

export function DatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  id,
  ariaLabel,
  inputClassName,
  showIcon = true,
  bare = false,
  autoFocus,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const parsed = parseDmy(value);
  const invalid = value !== '' && !parsed;

  const [visibleMonth, setVisibleMonth] = useState<Date>(() => parsed ?? new Date());

  useEffect(() => {
    if (parsed) setVisibleMonth(parsed);
  }, [parsed?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePos = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 8;
    let top = rect.bottom + 4;
    let left = rect.left;
    if (left + POPUP_WIDTH > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - POPUP_WIDTH - margin);
    }
    if (top + POPUP_HEIGHT > window.innerHeight - margin) {
      const above = rect.top - POPUP_HEIGHT - 4;
      if (above > margin) top = above;
    }
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => updatePos();
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const baseInput = bare
    ? 'w-full px-2.5 py-2 rounded-lg border border-transparent bg-transparent text-ink text-[13px] placeholder:text-ink-faint focus:border-peri-400 focus:bg-surface focus:outline-none transition-colors tabular-nums'
    : 'w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink text-[13px] placeholder:text-ink-faint focus:border-peri-400 focus:outline-none transition-colors tabular-nums';

  const inputClasses = [
    baseInput,
    showIcon ? 'pr-8' : '',
    invalid ? 'text-rose-600' : '',
    inputClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    onChange(dateToDmy(d));
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <div ref={anchorRef} className="relative w-full">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(formatDmyInput(e.target.value))}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          placeholder={placeholder}
          maxLength={10}
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          disabled={disabled}
          className={inputClasses}
        />
        {showIcon && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen((v) => !v);
              if (!open) inputRef.current?.focus();
            }}
            tabIndex={-1}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-ink-muted hover:text-peri-600 hover:bg-peri-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Otvori kalendar"
          >
            <CalendarIcon size={14} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {open && pos &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label="Odabir datuma"
            style={{ top: pos.top, left: pos.left, width: POPUP_WIDTH }}
            className="fixed z-[60] app-datepicker bg-surface border border-border rounded-2xl shadow-xl font-sora animate-fade-in"
          >
            <DayPicker
              mode="single"
              selected={parsed ?? undefined}
              onSelect={handleSelect}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              weekStartsOn={1}
              showOutsideDays
              captionLayout="dropdown"
              startMonth={new Date(new Date().getFullYear() - 20, 0)}
              endMonth={new Date(new Date().getFullYear() + 5, 11)}
              formatters={{
                formatWeekdayName: (date) => WEEKDAYS_HR[date.getDay()],
                formatCaption: (date) =>
                  `${MONTHS_HR[date.getMonth()]} ${date.getFullYear()}`,
                formatMonthDropdown: (monthIndex) =>
                  MONTHS_HR[
                    typeof monthIndex === 'number' ? monthIndex : (monthIndex as Date).getMonth()
                  ],
                formatYearDropdown: (year) =>
                  String(typeof year === 'number' ? year : (year as Date).getFullYear()),
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === 'left' ? (
                    <ChevronLeft size={16} strokeWidth={1.8} />
                  ) : (
                    <ChevronRight size={16} strokeWidth={1.8} />
                  ),
              }}
              labels={{
                labelPrevious: () => 'Prethodni mjesec',
                labelNext: () => 'Sljedeći mjesec',
                labelMonthDropdown: () => 'Mjesec',
                labelYearDropdown: () => 'Godina',
              }}
            />
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border-light">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const today = new Date();
                  onChange(dateToDmy(today));
                  setVisibleMonth(today);
                }}
                className="px-2 py-1 rounded-md text-[12px] font-medium text-ink-secondary hover:bg-surface-page hover:text-peri-700 transition-colors"
              >
                Danas
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="px-2 py-1 rounded-md text-[12px] font-medium text-ink-muted hover:bg-surface-page hover:text-ink-secondary transition-colors"
              >
                Očisti
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
