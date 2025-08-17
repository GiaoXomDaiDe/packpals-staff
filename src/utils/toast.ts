// Global toast instance for use outside React components
let globalToast: {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
} | null = null;

export const setGlobalToast = (toast: typeof globalToast) => {
  globalToast = toast;
};

export const toast = {
  success: (title: string, message?: string) => {
    if (globalToast) {
      globalToast.success(title, message);
    } else {
      console.log(`✅ ${title}${message ? `: ${message}` : ''}`);
    }
  },
  error: (title: string, message?: string) => {
    if (globalToast) {
      globalToast.error(title, message);
    } else {
      console.error(`❌ ${title}${message ? `: ${message}` : ''}`);
    }
  },
  warning: (title: string, message?: string) => {
    if (globalToast) {
      globalToast.warning(title, message);
    } else {
      console.warn(`⚠️ ${title}${message ? `: ${message}` : ''}`);
    }
  },
  info: (title: string, message?: string) => {
    if (globalToast) {
      globalToast.info(title, message);
    } else {
      console.info(`ℹ️ ${title}${message ? `: ${message}` : ''}`);
    }
  },
};
