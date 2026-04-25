const AmbientBackground = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Top-left emerald blob */}
      <div
        className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(155 50% 70% / 0.35), transparent 70%)" }}
      />
      {/* Bottom-right warm peach blob */}
      <div
        className="absolute -bottom-60 -right-40 h-[700px] w-[700px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(22 80% 75% / 0.25), transparent 70%)" }}
      />
      {/* Mid sage accent */}
      <div
        className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(150 35% 75% / 0.18), transparent 70%)" }}
      />
      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.04]" />
    </div>
  );
};

export default AmbientBackground;