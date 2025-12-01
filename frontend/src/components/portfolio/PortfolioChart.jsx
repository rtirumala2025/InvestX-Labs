import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { registerChartJS } from '../../utils/chartConfig';
import LoadingSpinner from '../common/LoadingSpinner';

// Ensure Chart.js is registered
registerChartJS();

const TIMEFRAME_WINDOWS = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  ALL: null,
};

const PortfolioChart = ({
  portfolio,
  holdings = [],
  transactions = [],
  marketData = {},
  timeframe = '1M',
  loading = false,
  error = null,
}) => {
  const historicalSeries = useMemo(() => {
    const metadataHistory = portfolio?.metadata?.historicalData || [];
    if (metadataHistory.length) {
      return metadataHistory.map((entry) => ({
        date: entry.date,
        value: entry.value,
      }));
    }
    return [];
  }, [portfolio?.metadata?.historicalData]);

  const syntheticSeries = useMemo(() => {
    if (historicalSeries.length > 1) {
      return historicalSeries;
    }

    if (transactions.length === 0) {
      const totalValue = holdings.reduce((sum, holding) => {
        const currentPrice = holding.current_price || holding.purchase_price || 0;
        return sum + currentPrice * holding.shares;
      }, 0);

      if (totalValue > 0) {
        return [{ date: new Date().toISOString(), value: totalValue }];
      }

      return [];
    }

    const sorted = [...transactions]
      .filter((tx) => tx.transaction_date)
      .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    let cumulativeValue = 0;
    const points = [];

    sorted.forEach((tx) => {
      const amount = Number(tx.total_amount) || 0;
      cumulativeValue += amount;
      points.push({
        date: tx.transaction_date,
        value: Math.max(0, cumulativeValue * -1),
      });
    });

    const latestValue = holdings.reduce((sum, holding) => {
      const quote = marketData?.[holding.symbol];
      const price = quote?.price || holding.current_price || holding.purchase_price || 0;
      return sum + price * holding.shares;
    }, 0);

    if (latestValue > 0) {
      points.push({ date: new Date().toISOString(), value: latestValue });
    }

    return points;
  }, [transactions, holdings, marketData, historicalSeries]);

  const chartPoints = useMemo(() => {
    const source = historicalSeries.length ? historicalSeries : syntheticSeries;

    if (!source.length) {
      return [];
    }

    const windowDays = TIMEFRAME_WINDOWS[timeframe] ?? null;
    const cutoff = windowDays ? Date.now() - windowDays * 24 * 60 * 60 * 1000 : null;

    const filtered = source.filter((point) => {
      if (!point?.date) return false;
      const timestamp = new Date(point.date).getTime();
      if (Number.isNaN(timestamp)) return false;
      if (!cutoff) return true;
      return timestamp >= cutoff;
    });

    return filtered.map((point) => ({
      label: new Date(point.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      value: Number(point.value) || 0,
    }));
  }, [historicalSeries, syntheticSeries, timeframe]);

  const chartData = useMemo(() => {
    if (!chartPoints.length) {
      return null;
    }

    return {
      labels: chartPoints.map((point) => point.label),
      datasets: [
        {
          label: 'Portfolio Value',
          data: chartPoints.map((point) => point.value),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [chartPoints]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `$${(context.parsed.y || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) =>
              `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            color: 'rgba(255, 255, 255, 0.6)',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
          },
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
          },
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center text-white/80">
          <LoadingSpinner size="large" />
          <p className="mt-4">Loading portfolio performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-red-300">⚠️ {error}</p>
      </div>
    );
  }

  if (!chartData || chartData.datasets[0].data.every((value) => value === 0)) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center text-white/70">
          <div className="text-4xl mb-3">📈</div>
          <p className="font-semibold mb-1">Add holdings to see performance data</p>
          <p className="text-sm text-white/50">
            We\'ll start charting your portfolio as soon as you add your first investment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default React.memo(PortfolioChart);
