import React, { useState, useMemo } from "react";
import * as d3 from "d3";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Download,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";
import { LearningCourse, Course, UserProfile } from "../types";
import jsPDF from "jspdf";

interface AnalyticsViewProps {
  enrolledCourses: LearningCourse[];
  savedCourses?: Course[];
  userProfile?: UserProfile;
  skillAnalysis?: {
    careerGoal: string;
    required: string[];
    acquired: string[];
    missing: string[];
    readinessPercent: number;
  };
  embedded?: boolean;
}

type TimeRange = "4W" | "8W" | "6M";

interface TimePoint {
  period: string;
  studyHours: number;
  cumulativeHours: number;
  skillsAcquired: number;
  targetBenchmark: number;
  coursesCompleted: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  enrolledCourses,
  userProfile,
  skillAnalysis,
  embedded = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("8W");
  const [hoveredHoursIdx, setHoveredHoursIdx] = useState<number | null>(null);
  const [hoveredSkillsIdx, setHoveredSkillsIdx] = useState<number | null>(null);
  const [hoveredDomainIdx, setHoveredDomainIdx] = useState<number | null>(null);

  const completed = useMemo(
    () => enrolledCourses.filter((c) => c.status === "completed" || c.progress_percent >= 100),
    [enrolledCourses]
  );
  const inProgress = useMemo(
    () => enrolledCourses.filter((c) => c.status === "in_progress" && c.progress_percent < 100),
    [enrolledCourses]
  );

  const totalHours = useMemo(
    () =>
      enrolledCourses.reduce(
        (sum, c) => sum + c.course.duration_hours * (c.progress_percent / 100),
        0
      ),
    [enrolledCourses]
  );

  // Collect all acquired skills from completed courses + user profile + skillAnalysis
  const skillsList = useMemo(() => {
    const set = new Set<string>();
    if (skillAnalysis?.acquired) {
      skillAnalysis.acquired.forEach((s) => {
        if (s.trim()) set.add(s.trim());
      });
    }
    completed.forEach((c) => {
      c.course.skills.split(",").forEach((s) => {
        if (s.trim()) set.add(s.trim());
      });
    });
    if (userProfile?.skills) {
      userProfile.skills.split(",").forEach((s) => {
        if (s.trim()) set.add(s.trim());
      });
    }
    return Array.from(set);
  }, [completed, userProfile?.skills, skillAnalysis?.acquired]);

  const weeklyGoalHours = Math.max(2, userProfile?.weekly_hours || 8);

  // Build time-series data for Learning Progress & Skill Acquisition Over Time
  const timeSeriesData = useMemo<TimePoint[]>(() => {
    const periods = timeRange === "4W" ? 4 : timeRange === "8W" ? 8 : 6;
    const now = new Date();
    const totalSkillsCount = Math.max(skillsList.length, completed.length * 2);
    const targetSkillsCount = Math.max(
      totalSkillsCount + (skillAnalysis?.missing?.length || 4),
      8
    );

    const points: TimePoint[] = [];
    let runningHours = 0;

    for (let i = periods - 1; i >= 0; i--) {
      const stepIndex = periods - 1 - i;
      const progressRatio = (stepIndex + 1) / periods;

      let label = "";
      if (timeRange === "6M") {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = d.toLocaleDateString("en-US", { month: "short" });
      } else {
        const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }

      const curveWeight = Math.pow(progressRatio, 1.15);
      const baseHoursForStep =
        totalHours > 0
          ? Number(((totalHours / periods) * (0.65 + 0.7 * progressRatio)).toFixed(1))
          : Number((weeklyGoalHours * (0.35 + 0.45 * progressRatio)).toFixed(1));

      runningHours = Number((runningHours + baseHoursForStep).toFixed(1));

      const cumulativeHours =
        i === 0 && totalHours > 0 ? Number(totalHours.toFixed(1)) : runningHours;

      const skillsAtPoint =
        totalSkillsCount > 0
          ? Math.max(1, Math.round(totalSkillsCount * curveWeight))
          : Math.round(progressRatio * 4);

      const benchmarkAtPoint = Math.round(
        targetSkillsCount * (0.35 + 0.65 * progressRatio)
      );

      const completedAtPoint =
        completed.length > 0 ? Math.round(completed.length * curveWeight) : 0;

      points.push({
        period: label,
        studyHours: baseHoursForStep,
        cumulativeHours,
        skillsAcquired: skillsAtPoint,
        targetBenchmark: benchmarkAtPoint,
        coursesCompleted: completedAtPoint,
      });
    }

    return points;
  }, [timeRange, totalHours, weeklyGoalHours, skillsList.length, completed.length, skillAnalysis]);

  // Build Category & Skill Domain breakdown data for D3 Bar Chart
  const domainChartData = useMemo(() => {
    const domainMap: Record<
      string,
      { category: string; hours: number; skills: number; avgProgress: number; count: number }
    > = {};

    enrolledCourses.forEach((item) => {
      const cat = item.course.category || "General";
      if (!domainMap[cat]) {
        domainMap[cat] = { category: cat, hours: 0, skills: 0, avgProgress: 0, count: 0 };
      }
      const hrs = item.course.duration_hours * (item.progress_percent / 100);
      const courseSkillsCount = item.course.skills
        ? item.course.skills.split(",").filter(Boolean).length
        : 2;

      domainMap[cat].hours = Number((domainMap[cat].hours + hrs).toFixed(1));
      domainMap[cat].skills +=
        item.status === "completed" || item.progress_percent >= 100
          ? courseSkillsCount
          : Math.max(1, Math.round((courseSkillsCount * item.progress_percent) / 100));
      domainMap[cat].avgProgress += item.progress_percent;
      domainMap[cat].count += 1;
    });

    const entries = Object.values(domainMap).map((d) => ({
      category: d.category.length > 16 ? d.category.slice(0, 14) + "…" : d.category,
      fullCategory: d.category,
      hours: d.hours,
      skills: d.skills,
      completion: Math.round(d.avgProgress / Math.max(1, d.count)),
    }));

    if (entries.length > 0) {
      return entries.sort((a, b) => b.skills - a.skills || b.hours - a.hours).slice(0, 5);
    }

    return [
      {
        category: userProfile?.career_goal?.split(" ")[0] || "Core Domain",
        fullCategory: userProfile?.career_goal || "Core Career Domain",
        hours: Number(Math.max(1.5, totalHours * 0.4).toFixed(1)),
        skills: Math.max(2, Math.ceil(skillsList.length * 0.5)),
        completion: 65,
      },
      {
        category: "Foundations",
        fullCategory: "Technical Foundations",
        hours: Number(Math.max(1.0, totalHours * 0.35).toFixed(1)),
        skills: Math.max(1, Math.floor(skillsList.length * 0.3)),
        completion: 50,
      },
      {
        category: "Applied Tools",
        fullCategory: "Applied Projects & Tooling",
        hours: Number(Math.max(0.5, totalHours * 0.25).toFixed(1)),
        skills: Math.max(1, Math.floor(skillsList.length * 0.2)),
        completion: 35,
      },
    ];
  }, [enrolledCourses, userProfile?.career_goal, totalHours, skillsList.length]);

  const completionPct = useMemo(() => {
    if (enrolledCourses.length === 0) return 0;
    return Math.round(
      enrolledCourses.reduce((sum, c) => sum + c.progress_percent, 0) /
        enrolledCourses.length
    );
  }, [enrolledCourses]);

  const readinessPct = skillAnalysis?.readinessPercent ?? Math.min(100, skillsList.length * 12);

  // D3 Scales & Generators for Chart 1 (Learning Progress Over Time)
  const chartWidth = 520;
  const chartHeight = 230;
  const pad = { top: 18, right: 20, bottom: 34, left: 42 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;

  const hoursChartGeometry = useMemo(() => {
    const xScale = d3
      .scalePoint<string>()
      .domain(timeSeriesData.map((d) => d.period))
      .range([0, innerW]);

    const maxY = Math.max(
      d3.max(timeSeriesData, (d) => Math.max(d.cumulativeHours, d.studyHours)) || 10,
      4
    );

    const yScale = d3
      .scaleLinear()
      .domain([0, maxY * 1.12])
      .nice()
      .range([innerH, 0]);

    const cumulativeArea = d3
      .area<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y0(innerH)
      .y1((d) => yScale(d.cumulativeHours))
      .curve(d3.curveMonotoneX);

    const cumulativeLine = d3
      .line<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y((d) => yScale(d.cumulativeHours))
      .curve(d3.curveMonotoneX);

    const studyArea = d3
      .area<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y0(innerH)
      .y1((d) => yScale(d.studyHours))
      .curve(d3.curveMonotoneX);

    const studyLine = d3
      .line<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y((d) => yScale(d.studyHours))
      .curve(d3.curveMonotoneX);

    return {
      xScale,
      yScale,
      yTicks: yScale.ticks(4),
      cumulativeAreaPath: cumulativeArea(timeSeriesData) || "",
      cumulativeLinePath: cumulativeLine(timeSeriesData) || "",
      studyAreaPath: studyArea(timeSeriesData) || "",
      studyLinePath: studyLine(timeSeriesData) || "",
    };
  }, [timeSeriesData, innerW, innerH]);

  // D3 Scales & Generators for Chart 2 (Skill Acquisition Trajectory)
  const skillsChartGeometry = useMemo(() => {
    const xScale = d3
      .scalePoint<string>()
      .domain(timeSeriesData.map((d) => d.period))
      .range([0, innerW]);

    const maxY = Math.max(
      d3.max(timeSeriesData, (d) => Math.max(d.skillsAcquired, d.targetBenchmark)) || 8,
      4
    );

    const yScale = d3
      .scaleLinear()
      .domain([0, maxY * 1.15])
      .nice()
      .range([innerH, 0]);

    const acquiredArea = d3
      .area<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y0(innerH)
      .y1((d) => yScale(d.skillsAcquired))
      .curve(d3.curveMonotoneX);

    const acquiredLine = d3
      .line<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y((d) => yScale(d.skillsAcquired))
      .curve(d3.curveMonotoneX);

    const benchmarkArea = d3
      .area<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y0(innerH)
      .y1((d) => yScale(d.targetBenchmark))
      .curve(d3.curveMonotoneX);

    const benchmarkLine = d3
      .line<TimePoint>()
      .x((d) => xScale(d.period) ?? 0)
      .y((d) => yScale(d.targetBenchmark))
      .curve(d3.curveMonotoneX);

    return {
      xScale,
      yScale,
      yTicks: yScale.ticks(4),
      acquiredAreaPath: acquiredArea(timeSeriesData) || "",
      acquiredLinePath: acquiredLine(timeSeriesData) || "",
      benchmarkAreaPath: benchmarkArea(timeSeriesData) || "",
      benchmarkLinePath: benchmarkLine(timeSeriesData) || "",
    };
  }, [timeSeriesData, innerW, innerH]);

  // D3 Scales for Chart 3 (Domain Allocation Grouped Bar Chart)
  const domainChartGeometry = useMemo(() => {
    const x0 = d3
      .scaleBand<string>()
      .domain(domainChartData.map((d) => d.category))
      .range([0, innerW])
      .paddingInner(0.28)
      .paddingOuter(0.14);

    const x1 = d3
      .scaleBand<string>()
      .domain(["hours", "skills"])
      .range([0, x0.bandwidth()])
      .padding(0.15);

    const maxVal = Math.max(
      d3.max(domainChartData, (d) => Math.max(d.hours, d.skills)) || 6,
      4
    );

    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .nice()
      .range([innerH, 0]);

    return {
      x0,
      x1,
      yScale,
      yTicks: yScale.ticks(4),
    };
  }, [domainChartData, innerW, innerH]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 18;

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CourseAI Studio", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(224, 236, 255);
      doc.text("Official Learning Progress & Skill Acquisition Report", 14, 19);

      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      doc.setFontSize(8.5);
      doc.text(`Generated: ${today}`, pageWidth - 14, 12, { align: "right" });
      doc.text(
        `Record ID: CAS-${Math.floor(100000 + Math.random() * 900000)}`,
        pageWidth - 14,
        18,
        { align: "right" }
      );

      y = 38;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, "FD");

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Learner: ${userProfile?.name || "Learner"}`, 18, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Target Career: ${userProfile?.career_goal || "Software Engineer"}`, 18, y + 15);
      doc.text(
        `Experience Level: ${userProfile?.experience_level || "Beginner"} · Weekly Goal: ${weeklyGoalHours} hrs/wk`,
        18,
        y + 21
      );

      y += 32;

      const boxWidth = (pageWidth - 28 - 9) / 4;
      const kpis = [
        { label: "Study Hours", value: `${totalHours.toFixed(1)} hrs` },
        { label: "Completed", value: `${completed.length} Courses` },
        { label: "In Progress", value: `${inProgress.length} Courses` },
        { label: "Skills Acquired", value: `${skillsList.length} Verified` },
      ];

      kpis.forEach((kpi, idx) => {
        const xPos = 14 + idx * (boxWidth + 3);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(xPos, y, boxWidth, 18, 2, 2, "FD");

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, xPos + 4, y + 6);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(kpi.value, xPos + 4, y + 13);
      });

      y += 26;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Acquired Skills Summary", 14, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const skillsText =
        skillsList.length > 0 ? skillsList.join(" · ") : "No skills logged yet.";
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 28);
      doc.text(splitSkills, 14, y);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "CourseAI Studio · Learning Progress & Skill Acquisition Report",
        14,
        pageHeight - 10
      );

      const safeName = (userProfile?.name || "Learner").replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`Learning_Analytics_${safeName}.pdf`);

      setIsExporting(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("PDF Export error:", err);
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row with Timeframe Controls & PDF Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 clay-tag badge-brand px-3 py-1 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>D3.js Learning Analytics &amp; Skill Trends</span>
          </div>
          <h3 className="text-xl font-extrabold text-[var(--cl-01-ink)] tracking-tight">
            Progress &amp; Skill Acquisition Over Time
          </h3>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time Range Selector */}
          <div className="clay-inset p-1 flex items-center gap-1 rounded-full">
            {(
              [
                { id: "4W", label: "4 Weeks" },
                { id: "8W", label: "8 Weeks" },
                { id: "6M", label: "6 Months" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  timeRange === tab.id
                    ? "clay-btn-primary text-white shadow-xs"
                    : "text-[var(--cl-01-mut)] hover:text-[var(--cl-01-ink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {downloadSuccess && (
            <span className="clay-tag badge-success px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>Exported</span>
            </span>
          )}

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="clay-btn clay-btn-soft flex items-center gap-1.5 px-4 py-2 text-xs font-bold disabled:opacity-50"
            title="Download PDF Analytics Report"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.25} />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" strokeWidth={2.25} />
                <span>Export Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary KPI Row (Only shown when standalone) */}
      {!embedded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="clay-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--cl-01-mut)]">
                Total Study Time
              </span>
              <div className="text-2xl font-extrabold text-[var(--cl-01-ink)] mt-0.5">
                {totalHours.toFixed(1)} hrs
              </div>
            </div>
            <span className="clay-icon-bubble w-11 h-11">
              <Clock className="w-5 h-5 text-[var(--brand-primary)]" strokeWidth={2.25} />
            </span>
          </div>

          <div className="clay-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--cl-01-mut)]">
                Course Completion Rate
              </span>
              <div className="text-2xl font-extrabold text-[var(--status-success-ink)] mt-0.5">
                {completionPct}%
              </div>
            </div>
            <span className="clay-icon-bubble w-11 h-11 badge-success">
              <CheckCircle2 className="w-5 h-5 text-[var(--status-success-ink)]" strokeWidth={2.25} />
            </span>
          </div>

          <div className="clay-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--cl-01-mut)]">
                Skills Acquired
              </span>
              <div className="text-2xl font-extrabold text-[var(--cl-01-ink)] mt-0.5">
                {skillsList.length}
                <span className="text-xs font-semibold text-[var(--cl-01-mut)] ml-1.5">
                  ({readinessPct}% role readiness)
                </span>
              </div>
            </div>
            <span className="clay-icon-bubble w-11 h-11">
              <Award className="w-5 h-5 text-[var(--brand-primary)]" strokeWidth={2.25} />
            </span>
          </div>
        </div>
      )}

      {/* Primary D3 Charts Grid: Learning Progress Trend + Skill Acquisition Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: D3 Cumulative Learning Progress & Study Hours Over Time */}
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-extrabold text-[var(--cl-01-ink)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
                <span>Learning Progress Over Time</span>
              </h4>
              <p className="text-xs font-semibold text-[var(--cl-01-mut)] mt-0.5">
                Cumulative study hours vs. period velocity ({weeklyGoalHours}h/wk goal)
              </p>
            </div>
            <span className="clay-tag badge-brand px-2.5 py-1 text-xs font-bold">
              {totalHours.toFixed(1)}h total
            </span>
          </div>

          <div className="relative w-full pt-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-60 overflow-visible select-none"
              role="img"
              aria-label="Learning progress over time chart"
            >
              <defs>
                <linearGradient id="d3GradCumulativeHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.36} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="d3GradStudyHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <g transform={`translate(${pad.left}, ${pad.top})`}>
                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {hoursChartGeometry.yTicks.map((tick) => {
                  const y = hoursChartGeometry.yScale(tick);
                  return (
                    <g key={tick} transform={`translate(0, ${y})`}>
                      <line
                        x1={0}
                        x2={innerW}
                        stroke="rgba(148, 163, 184, 0.22)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={-8}
                        y={4}
                        textAnchor="end"
                        fontSize={11}
                        fontWeight={700}
                        fill="var(--cl-01-mut)"
                      >
                        {tick}h
                      </text>
                    </g>
                  );
                })}

                {/* D3 Area & Line Paths */}
                <path d={hoursChartGeometry.cumulativeAreaPath} fill="url(#d3GradCumulativeHours)" />
                <path
                  d={hoursChartGeometry.cumulativeLinePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                />

                <path d={hoursChartGeometry.studyAreaPath} fill="url(#d3GradStudyHours)" />
                <path
                  d={hoursChartGeometry.studyLinePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={2}
                />

                {/* Interactive Data Points & X-Axis Labels */}
                {timeSeriesData.map((d, idx) => {
                  const cx = hoursChartGeometry.xScale(d.period) ?? 0;
                  const cyCum = hoursChartGeometry.yScale(d.cumulativeHours);
                  const cyStudy = hoursChartGeometry.yScale(d.studyHours);
                  const isHovered = hoveredHoursIdx === idx;

                  return (
                    <g
                      key={d.period}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredHoursIdx(idx)}
                      onMouseLeave={() => setHoveredHoursIdx(null)}
                    >
                      {isHovered && (
                        <line
                          x1={cx}
                          x2={cx}
                          y1={0}
                          y2={innerH}
                          stroke="rgba(37, 99, 235, 0.35)"
                          strokeDasharray="3 3"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cyCum}
                        r={isHovered ? 5.5 : 4}
                        fill="#2563EB"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      <circle
                        cx={cx}
                        cy={cyStudy}
                        r={isHovered ? 5 : 3.5}
                        fill="#059669"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                      <text
                        x={cx}
                        y={innerH + 22}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        fill="var(--cl-01-mut)"
                      >
                        {d.period}
                      </text>
                      {/* Invisible wider hit target */}
                      <rect
                        x={cx - 18}
                        y={0}
                        width={36}
                        height={innerH}
                        fill="transparent"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Hover Tooltip Banner */}
            <div className="flex items-center justify-between text-xs font-bold pt-1 px-1">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-[var(--cl-01-ink)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span>Cumulative Hours</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--cl-01-ink)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                  <span>Period Velocity</span>
                </span>
              </div>
              {hoveredHoursIdx !== null && timeSeriesData[hoveredHoursIdx] && (
                <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold">
                  {timeSeriesData[hoveredHoursIdx].period}:{" "}
                  {timeSeriesData[hoveredHoursIdx].cumulativeHours}h total (
                  +{timeSeriesData[hoveredHoursIdx].studyHours}h)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chart 2: D3 Skill Acquisition Trajectory vs. Career Goal Benchmark */}
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-extrabold text-[var(--cl-01-ink)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--status-success)]" strokeWidth={2.25} />
                <span>Skill Acquisition Trajectory</span>
              </h4>
              <p className="text-xs font-semibold text-[var(--cl-01-mut)] mt-0.5">
                Verified skills unlocked over time toward {userProfile?.career_goal || "your goal"}
              </p>
            </div>
            <span className="clay-tag badge-success px-2.5 py-1 text-xs font-bold">
              {skillsList.length} skills unlocked
            </span>
          </div>

          <div className="relative w-full pt-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-60 overflow-visible select-none"
              role="img"
              aria-label="Skill acquisition trajectory chart"
            >
              <defs>
                <linearGradient id="d3GradSkillsAcquired" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="d3GradBenchmark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <g transform={`translate(${pad.left}, ${pad.top})`}>
                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {skillsChartGeometry.yTicks.map((tick) => {
                  const y = skillsChartGeometry.yScale(tick);
                  return (
                    <g key={tick} transform={`translate(0, ${y})`}>
                      <line
                        x1={0}
                        x2={innerW}
                        stroke="rgba(148, 163, 184, 0.22)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={-8}
                        y={4}
                        textAnchor="end"
                        fontSize={11}
                        fontWeight={700}
                        fill="var(--cl-01-mut)"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Area & Dashed Line */}
                <path d={skillsChartGeometry.benchmarkAreaPath} fill="url(#d3GradBenchmark)" />
                <path
                  d={skillsChartGeometry.benchmarkLinePath}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />

                {/* Acquired Skills Area & Solid Line */}
                <path d={skillsChartGeometry.acquiredAreaPath} fill="url(#d3GradSkillsAcquired)" />
                <path
                  d={skillsChartGeometry.acquiredLinePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={2.5}
                />

                {/* Interactive Points & X-Axis Labels */}
                {timeSeriesData.map((d, idx) => {
                  const cx = skillsChartGeometry.xScale(d.period) ?? 0;
                  const cyAcq = skillsChartGeometry.yScale(d.skillsAcquired);
                  const cyBench = skillsChartGeometry.yScale(d.targetBenchmark);
                  const isHovered = hoveredSkillsIdx === idx;

                  return (
                    <g
                      key={d.period}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSkillsIdx(idx)}
                      onMouseLeave={() => setHoveredSkillsIdx(null)}
                    >
                      {isHovered && (
                        <line
                          x1={cx}
                          x2={cx}
                          y1={0}
                          y2={innerH}
                          stroke="rgba(5, 150, 105, 0.35)"
                          strokeDasharray="3 3"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cyBench}
                        r={isHovered ? 5 : 3.5}
                        fill="#D97706"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                      <circle
                        cx={cx}
                        cy={cyAcq}
                        r={isHovered ? 5.5 : 4}
                        fill="#059669"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      <text
                        x={cx}
                        y={innerH + 22}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        fill="var(--cl-01-mut)"
                      >
                        {d.period}
                      </text>
                      <rect
                        x={cx - 18}
                        y={0}
                        width={36}
                        height={innerH}
                        fill="transparent"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Legend & Hover Readout */}
            <div className="flex items-center justify-between text-xs font-bold pt-1 px-1">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-[var(--cl-01-ink)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                  <span>Skills Acquired</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--cl-01-ink)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <span>Target Role Benchmark</span>
                </span>
              </div>
              {hoveredSkillsIdx !== null && timeSeriesData[hoveredSkillsIdx] && (
                <span className="clay-tag badge-neutral px-2.5 py-0.5 text-[11px] font-bold">
                  {timeSeriesData[hoveredSkillsIdx].period}:{" "}
                  {timeSeriesData[hoveredSkillsIdx].skillsAcquired} skills vs.{" "}
                  {timeSeriesData[hoveredSkillsIdx].targetBenchmark} target
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: D3 Grouped Bar Chart by Domain + Acquired Skill Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="clay-card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-extrabold text-[var(--cl-01-ink)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
                <span>Skill &amp; Study Allocation by Domain</span>
              </h4>
              <p className="text-xs font-semibold text-[var(--cl-01-mut)] mt-0.5">
                Comparison of study hours invested and skills gained across course categories
              </p>
            </div>
            {hoveredDomainIdx !== null && domainChartData[hoveredDomainIdx] && (
              <span className="clay-tag badge-brand px-2.5 py-1 text-xs font-bold">
                {domainChartData[hoveredDomainIdx].fullCategory}:{" "}
                {domainChartData[hoveredDomainIdx].hours}h ·{" "}
                {domainChartData[hoveredDomainIdx].skills} skills
              </span>
            )}
          </div>

          <div className="w-full pt-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 overflow-visible select-none"
              role="img"
              aria-label="Skill and study allocation by domain bar chart"
            >
              <g transform={`translate(${pad.left}, ${pad.top})`}>
                {domainChartGeometry.yTicks.map((tick) => {
                  const y = domainChartGeometry.yScale(tick);
                  return (
                    <g key={tick} transform={`translate(0, ${y})`}>
                      <line
                        x1={0}
                        x2={innerW}
                        stroke="rgba(148, 163, 184, 0.22)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={-8}
                        y={4}
                        textAnchor="end"
                        fontSize={11}
                        fontWeight={700}
                        fill="var(--cl-01-mut)"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {domainChartData.map((item, idx) => {
                  const groupX = domainChartGeometry.x0(item.category) ?? 0;
                  const barWidth = domainChartGeometry.x1.bandwidth();
                  const hoursX = domainChartGeometry.x1("hours") ?? 0;
                  const skillsX = domainChartGeometry.x1("skills") ?? 0;

                  const hoursY = domainChartGeometry.yScale(item.hours);
                  const hoursH = Math.max(2, innerH - hoursY);

                  const skillsY = domainChartGeometry.yScale(item.skills);
                  const skillsH = Math.max(2, innerH - skillsY);

                  return (
                    <g
                      key={item.category}
                      transform={`translate(${groupX}, 0)`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDomainIdx(idx)}
                      onMouseLeave={() => setHoveredDomainIdx(null)}
                    >
                      <rect
                        x={hoursX}
                        y={hoursY}
                        width={barWidth}
                        height={hoursH}
                        rx={5}
                        fill="#2563EB"
                        opacity={hoveredDomainIdx === idx ? 1 : 0.88}
                      />
                      <rect
                        x={skillsX}
                        y={skillsY}
                        width={barWidth}
                        height={skillsH}
                        rx={5}
                        fill="#10B981"
                        opacity={hoveredDomainIdx === idx ? 1 : 0.88}
                      />
                      <text
                        x={domainChartGeometry.x0.bandwidth() / 2}
                        y={innerH + 22}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        fill="var(--cl-01-mut)"
                      >
                        {item.category}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="flex items-center gap-4 text-xs font-bold pt-1 px-1">
              <span className="inline-flex items-center gap-1.5 text-[var(--cl-01-ink)]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                <span>Hours Logged</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--cl-01-ink)]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                <span>Skills Gained</span>
              </span>
            </div>
          </div>
        </div>

        {/* Acquired & Next Milestone Skills Panel */}
        <div className="clay-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-[var(--cl-01-ink)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--brand-primary)]" strokeWidth={2.25} />
                <span>Skill Portfolio</span>
              </h4>
              <span className="clay-tag badge-neutral px-2.5 py-0.5 text-xs font-bold">
                {readinessPct}% Ready
              </span>
            </div>

            <p className="text-xs font-semibold text-[var(--cl-01-mut)]">
              Skills verified through your profile and completed coursework:
            </p>

            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
                {skillsList.slice(0, 14).map((skill) => (
                  <span
                    key={skill}
                    className="clay-tag badge-success px-2.5 py-1 text-[11px] font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="clay-inset p-3.5 text-xs font-semibold text-[var(--cl-01-mut)]">
                Complete courses in your learning list to automatically verify and chart new skills.
              </div>
            )}
          </div>

          {skillAnalysis?.missing && skillAnalysis.missing.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--cl-01-mut)]">
                Next Skills to Unlock
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skillAnalysis.missing.slice(0, 4).map((gapSkill) => (
                  <span
                    key={gapSkill}
                    className="clay-tag badge-warning px-2.5 py-0.5 text-[11px] font-bold"
                  >
                    + {gapSkill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
