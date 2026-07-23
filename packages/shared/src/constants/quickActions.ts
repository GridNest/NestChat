import { QuickAction } from '../types/clientConfig.js';

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'services',
    label: 'Our Services',
    labelHi: 'Hamari Sevayein',
    icon: 'briefcase',
    action: 'show_services',
  },
  {
    id: 'pricing',
    label: 'Pricing',
    labelHi: 'Keemat',
    icon: 'dollar-sign',
    action: 'show_pricing',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    labelHi: 'Kaam ka Portfolio',
    icon: 'folder',
    action: 'show_portfolio',
  },
  {
    id: 'book_consultation',
    label: 'Book Consultation',
    labelHi: 'Consultation Book Karein',
    icon: 'calendar',
    action: 'book_consultation',
  },
  {
    id: 'contact',
    label: 'Contact Us',
    labelHi: 'Humse Sampark Karein',
    icon: 'phone',
    action: 'show_contact',
  },
  {
    id: 'get_quote',
    label: 'Get Quote',
    labelHi: 'Quote Lein',
    icon: 'message-square',
    action: 'start_inquiry',
  },
];
