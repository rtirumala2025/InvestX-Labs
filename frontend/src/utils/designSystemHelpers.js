/**
 * Design System Helper Functions
 * Utilities to apply the master design system consistently
 */

/**
 * Get the standard page background style
 */
export const getPageBackgroundStyle = () => ({
  background: 'var(--bg-base, #0a0f1a)',
  backgroundImage: 'var(--bg-gradient-primary), var(--bg-pattern-grid), var(--bg-pattern-noise)',
  backgroundSize: '100% 100%, 60px 60px, 400px 400px',
  backgroundAttachment: 'fixed'
});

/**
 * Get gradient orb classes for primary (growth) theme
 */
export const getPrimaryOrbClass = (opacity = 30) => 
  `bg-gradient-to-r from-primary-500/${opacity} to-primary-600/${opacity * 0.7} rounded-full blur-3xl`;

/**
 * Get gradient orb classes for accent (wealth) theme
 */
export const getAccentOrbClass = (opacity = 30) => 
  `bg-gradient-to-r from-accent-500/${opacity} to-accent-600/${opacity * 0.7} rounded-full blur-3xl`;

/**
 * Get heading classes with display font
 */
export const getDisplayHeadingClass = (size = '3xl') => 
  `text-${size} md:text-${size === '3xl' ? '4xl' : size} font-display font-normal tracking-tight text-gradient-hero`;

/**
 * Get subheading classes
 */
export const getSubheadingClass = () => 
  `text-2xl font-display font-normal text-white`;

/**
 * Get data/monospace text class
 */
export const getMonoTextClass = (color = 'primary-400') => 
  `font-mono text-${color}`;

/**
 * Map old color classes to new design system
 */
export const mapColorClass = (oldClass) => {
  const colorMap = {
    'green-400': 'primary-400',
    'green-500': 'primary-500',
    'green-600': 'primary-600',
    'blue-400': 'primary-400',
    'blue-500': 'primary-500',
    'blue-600': 'primary-600',
    'purple-400': 'accent-400',
    'purple-500': 'accent-500',
    'purple-600': 'accent-600',
    'orange-400': 'accent-400',
    'orange-500': 'accent-500',
    'yellow-400': 'accent-400',
    'yellow-500': 'accent-500',
  };
  
  for (const [old, newColor] of Object.entries(colorMap)) {
    if (oldClass.includes(old)) {
      return oldClass.replace(old, newColor);
    }
  }
  
  return oldClass;
};

