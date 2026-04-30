'use client';

import { useEffect } from 'react';

const ACTIVE_TITLE = 'ayaanfaisal.com 🐐';
const INACTIVE_TITLE = 'come back! 😔';

export default function TabTitle() {
  useEffect(() => {
    const updateTitle = () => {
      document.title = document.hidden ? INACTIVE_TITLE : ACTIVE_TITLE;
    };

    updateTitle();
    document.addEventListener('visibilitychange', updateTitle);
    window.addEventListener('focus', updateTitle);
    window.addEventListener('blur', updateTitle);

    return () => {
      document.removeEventListener('visibilitychange', updateTitle);
      window.removeEventListener('focus', updateTitle);
      window.removeEventListener('blur', updateTitle);
    };
  }, []);

  return null;
}
