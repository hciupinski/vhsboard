type BrandProps = {
  className?: string;
  size?: "default" | "large";
};

export function Brand({ className = "", size = "default" }: BrandProps) {
  const isLarge = size === "large";

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-80.png"
        alt="Logo VHSBOARD"
        width={isLarge ? 60 : 48}
        height={isLarge ? 60 : 48}
        className={isLarge ? "size-16 object-contain" : "size-12 object-contain"}
      />
      <span
        className={
          isLarge ? "font-display text-4xl tracking-wide" : "font-display text-3xl tracking-wide"
        }
      >
        VHSBOARD<span className="text-primary">.</span>
      </span>
    </span>
  );
}
