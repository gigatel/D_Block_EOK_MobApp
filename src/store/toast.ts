import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; message: string };

type ToastState = {
  current: Toast | null;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
};

let seq = 0;
export const useToast = create<ToastState>(set => ({
  current: null,
  show: (message, kind = 'success') => set({ current: { id: ++seq, kind, message } }),
  hide: () => set({ current: null }),
}));

/** Imperative helper usable outside React. */
export const toast = (message: string, kind?: ToastKind) => useToast.getState().show(message, kind);
