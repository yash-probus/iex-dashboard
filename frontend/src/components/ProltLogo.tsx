// @ts-nocheck

import { cn } from "@/lib/utils";
import proltLogoSvg from "@/assets/Prolt_Logo.svg";
import proltIconSvg from "@/assets/Prolt_Icon.svg";
import proltLogoWithNameSquareSvg from "@/assets/Prolt_Logo_2.svg";

interface ProltLogoProps {
  variant?: "full" | "icon" | "mini";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

/**
 * Size map — heights chosen to be responsive-friendly.
 * The SVG logo contains the full wordmark so we only need height.
 */
const sizeMap = {
  sm: "h-6", // ~24px
  md: "h-8", // ~32px
  lg: "h-10", // ~40px
  xl: "h-14", // ~56px
};

export function ProltLogo({
  variant = "full",
  size = "md",
  className,
  onClick,
}: ProltLogoProps) {
  const heightClass = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={cn("flex items-center cursor-pointer group", className)}
    >
      <img
        src={
          variant === "icon"
            ? proltIconSvg
            : variant === "mini"
              ? proltLogoWithNameSquareSvg
              : proltLogoSvg
        }
        alt="Prolt"
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:scale-105",
          heightClass,
          // When variant is "icon" only, crop to roughly square
          variant === "icon" && "aspect-square object-left",
        )}
      />
    </div>
  );
}

// Icon-only alias — keeps backward compat
export function ProltIcon({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={proltIconSvg}
      alt="Prolt"
      style={{ height: size, width: "auto" }}
      className={cn(
        "object-contain transition-transform duration-300 hover:scale-110",
        className,
      )}
    />
  );
}
