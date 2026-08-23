import { useCallback, useEffect, useState } from 'react';

const lockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  const { body } = document;
  const previousOverflow = body.style.overflow;
  body.dataset.prevOverflow = previousOverflow;
  body.style.overflow = 'hidden';
};

const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  const { body } = document;
  const previousOverflow = body.dataset.prevOverflow || '';
  body.style.overflow = previousOverflow;
  delete body.dataset.prevOverflow;
};

export const useDrawer = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial);

  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }

    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
};

export default useDrawer;
