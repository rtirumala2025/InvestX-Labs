import React from "react";
import { Line } from "react-chartjs-2";
import { registerChartJS } from "../../utils/chartConfig";

// Ensure Chart.js is registered
registerChartJS();

const PortfolioPerformance = ({ performanceData }) => {
  // Default data if no performance data is provided
  const defaultData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Portfolio Value",
        data: [
          10000, 11000, 10800, 12000, 11800, 12500, 13000, 12800, 13500, 14000,
          14200, 14500,
        ],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const data = performanceData || defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            return `$${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (value) {
            return "$" + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 h-96">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Portfolio Performance
        </h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100">
            1M
          </button>
          <button className="px-3 py-1 text-sm rounded-md hover:bg-gray-100">
            3M
          </button>
          <button className="px-3 py-1 text-sm rounded-md hover:bg-gray-100">
            1Y
          </button>
          <button className="px-3 py-1 text-sm rounded-md hover:bg-gray-100">
            All
          </button>
        </div>
      </div>
      <div className="h-80">
        <Line data={data} options={options} />
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-500">
        <span>
          Portfolio Value: $
          {data.datasets[0].data[
            data.datasets[0].data.length - 1
          ]?.toLocaleString() || "0"}
        </span>
        <span>
          {data.datasets[0].data.length > 1 && (
            <>
              {data.datasets[0].data[data.datasets[0].data.length - 1] >=
              data.datasets[0].data[0]
                ? "▲"
                : "▼"}
              {(
                ((data.datasets[0].data[data.datasets[0].data.length - 1] -
                  data.datasets[0].data[0]) /
                  data.datasets[0].data[0]) *
                100
              ).toFixed(2)}
              % all time
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default PortfolioPerformance;
