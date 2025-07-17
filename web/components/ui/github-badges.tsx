"use client";
import { Star, GitFork, Eye } from "lucide-react";
import React, { useEffect, useState } from "react";

interface GitHubStarBadgeProps {
  owner: string;
  repo: string;
  size?: "small" | "medium" | "large";
  customWidth?: number | null;
  customHeight?: number | null;
  theme?: "dark" | "light" | "gradient";
  showAnimation?: boolean;
  showMetric?: "stars" | "forks" | "watchers";
  className?: string;
}

const GitHubStarBadge = ({
  owner,
  repo,
  size = "medium",
  customWidth = null,
  customHeight = null,
  theme = "dark",
  showAnimation = true,
  showMetric = "stars",
  className = "",
}: GitHubStarBadgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [repoData, setRepoData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Size configurations
  const sizes = {
    small: { width: 180, height: 40, fontSize: "12px", iconSize: 16 },
    medium: { width: 250, height: 54, fontSize: "14px", iconSize: 20 },
    large: { width: 320, height: 68, fontSize: "16px", iconSize: 24 },
    custom: {
      width: customWidth || 250,
      height: customHeight || 54,
      fontSize: "14px",
      iconSize: 20,
    },
  };

  const sizeConfig = sizes[size];

  // Theme configurations
  const themes = {
    dark: {
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
      text: "#f0f6fc",
      accent: "#10b981", // emerald-500
      border: "rgba(240, 246, 252, 0.1)",
      shadow: "rgba(0, 0, 0, 0.3)",
    },
    light: {
      background: "linear-gradient(135deg, #ffffff 0%, #f6f8fa 100%)",
      text: "#24292f",
      accent: "#0d9488", // teal-600
      border: "rgba(27, 31, 36, 0.15)",
      shadow: "rgba(0, 0, 0, 0.1)",
    },
    gradient: {
      background: "linear-gradient(135deg, #24292f 0%, #0d9488 100%)",
      text: "#ffffff",
      accent: "#34d399", // emerald-400
      border: "rgba(255, 255, 255, 0.2)",
      shadow: "rgba(0, 0, 0, 0.2)",
    },
  };

  const themeConfig = themes[theme];

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);
  };

  // Format numbers (e.g., 1000 -> 1k)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  // Fetch GitHub repository data
  const fetchRepoData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
      );

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const data = await response.json();
      setRepoData(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching GitHub data:", err);
      setError(err.message ?? "Failed to load repository data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepoData();
  }, [owner, repo]);

  // Get the appropriate icon and count based on showMetric
  const getMetricData = () => {
    if (!repoData) return { icon: Star, count: 0, label: "Stars" };

    switch (showMetric) {
      case "forks":
        return { icon: GitFork, count: repoData.forks_count, label: "Forks" };
      case "watchers":
        return { icon: Eye, count: repoData.watchers_count, label: "Watchers" };
      default:
        return { icon: Star, count: repoData.stargazers_count, label: "Stars" };
    }
  };

  const { icon: MetricIcon, count, label } = getMetricData();

  return (
    <a
      href={`https://github.com/${owner}/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block ${className}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          background: themeConfig.background,
          border: `1px solid ${themeConfig.border}`,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 4px 12px ${themeConfig.shadow}`,
          transition: showAnimation
            ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          transform: isHovered
            ? "translateY(-2px) scale(1.02)"
            : isClicked
              ? "scale(0.98)"
              : "scale(1)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Background glow effect */}
        {showAnimation && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at center, ${themeConfig.accent}20 0%, transparent 70%)`,
              opacity: isHovered ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        )}

        {/* Content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              color: themeConfig.accent,
              display: "flex",
              alignItems: "center",
              transform: showAnimation && isHovered ? "scale(1.1)" : "scale(1)",
              transition: showAnimation ? "transform 0.3s ease" : "none",
            }}
          >
            <MetricIcon size={sizeConfig.iconSize} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                color: themeConfig.text,
                fontSize: `${parseInt(sizeConfig.fontSize) - 2}px`,
                opacity: 0.7,
                fontFamily: "system-ui, -apple-system, sans-serif",
                lineHeight: "1.2",
                maxWidth: sizeConfig.width - 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {owner}/{repo}
            </div>
            <div
              style={{
                color: themeConfig.text,
                fontSize: sizeConfig.fontSize,
                fontWeight: "600",
                fontFamily: "system-ui, -apple-system, sans-serif",
                lineHeight: "1.2",
                marginBottom: "2px",
              }}
            >
              {label}
            </div>
          </div>
        </div>

        {/* Count display */}
        <div
          style={{
            color: themeConfig.accent,
            fontSize: sizeConfig.fontSize,
            fontWeight: "600",
            transform:
              showAnimation && isHovered ? "translateX(4px)" : "translateX(0)",
            transition: showAnimation ? "transform 0.3s ease" : "none",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <div
              style={{
                fontSize: `${parseInt(sizeConfig.fontSize) + 2}px`,
                fontWeight: "700",
              }}
            >
              {loading ? "..." : error ? "?" : formatNumber(count)}
            </div>
            {error && (
              <div
                style={{
                  fontSize: "10px",
                  color: themeConfig.text,
                  opacity: 0.5,
                }}
              >
                Error
              </div>
            )}
          </div>
        </div>

        {/* Shine effect */}
        {showAnimation && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: -100,
              width: "100px",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              transform: isHovered ? "translateX(350px)" : "translateX(-100px)",
              transition: "transform 0.6s ease",
              zIndex: 0,
            }}
          />
        )}
      </div>
    </a>
  );
};

export default GitHubStarBadge;
