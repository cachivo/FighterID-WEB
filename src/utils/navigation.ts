// Navigation configuration for consistent routing
export const MAIN_ROUTES = {
  HOME: '/',
  EVENTS: '/eventos',
  FIGHTERS: '/fighters',
  PREDICTIONS: '/predicciones',
  PROFILE: '/profile',
  AUTH: '/auth',
  ADMIN: '/admin'
} as const;

export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  FIGHTERS_PROFILES: '/admin/fighters-profiles',
  FIGHTERS_PROFILES_CREATE: '/admin/fighters-profiles/create',
  LICENSE_VALIDATION: '/admin/licencias',
  EVENTS: '/admin/eventos-pelea',
  BETTING: '/admin/apuestas',
  RANKING: '/admin/ranking',
  ANALYTICS: '/admin/analytics',
  CONFIG: '/admin/configuracion'
} as const;

export const LICENSE_ROUTES = {
  WELCOME: '/license/welcome',
  ONBOARDING: '/license/onboarding',
  DASHBOARD: '/license/dashboard',
  AUTH: '/license/auth',
  VERIFY: '/verify-license'
} as const;

// Breadcrumb configurations for pages
export const BREADCRUMB_CONFIG = {
  '/': [{ label: 'Comunidad', isActive: true }],
  '/eventos': [{ label: 'Eventos', isActive: true }],
  '/fighters': [{ label: 'Peleadores', isActive: true }],
  '/predicciones': [{ label: 'Predicciones', isActive: true }],
  '/profile': [{ label: 'Mi Perfil', isActive: true }],
  '/license/dashboard': [{ label: 'Fighter ID', isActive: true }],
  '/admin/dashboard': [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard', isActive: true }
  ],
  '/admin/fighters-profiles': [
    { label: 'Admin', href: '/admin' },
    { label: 'Perfiles de Peleadores', isActive: true }
  ],
  '/admin/fighters-profiles/create': [
    { label: 'Admin', href: '/admin' },
    { label: 'Perfiles de Peleadores', href: '/admin/fighters-profiles' },
    { label: 'Crear Perfil', isActive: true }
  ],
  '/admin/licencias': [
    { label: 'Admin', href: '/admin' },
    { label: 'Licencias Fighter ID', isActive: true }
  ]
};

export type MainRoute = typeof MAIN_ROUTES[keyof typeof MAIN_ROUTES];
export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];
export type LicenseRoute = typeof LICENSE_ROUTES[keyof typeof LICENSE_ROUTES];