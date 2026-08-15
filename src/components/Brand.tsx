export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-80.png"
        alt="Logo VHSBOARD"
        width={40}
        height={40}
        className="size-9 object-contain"
      />
      <span className="font-display text-2xl tracking-wide">
        VHSBOARD<span className="text-primary">.</span>
      </span>
    </span>
  );
}
