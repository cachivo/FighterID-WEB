 /**
  * Centralized icon mapping for the Fighter ID platform
  * Replaces emojis with Lucide React icons for minimal, clean UI
  */
 
 // Icon names that can be used with DynamicIcon component
 export const SYSTEM_ICONS = {
   // Combat & Competition
   combat: 'Swords',
   boxing: 'Swords',
   mma: 'Swords',
   discipline: 'Swords',
   
   // Status & Results
   champion: 'Crown',
   trophy: 'Trophy',
   victory: 'Trophy',
   award: 'Award',
   medal: 'Medal',
   
   // Performance
   fire: 'Flame',
   highlight: 'Zap',
   energy: 'Zap',
   
   // Feedback
   success: 'Check',
   error: 'X',
   warning: 'AlertTriangle',
   info: 'Info',
   
   // Timer & Control
   play: 'Play',
   pause: 'Pause',
   stop: 'Square',
   clock: 'Clock',
   timer: 'Timer',
   pending: 'Clock',
   
   // Corners
   cornerRed: 'CircleDot',
   cornerBlue: 'CircleDot',
   
   // Misc
   target: 'Target',
   coffee: 'Coffee',
   star: 'Star',
   notification: 'Bell',
   chart: 'BarChart3',
 } as const;
 
 export type SystemIconKey = keyof typeof SYSTEM_ICONS;