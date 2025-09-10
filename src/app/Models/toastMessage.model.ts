export interface ToastMessage {
    type: 'success' | 'error' | 'info';
    title: string;
    text: string;
  }