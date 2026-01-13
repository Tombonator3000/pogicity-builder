import React, { useState, useEffect } from "react";
import type { BudgetState, TaxRates } from "@/game/systems/BudgetSystem";

interface BudgetPanelProps {
  budgetState: BudgetState;
  taxRates: TaxRates;
  timeUntilNextCycle: number;
  onTaxRateChange: (category: keyof TaxRates, rate: number) => void;
  onTakeLoan: (amount: number) => void;
}

/**
 * Fallout-style terminal budget panel
 * Shows city finances, taxes, and expenses with CRT phosphor aesthetic
 */
export function BudgetPanel({
  budgetState,
  taxRates,
  timeUntilNextCycle,
  onTaxRateChange,
  onTakeLoan,
}: BudgetPanelProps) {
  const [showLoanPrompt, setShowLoanPrompt] = useState(false);
  const [loanAmount, setLoanAmount] = useState(1000);

  // Calculate totals
  const totalIncome =
    budgetState.income.residential +
    budgetState.income.commercial +
    budgetState.income.industrial;

  const totalExpenses =
    budgetState.expenses.services +
    budgetState.expenses.infrastructure +
    budgetState.expenses.maintenance;

  const netIncome = totalIncome - totalExpenses;

  // Format currency
  const formatCaps = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    if (Math.abs(value) >= 1000) {
      return `${sign}${(value / 1000).toFixed(1)}K`;
    }
    return `${sign}${Math.floor(value)}`;
  };

  // Format time
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Color based on value
  const getValueColor = (value: number): string => {
    if (value > 0) return "hsl(120 80% 55%)"; // Green
    if (value < 0) return "hsl(0 80% 55%)"; // Red
    return "hsl(120 40% 40%)"; // Dim green
  };

  const handleTakeLoan = () => {
    onTakeLoan(loanAmount);
    setShowLoanPrompt(false);
  };

  return (
    <div
      className="absolute left-4 bottom-4 w-80 z-30"
      style={{
        background:
          "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
        border: "2px solid",
        borderColor:
          "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
        boxShadow: `
          0 0 20px hsl(120 100% 50% / 0.1),
          inset 0 0 30px hsl(120 100% 50% / 0.02),
          0 4px 12px rgba(0, 0, 0, 0.4)
        `,
        maxHeight: "calc(100vh - 8rem)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(90deg, hsl(120 18% 10%) 0%, hsl(120 22% 13%) 50%, hsl(120 18% 10%) 100%)",
          borderBottom: "1px solid hsl(120 30% 18%)",
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-widest"
          style={{
            color: "hsl(120 100% 65%)",
            textShadow: "0 0 8px hsl(120 100% 50% / 0.5)",
          }}
        >
          BUDGET & FINANCE
        </h3>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: "hsl(120 100% 55%)",
            boxShadow: "0 0 6px hsl(120 100% 50% / 0.6)",
          }}
        />
      </div>

      {/* Balance Section */}
      <div className="p-3 border-b" style={{ borderColor: "hsl(120 20% 15%)" }}>
        <div
          className="p-3"
          style={{
            background: "hsl(120 8% 4%)",
            border: "1px solid hsl(120 20% 15%)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                style={{
                  color: "hsl(120 80% 55%)",
                  textShadow: "0 0 6px hsl(120 80% 55%)",
                  fontSize: "16px",
                }}
              >
                ◎
              </span>
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: "hsl(120 60% 55%)" }}
              >
                TREASURY
              </span>
            </div>
            <span
              className="text-lg font-mono font-bold"
              style={{
                color: getValueColor(budgetState.balance),
                textShadow: `0 0 8px ${getValueColor(budgetState.balance)}`,
              }}
            >
              {Math.floor(budgetState.balance)} CAPS
            </span>
          </div>

          {budgetState.debt > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "hsl(0 60% 55%)" }}>DEBT</span>
              <span
                className="font-mono"
                style={{
                  color: "hsl(0 80% 55%)",
                  textShadow: "0 0 6px hsl(0 80% 55%)",
                }}
              >
                -{Math.floor(budgetState.debt)} CAPS
              </span>
            </div>
          )}

          {/* Next cycle countdown */}
          <div className="mt-2 pt-2 border-t" style={{ borderColor: "hsl(120 20% 15%)" }}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "hsl(120 40% 40%)" }}>NEXT CYCLE</span>
              <span
                className="font-mono"
                style={{
                  color: "hsl(45 80% 55%)",
                  textShadow: "0 0 6px hsl(45 80% 55%)",
                }}
              >
                {formatTime(timeUntilNextCycle)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Report Section */}
      <div className="p-3 border-b" style={{ borderColor: "hsl(120 20% 15%)" }}>
        <div className="mb-2">
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: "hsl(120 60% 55%)" }}
          >
            MONTHLY REPORT
          </span>
        </div>

        {/* Income */}
        <div
          className="p-2 mb-2"
          style={{
            background: "hsl(120 8% 4%)",
            border: "1px solid hsl(120 20% 15%)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "hsl(120 40% 40%)" }}>
              INCOME
            </span>
            <span
              className="text-sm font-mono font-bold"
              style={{
                color: getValueColor(totalIncome),
                textShadow: `0 0 6px ${getValueColor(totalIncome)}`,
              }}
            >
              {formatCaps(totalIncome)}
            </span>
          </div>

          {/* Income breakdown */}
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between" style={{ color: "hsl(120 30% 35%)" }}>
              <span>Residential Tax</span>
              <span className="font-mono">
                {formatCaps(budgetState.income.residential)}
              </span>
            </div>
            <div className="flex justify-between" style={{ color: "hsl(120 30% 35%)" }}>
              <span>Commercial Tax</span>
              <span className="font-mono">
                {formatCaps(budgetState.income.commercial)}
              </span>
            </div>
            <div className="flex justify-between" style={{ color: "hsl(120 30% 35%)" }}>
              <span>Industrial Tax</span>
              <span className="font-mono">
                {formatCaps(budgetState.income.industrial)}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div
          className="p-2 mb-2"
          style={{
            background: "hsl(120 8% 4%)",
            border: "1px solid hsl(120 20% 15%)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "hsl(120 40% 40%)" }}>
              EXPENSES
            </span>
            <span
              className="text-sm font-mono font-bold"
              style={{
                color: "hsl(0 80% 55%)",
                textShadow: "0 0 6px hsl(0 80% 55%)",
              }}
            >
              -{formatCaps(totalExpenses).replace("+", "")}
            </span>
          </div>

          {/* Expenses breakdown */}
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between" style={{ color: "hsl(120 30% 35%)" }}>
              <span>Services</span>
              <span className="font-mono">
                -{formatCaps(budgetState.expenses.services).replace("+", "")}
              </span>
            </div>
            <div className="flex justify-between" style={{ color: "hsl(120 30% 35%)" }}>
              <span>Infrastructure</span>
              <span className="font-mono">
                -{formatCaps(budgetState.expenses.infrastructure).replace("+", "")}
              </span>
            </div>
            <div className="flex justify-between" style={{ color: "hsl(120 30% 35%)" }}>
              <span>Maintenance</span>
              <span className="font-mono">
                -{formatCaps(budgetState.expenses.maintenance).replace("+", "")}
              </span>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div
          className="p-2"
          style={{
            background: "hsl(120 8% 4%)",
            border: "2px solid",
            borderColor:
              netIncome >= 0 ? "hsl(120 40% 20%)" : "hsl(0 40% 20%)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold"
              style={{ color: "hsl(120 60% 55%)" }}
            >
              NET INCOME
            </span>
            <span
              className="text-base font-mono font-bold"
              style={{
                color: getValueColor(netIncome),
                textShadow: `0 0 8px ${getValueColor(netIncome)}`,
              }}
            >
              {formatCaps(netIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Tax Rates Section */}
      <div className="p-3 border-b" style={{ borderColor: "hsl(120 20% 15%)" }}>
        <div className="mb-2">
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: "hsl(120 60% 55%)" }}
          >
            TAX RATES
          </span>
        </div>

        {/* Residential Tax */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: "hsl(120 40% 40%)" }}>
              RESIDENTIAL
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{
                color: "hsl(120 80% 55%)",
                textShadow: "0 0 6px hsl(120 80% 55%)",
              }}
            >
              {taxRates.residential}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={taxRates.residential}
            onChange={(e) =>
              onTaxRateChange("residential", parseInt(e.target.value))
            }
            className="w-full h-2 rounded appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                hsl(120 80% 45%) 0%,
                hsl(120 80% 45%) ${(taxRates.residential / 20) * 100}%,
                hsl(120 20% 15%) ${(taxRates.residential / 20) * 100}%,
                hsl(120 20% 15%) 100%)`,
            }}
          />
        </div>

        {/* Commercial Tax */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: "hsl(120 40% 40%)" }}>
              COMMERCIAL
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{
                color: "hsl(120 80% 55%)",
                textShadow: "0 0 6px hsl(120 80% 55%)",
              }}
            >
              {taxRates.commercial}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={taxRates.commercial}
            onChange={(e) =>
              onTaxRateChange("commercial", parseInt(e.target.value))
            }
            className="w-full h-2 rounded appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                hsl(45 80% 45%) 0%,
                hsl(45 80% 45%) ${(taxRates.commercial / 20) * 100}%,
                hsl(120 20% 15%) ${(taxRates.commercial / 20) * 100}%,
                hsl(120 20% 15%) 100%)`,
            }}
          />
        </div>

        {/* Industrial Tax */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: "hsl(120 40% 40%)" }}>
              INDUSTRIAL
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{
                color: "hsl(120 80% 55%)",
                textShadow: "0 0 6px hsl(120 80% 55%)",
              }}
            >
              {taxRates.industrial}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={taxRates.industrial}
            onChange={(e) =>
              onTaxRateChange("industrial", parseInt(e.target.value))
            }
            className="w-full h-2 rounded appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                hsl(30 80% 45%) 0%,
                hsl(30 80% 45%) ${(taxRates.industrial / 20) * 100}%,
                hsl(120 20% 15%) ${(taxRates.industrial / 20) * 100}%,
                hsl(120 20% 15%) 100%)`,
            }}
          />
        </div>
      </div>

      {/* Loan Section */}
      <div className="p-3">
        {!showLoanPrompt ? (
          <button
            onClick={() => setShowLoanPrompt(true)}
            className="w-full py-2 px-3 text-xs font-bold tracking-wider uppercase transition-all"
            style={{
              background: "hsl(120 18% 10%)",
              border: "1px solid hsl(120 30% 18%)",
              color: "hsl(120 80% 55%)",
              textShadow: "0 0 6px hsl(120 80% 55%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(120 22% 13%)";
              e.currentTarget.style.borderColor = "hsl(120 40% 25%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(120 18% 10%)";
              e.currentTarget.style.borderColor = "hsl(120 30% 18%)";
            }}
          >
            TAKE LOAN
          </button>
        ) : (
          <div
            className="p-3"
            style={{
              background: "hsl(120 8% 4%)",
              border: "1px solid hsl(120 20% 15%)",
            }}
          >
            <div className="mb-2">
              <span
                className="text-xs font-bold"
                style={{ color: "hsl(120 60% 55%)" }}
              >
                LOAN AMOUNT
              </span>
            </div>
            <input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={loanAmount}
              onChange={(e) => setLoanAmount(parseInt(e.target.value) || 0)}
              className="w-full p-2 mb-2 text-sm font-mono"
              style={{
                background: "hsl(120 10% 6%)",
                border: "1px solid hsl(120 20% 15%)",
                color: "hsl(120 80% 55%)",
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleTakeLoan}
                className="flex-1 py-1.5 px-2 text-xs font-bold tracking-wider uppercase"
                style={{
                  background: "hsl(120 18% 10%)",
                  border: "1px solid hsl(120 30% 18%)",
                  color: "hsl(120 80% 55%)",
                }}
              >
                CONFIRM
              </button>
              <button
                onClick={() => setShowLoanPrompt(false)}
                className="flex-1 py-1.5 px-2 text-xs font-bold tracking-wider uppercase"
                style={{
                  background: "hsl(0 18% 10%)",
                  border: "1px solid hsl(0 30% 18%)",
                  color: "hsl(0 80% 55%)",
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-1.5 text-center"
        style={{
          borderTop: "1px solid hsl(120 20% 15%)",
          background: "hsl(120 8% 4%)",
        }}
      >
        <span
          className="text-[9px] uppercase tracking-widest"
          style={{ color: "hsl(120 40% 35%)" }}
        >
          WASTELAND FINANCE SYSTEM v1.2
        </span>
      </div>
    </div>
  );
}
