const words = ['AI-POWERED', 'ENTERPRISE', 'SECURE', 'SCALABLE', 'MULTI-TENANT', 'INTELLIGENT', 'AUTOMATED', 'COMPLIANT'];

const MarqueeSection = () => {
  const content = words.map((w) => `${w} • `).join('');
  return (
    <div className="py-5 border-y border-border/30 overflow-hidden bg-secondary/30">
      <div className="marquee-track">
        <span className="text-sm md:text-base font-display font-semibold tracking-[0.3em] text-muted-foreground uppercase whitespace-nowrap">
          {content}{content}
        </span>
      </div>
    </div>
  );
};

export default MarqueeSection;
