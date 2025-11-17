import React from "react";
import { useApp } from "../../contexts/AppContext";

const positionClasses = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "top-center": "top-4 left-1/2 transform -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
};

const NetworkStatus = ({
  showWhenOnline = false,
  position = "top-right",
  className = "",
  style = {},
}) => {
  const { isOnline } = useApp();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  const message = isOnline
    ? "You are online"
    : "You are offline. Changes will sync when you reconnect.";

  return (
    <div
      className={`fixed ${positionClasses[position] || positionClasses["top-right"]} z-50 max-w-sm ${className}`}
      style={style}
    >
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300
        ${isOnline ? "bg-emerald-500/80" : "bg-red-500/80 animate-pulse"} text-white`}
      >
        <span className="text-lg">{isOnline ? "🌐" : "📴"}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;
