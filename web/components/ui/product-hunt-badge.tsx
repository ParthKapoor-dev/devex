"use client";
import { Triangle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FaProductHunt } from "react-icons/fa";
import { NumberTicker } from "../magicui/number-ticker";

interface PageProps {
  size?: "medium" | "large" | "small";
  customWidth?: number | null;
  customHeight?: number | null;
  theme?: "dark" | "light" | "gradient";
  showAnimation?: boolean;
  className?: string;
}

const ProductHuntBadge = ({
  size = "medium", // "small", "medium", "large", "custom"
  customWidth = null,
  customHeight = null,
  theme = "dark", // "dark", "light", "gradient"
  showAnimation = true,
  className = "",
}: PageProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const [votes, setVotes] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
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
      background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
      text: "#ffffff",
      accent: "#ff6154",
      border: "rgba(255, 255, 255, 0.1)",
      shadow: "rgba(0, 0, 0, 0.3)",
    },
    light: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
      text: "#333333",
      accent: "#ff6154",
      border: "rgba(0, 0, 0, 0.1)",
      shadow: "rgba(0, 0, 0, 0.1)",
    },
    gradient: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      text: "#ffffff",
      accent: "#ffd700",
      border: "rgba(255, 255, 255, 0.2)",
      shadow: "rgba(0, 0, 0, 0.2)",
    },
  };

  const themeConfig = themes[theme];

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);
  };

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/producthunt`, {
        method: "GET",
        // Let browser cache if you want; we usually bypass to always see latest from server cache:
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setVotes(data.votes);
      setLastFetch(data.cachedAt);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    load();
  }, []);

  const ProductHuntIcon = ({ size }: { size: number }) => (
    <FaProductHunt size={size} />
  );

  return (
    <a
      href={"https://producthunt.com/products/devex"}
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
              // transform:
              //   showAnimation && isHovered ? "rotate(180deg)" : "rotate(0deg)",
              // transition: showAnimation ? "transform 0.3s ease" : "none",
            }}
          >
            <ProductHuntIcon size={sizeConfig.iconSize} />
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
              Featured on
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
              Product Hunt
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
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
            <Triangle size={12} />
            <span
              title={
                lastFetch ? `Server cache timestamp: ${lastFetch}` : undefined
              }
            >
              {votes ? <NumberTicker value={votes} /> : "–"}
            </span>
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

export default ProductHuntBadge;
