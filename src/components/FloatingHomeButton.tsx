import Link from "next/link";
import type { CSSProperties } from "react";

const homeButtonStyle: CSSProperties = {
  display: "inline-flex",
  minHeight: "44px",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  border: "2px solid #047857",
  borderRadius: "0.75rem",
  background: "#059669",
  padding: "0.65rem 0.9rem",
  color: "#ffffff",
  fontWeight: 900,
  lineHeight: 1,
  textDecoration: "none",
  whiteSpace: "nowrap",
  boxShadow: "0 5px 18px rgba(15, 23, 42, 0.16)",
};

function HomeButtonLink({ style }: { style?: CSSProperties }) {
  return (
    <Link
      href="/"
      aria-label="回到首頁"
      style={{ ...homeButtonStyle, ...style }}
    >
      <span aria-hidden="true">←</span>
      <span>回到首頁</span>
    </Link>
  );
}

export function HeaderHomeButton() {
  return (
    <div
      data-header-home-button-row
      className="flex px-3 pb-2 min-[1200px]:hidden"
    >
      <HomeButtonLink />
    </div>
  );
}

export default function FloatingHomeButton() {
  return (
    <div
      data-desktop-home-button-row
      className="pointer-events-none hidden h-6 min-[1200px]:block"
    >
      <HomeButtonLink
        style={{
          position: "fixed",
          top: "5.25rem",
          left: "0.75rem",
          zIndex: 45,
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}
