import { Star, GitFork, Eye } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FaGithubAlt } from "react-icons/fa";
import { NumberTicker } from "../magicui/number-ticker";
import { token } from "@/lib/tokens";

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

  // Theme configurations.
  //
  // The accent was emerald, left over from the previous brand — and this badge
  // is the first coloured thing on the page. A star is conventionally gold
  // anyway, so amber is both on-palette and the more expected colour. These
  // are inline styles, which cannot resolve `var()` or `oklch()`, so they come
  // from the hex mirrors in lib/tokens.
  const themes = {
    dark: {
      background: token.surface,
      text: token.ink,
      accent: token.brand400,
      border: "rgba(255, 255, 255, 0.09)",
      shadow: "rgba(0, 0, 0, 0.5)",
    },
    light: {
      background: "#ffffff",
      text: "#24292f",
      accent: token.brand600,
      border: "rgba(27, 31, 36, 0.15)",
      shadow: "rgba(0, 0, 0, 0.1)",
    },
    gradient: {
      background: `linear-gradient(135deg, ${token.raised} 0%, ${token.surface} 100%)`,
      text: token.ink,
      accent: token.brand400,
      border: "rgba(255, 255, 255, 0.18)",
      shadow: "rgba(0, 0, 0, 0.5)",
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

  // Fetch GitHub repository data.
  //
  // Declared inside the effect rather than in the component body: it closes
  // over `owner` and `repo` and nothing else, so this is the shape eslint's
  // exhaustive-deps rule was asking for (it was warning on every build).
  // `ignore` stops a late response for a previous repo overwriting a newer one.
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`,
        );

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}`);
        }

        const data = await response.json();
        if (ignore) return;
        setRepoData(data);
        setError(null);
      } catch (err: any) {
        if (ignore) return;
        setError(err.message ?? "Failed to load repository data");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
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
        return {
          icon: Star,
          count: repoData.stargazers_count,
          label: "star",
        };
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
            <FaGithubAlt size={sizeConfig.iconSize} />
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
              {owner}
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
              {repo}
            </div>
          </div>
        </div>

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
          <div className="flex flex-col items-center">
            <Star size={12} />
            <div>{loading ? "..." : <NumberTicker value={count} />}</div>
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
