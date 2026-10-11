type BrandProps = {
  className?: string;
  size?: "default" | "large";
};

export function Brand({ className = "" }: BrandProps) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-80.png"
        alt="Logo VHSBOARD"
        width={48}
        height={48}
        className="size-12 object-contain"
      />
      <span className="font-display text-3xl tracking-wide">
        VHSBOARD<span className="text-primary">.</span>
      </span>
    </span>
  );
}
