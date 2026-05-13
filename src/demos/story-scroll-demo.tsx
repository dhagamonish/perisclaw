import FlowArt, { FlowSection } from '../components/ui/story-scroll.js';

export default function FlowArtDefaultDemo() {
  return (
    <FlowArt aria-label="Présentation Flow Art">
      <FlowSection aria-label="Qui nous sommes" style={{ backgroundColor: '#0050cb', color: '#fff' }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em]">01 — Who we are</p>
        <hr className="my-[2vw] border-none border-t border-white/20" />
        <div>
          <h1
            className="text-[clamp(3.5rem,12vw,14rem)] font-bold leading-[0.85] uppercase tracking-tight"
          >
            Create
            <br />
            Without
            <br />
            Limits
          </h1>
        </div>
        <hr className="my-[2vw] border-none border-t border-white/20" />
        <p className="mt-auto max-w-[50ch] text-[clamp(1rem,2.5vw,2rem)] font-normal leading-relaxed">
          We believe every founder deserves a platform that puts focus first. No algorithms, no
          noise — just pure execution and the tools to make it happen.
        </p>
      </FlowSection>

      <FlowSection aria-label="La mission" style={{ backgroundColor: '#1b1c1c', color: '#fff' }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em]">02 — The mission</p>
        <hr className="my-[2vw] border-none border-t border-white/20" />
        <div>
          <h2
            className="text-[clamp(3.5rem,12vw,14rem)] font-bold leading-[0.85] uppercase tracking-tight"
          >
            Art
            <br />
            First
            <br />
            Always
          </h2>
        </div>
        <hr className="my-[2vw] border-none border-t border-white/20" />
        <p className="max-w-[50ch] text-[clamp(1rem,2.5vw,2rem)] font-normal leading-relaxed">
          A global network built for builders, by builders. We&apos;re rewriting the rules of how
          work gets done in the AI era.
        </p>
        <hr className="my-[2vw] border-none border-t border-white/20" />
        <div className="flex flex-wrap gap-[3vw]">
          <div className="min-w-[180px] flex-1">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider">Discovery</p>
            <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
              Intelligent agents that curate your priorities. No noise deciding your focus.
            </p>
          </div>
          <div className="min-w-[180px] flex-1">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider">Community</p>
            <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
              Find collaborators and fellow founders who push your limits.
            </p>
          </div>
          <div className="min-w-[180px] flex-1">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider">Value</p>
            <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
              Transparent workflows. Secure data. You own your intelligence.
            </p>
          </div>
        </div>
      </FlowSection>

      <FlowSection aria-label="Nous rejoindre" style={{ backgroundColor: '#fbf9f8', color: '#1b1c1c' }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em]">03 — Join us</p>
        <hr className="my-[2vw] border-none border-t border-black/10" />
        <div>
          <h2
            className="text-[clamp(3.5rem,12vw,14rem)] font-bold leading-[0.85] uppercase tracking-tight"
          >
            Ready
            <br />
            To
            <br />
            Begin?
          </h2>
        </div>
        <hr className="my-[2vw] border-none border-t border-black/10" />
        <p className="mt-auto max-w-[50ch] text-[clamp(1rem,2.5vw,2rem)] font-normal leading-relaxed">
          Take control of your execution. Join Astra and let&apos;s shape the future of industrial intelligence together.
        </p>
      </FlowSection>
    </FlowArt>
  );
}
