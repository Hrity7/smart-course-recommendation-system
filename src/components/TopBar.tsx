import React from "react";
import { Search, User, Moon, Sun } from "lucide-react";
import { UserProfile } from "../types";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  userProfile: UserProfile;
  onOpenProfileModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  userProfile,
  onOpenProfileModal,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearchSubmit();
    }
  };

  return (
    <header className="px-4 md:px-8 pt-4 pb-2 sticky top-0 z-20">
      <div className="clay-card px-5 py-3 flex items-center justify-between gap-4 max-w-6xl mx-auto">
        {/* YouTube Course Search Input + Button */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cl-01-mut)]"
              strokeWidth={2.25}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search YouTube courses, topics, or skills..."
              aria-label="Search YouTube courses"
              className="w-full pl-11 pr-4 py-2 text-xs font-semibold clay-inset text-[var(--cl-01-ink)] placeholder:text-[var(--cl-01-mut)]"
            />
          </div>
          <button
            type="button"
            onClick={onSearchSubmit}
            className="clay-btn clay-btn-primary px-3.5 py-2 text-xs font-bold shrink-0"
          >
            Search
          </button>
        </div>

        {/* Right: Theme Toggle & Profile Button */}
        <div className="flex items-center gap-2.5">

          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="clay-btn clay-btn-soft flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[var(--cl-01-ink)]"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-[#F59E0B]" strokeWidth={2.25} />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#2563EB]" strokeWidth={2.25} />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenProfileModal}
            title={`${userProfile.name || "Learner"} · ${userProfile.career_goal || "Edit Profile"}`}
            aria-label="Edit Profile"
            className="clay-btn clay-btn-soft flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[var(--cl-01-ink)]"
          >
            <User className="w-4 h-4 text-[#2563EB]" strokeWidth={2.25} />
            <span className="hidden sm:inline">{userProfile.name?.split(" ")[0] || "Profile"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
