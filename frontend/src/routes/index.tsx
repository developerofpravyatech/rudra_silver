/**
 * RUDRA SILVER ERP - Application Routes Configuration
 * Declarative route constants for clean navigation.
 */

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  ITEMS: '/items',
  BILLING: '/billing',
  INVENTORY: '/inventory',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
