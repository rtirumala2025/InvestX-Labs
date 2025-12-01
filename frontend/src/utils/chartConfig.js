/**
 * Shared Chart.js Configuration
 * 
 * Centralized Chart.js registration to avoid duplicate registrations
 * and reduce bundle size by ensuring single instance.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';

// Register Chart.js components once
let isRegistered = false;

export const registerChartJS = () => {
  if (isRegistered) return;
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
  );
  
  isRegistered = true;
};

// Auto-register on import (for convenience)
registerChartJS();

export { ChartJS };

