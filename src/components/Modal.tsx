import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        contentRef.current?.querySelector<HTMLElement>('input, select, button[type="submit"]')?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/10 backdrop-blur-[2px] p-0 sm:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="font-sora bg-surface w-full sm:max-w-[420px] sm:rounded-2xl rounded-t-2xl border border-border max-h-[85dvh] overflow-y-auto animate-slide-up"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-[15px] font-semibold text-ink tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 -m-1.5 rounded-lg hover:bg-surface-page transition-colors text-ink-muted hover:text-ink-secondary"
            aria-label="Zatvori"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>
        <div className="border-t border-border-light" />
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
