import {
  ChevronRight,
  Code,
  Zap,
  Cloud,
  GitBranch,
  Play,
  Terminal,
  Layers,
} from "lucide-react";
import HeroSection from "@/components/landing/Hero";
import Waves from "@/components/ui/waves";
import Previews from "@/components/landing/Previews";
import FeaturedPills from "@/components/landing/FeaturedPills";
import LogoCloud from "@/components/landing/LogoCloud";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";

const LandingPage = () => {
  return (
    <div className="z-10 relative overflow-hidden pb-20">
      <Waves
        lineColor="#10b981" // Emerald green to match theme
        backgroundColor="rgba(16, 185, 129, 0.03)" // Very subtle emerald background
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
      <div className="max-w-6xl mx-auto text-center z-50">
        <HeroSection />
        <FeaturedPills />

        {/* <LogoCloud /> */}
        <Pricing />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;

// // Demo component to show usage
// const Demo = () => {
//   return (
//     <div
//       style={{
//         padding: "20px",
//         backgroundColor: "#0d1117",
//         minHeight: "100vh",
//       }}
//     >
//       <h2
//         style={{
//           color: "#f0f6fc",
//           marginBottom: "20px",
//           fontFamily: "system-ui",
//         }}
//       >
//         GitHub Star Badge Examples
//       </h2>

//       <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//         {/* Different sizes */}
//         <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
//           <GitHubStarBadge owner="microsoft" repo="vscode" size="small" />
//           <GitHubStarBadge owner="microsoft" repo="vscode" size="medium" />
//           <GitHubStarBadge owner="microsoft" repo="vscode" size="large" />
//         </div>

//         {/* Different themes */}
//         <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
//           <GitHubStarBadge owner="facebook" repo="react" theme="dark" />
//           <GitHubStarBadge owner="facebook" repo="react" theme="light" />
//           <GitHubStarBadge owner="facebook" repo="react" theme="gradient" />
//         </div>

//         {/* Different metrics */}
//         <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
//           <GitHubStarBadge owner="vercel" repo="next.js" showMetric="stars" />
//           <GitHubStarBadge owner="vercel" repo="next.js" showMetric="forks" />
//           <GitHubStarBadge
//             owner="vercel"
//             repo="next.js"
//             showMetric="watchers"
//           />
//         </div>

//         {/* Custom size */}
//         <div>
//           <GitHubStarBadge
//             owner="nodejs"
//             repo="node"
//             size="custom"
//             customWidth={300}
//             customHeight={60}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };
