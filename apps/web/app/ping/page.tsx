"use client";

import React, { useState, useEffect, JSX } from "react";
import {
  Server,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { CoreService } from "@/lib/core";
import Waves from "@/components/ui/waves";

// The backend returns "ok", "degraded" for the api, and "ok" or an error string for others.
interface PingResponse {
  api: "ok" | "degraded" | "unreachable";
  k8s: string;
  s3: string;
  redis: string;
}

// A simplified type for clarity. "ok" means healthy, anything else is an error string or a special state.
type ServiceStatus = string;

interface ServiceItem {
  name: string;
  icon: React.ElementType;
  status: ServiceStatus;
  description: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<PingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const coreService = new CoreService();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await coreService.ping();
      setStatus(response);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch status:", error);
      // Set a clear error state when the API is unreachable
      setStatus({
        api: "unreachable",
        k8s: "Error fetching status",
        redis: "Error fetching status",
        s3: "Error fetching status",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Helper to check if a service is operational.
  const isServiceOk = (serviceStatus: ServiceStatus): boolean => {
    return serviceStatus === "ok";
  };

  const getStatusColor = (serviceStatus: ServiceStatus): string => {
    if (isServiceOk(serviceStatus)) {
      return "text-emerald-400";
    }
    if (serviceStatus === "degraded") {
      return "text-yellow-400";
    }
    // Any other string is an error or "unreachable"
    return "text-red-400";
  };

  const getStatusIcon = (
    serviceStatus: ServiceStatus,
    size: string = "h-5 w-5",
  ): JSX.Element => {
    if (isServiceOk(serviceStatus)) {
      return <CheckCircle className={`${size} text-emerald-400`} />;
    }
    if (serviceStatus === "degraded") {
      return <AlertTriangle className={`${size} text-yellow-400`} />;
    }
    // Any other string is an error, show the error icon
    return <XCircle className={`${size} text-red-400`} />;
  };

  // The overall status is now directly derived from the `api` status.
  const getOverallStatus = (): ServiceStatus | "loading" => {
    if (loading) return "loading";
    if (!status) return "unreachable"; // Fallback for initial load or error
    return status.api;
  };

  const getOverallStatusMessage = (): string => {
    switch (getOverallStatus()) {
      case "ok":
        return "All Systems Operational";
      case "degraded":
        return "Some Systems Experiencing Issues";
      case "unreachable":
        return "System Status Unreachable";
      case "loading":
      default:
        return "Checking System Status...";
    }
  };

  const services: ServiceItem[] = status
    ? [
        {
          name: "K8s Cluster",
          icon: Server,
          status: status.k8s,
          description: "Kubernetes Cluster",
        },
        {
          name: "Redis Cache",
          icon: Database,
          status: status.redis,
          description: "In-memory data store",
        },
        {
          name: "S3 Storage",
          icon: Cloud,
          status: status.s3,
          description: "Object storage service",
        },
      ]
    : [];

  return (
    <div className="font-display min-h-screen relative max-md:p-4 pt-16 font-inter">
      <Waves
        lineColor="#10b981"
        backgroundColor="rgba(16, 185, 129, 0.03)"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
        body {
          font-family: "Inter", sans-serif;
        }
        .glass {
          backdrop-filter: blur(8px) saturate(180%);
          background: radial-gradient(
            circle,
            rgba(20, 20, 20, 0.85) 0%,
            rgba(0, 40, 40, 0.3) 60%,
            rgba(0, 0, 0, 0.95) 100%
          );
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .slide-in {
          animation: slide-in 0.5s ease-out;
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="mx-auto max-w-4xl p-4 md:p-0">
        {/* Overall Status Card */}
        <div className="glass slide-in mb-8 p-6 rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-4">
              {loading ? (
                <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
              ) : (
                getStatusIcon(getOverallStatus(), "h-8 w-8")
              )}
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {getOverallStatusMessage()}
                </h2>
                <p className="text-sm text-gray-400">
                  {lastUpdated
                    ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                    : "Checking..."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 md:mt-0">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                  autoRefresh
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700/70"
                }`}
              >
                {autoRefresh ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                Auto-refresh
              </button>
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-teal-600/20 px-4 py-2 text-sm text-teal-400 transition-all hover:bg-teal-600/30 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={service.name}
              className="glass slide-in p-6 rounded-xl flex flex-col justify-between"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-800/50 p-2">
                      <service.icon className="h-5 w-5 text-teal-400" />
                    </div>
                    <h3 className="font-semibold text-white">{service.name}</h3>
                  </div>
                  {loading ? (
                    <div className="h-5 w-5 animate-pulse rounded-full bg-gray-600"></div>
                  ) : (
                    getStatusIcon(service.status)
                  )}
                </div>
                <p className="mb-3 text-sm text-gray-400">
                  {service.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className={`${getStatusColor(service.status)}`}>
                    {isServiceOk(service.status) ? "Operational" : "Error"}
                  </span>
                </div>
                {/* Display the actual error message from the backend if not "ok" */}
                {!isServiceOk(service.status) && (
                  <p
                    className="text-xs text-red-400/70 mt-1 truncate"
                    title={service.status}
                  >
                    {service.status}
                  </p>
                )}
                {/* Status bar */}
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-700">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isServiceOk(service.status)
                        ? "w-full bg-emerald-400"
                        : "w-full bg-red-400"
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Status page automatically refreshes every 30 seconds</p>
          <p className="mt-1">
            Powered by devX &bull; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
