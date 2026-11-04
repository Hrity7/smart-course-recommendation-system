import React from "react";
import { Info, Check } from "lucide-react";

interface DisclaimerBannerProps {
  isVisible: boolean;
  onAcknowledge: () => void;
  onOpenDisclaimerPage: () => void;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  isVisible,
  onAcknowledge,
  onOpenDisclaimerPage,
}) => {
  if (!isVisible) return null;

  return (
    <div className="px-4 md:px-8 pt-2 pb-1">
      <div className="clay-card surface-brand px-5 py-2.5 text-[var(--cl-01-ink)] max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <span className="clay-icon-bubble w-7 h-7 text-[var(--cl-01-ink)] shrink-0">
            <Info className="w-3.5 h-3.5" strokeWidth={2.25} />
          </span>
          <p className="text-[var(--cl-01-ink)]">
            Suggestions are AI guidance only and do not guarantee career outcomes.{" "}
            <button
              onClick={onOpenDisclaimerPage}
              className="font-extrabold text-[var(--cl-01-ink)] underline underline-offset-2 hover:opacity-80"
            >
              Learn more
            </button>
          </p>
        </div>

        <button
          onClick={onAcknowledge}
          className="clay-btn clay-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shrink-0"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span>I understand</span>
        </button>
      </div>
    </div>
  );
};
