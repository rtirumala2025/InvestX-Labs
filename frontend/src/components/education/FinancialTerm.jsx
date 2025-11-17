import React from "react";
import Tooltip from "../ui/Tooltip";
import { getTermInfo } from "../../utils/financialTerms";

const FinancialTerm = ({ term, children, definition, showFull = false }) => {
  const termKey = term.toLowerCase().replace(/\s+/g, "_");
  const termInfo = getTermInfo(termKey);

  // Use provided definition, or fall back to our dictionary
  const tooltipContent =
    definition || (showFull ? termInfo.full : termInfo.simple);
  const exampleText = termInfo.example
    ? `\n\nExample: ${termInfo.example}`
    : "";

  if (!tooltipContent || tooltipContent === "Financial term") {
    return <span>{children}</span>;
  }

  return (
    <Tooltip content={`${tooltipContent}${exampleText}`}>
      <span className="underline decoration-dotted decoration-blue-400/50 underline-offset-2 cursor-help text-blue-300 hover:text-blue-200 transition-colors">
        {children || termInfo.term}
      </span>
    </Tooltip>
  );
};

export default FinancialTerm;
