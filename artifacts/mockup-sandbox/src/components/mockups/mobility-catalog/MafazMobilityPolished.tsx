import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Globe2,
  HeartPulse,
  Menu,
  MessageCircle,
  MoveRight,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

type Category = "All" | "Prosthetics" | "Orthotics";

type Solution = {
  id: string;
  category: Exclude<Category, "All">;
  index: string;
  title: string;
  arabic: string;
  note: string;
  detail: string;
  tone: "cobalt" | "teal" | "orange";
};

const solutions: Solution[] = [
  {
    id: "stride",
    category: "Prosthetics",
    index: "01",
    title: "Strideline",
    arabic: "خطوة",
    note: "Dynamic below-knee system",
    detail: "A responsive everyday prosthesis tuned for changing ground, pace, and confidence.",
    tone: "cobalt",
  },
  {
    id: "arc",
    category: "Orthotics",
    index: "02",
    title: "Arc / AFO",
    arabic: "قوس",
    note: "Lightweight ankle support",
    detail: "Quiet support that follows the ankle through the moments that matter.",
    tone: "teal",
  },
  {
    id: "lift",
    category: "Prosthetics",
    index: "03",
    title: "LiftForm",
    arabic: "ارتقاء",
    note: "Energy-returning knee unit",
    detail: "Designed for a steadier transition from standing still to moving forward.",
    tone: "orange",
  },
];

const toneStyles: Record<Solution["tone"], { background: string; ink: string; accent: string }> = {
  cobalt: { background: "#1c3f74", ink: "#f4efe5", accent: "#a6e5d8" },
  teal: { background: "#1e716d", ink: "#f6f0e5", accent: "#f2b37c" },
  orange: { background: "#da7049", ink: "#302b2b", accent: "#f7ddba" },
};

function Mark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid size-10 place-items-center overflow-hidden rounded-[13px] text-[#f6f0e5]"
        style={{ background: "#1c3f74" }}
      >
        <span className="absolute -right-2 -top-3 size-8 rounded-full border-2 border-[#a6e5d8]" />
        <span className="absolute bottom-1 left-1.5 h-4 w-2.5 -rotate-12 rounded-full bg-[#da7049]" />
        <span className="relative font-serif text-lg">M</span>
      </div>
      <div>
        <p className="font-serif text-[22px] leading-none tracking-[-.04em] text-[#1c3f74]">
          Mafaz <i className="not-italic text-[#1e716d]">Mobility</i>
        </p>
        <p className="mt-1 text-[9px] tracking-[.08em] text-[#6c7477]" dir="rtl">
          مفاز للأطراف والأجهزة المساندة
        </p>
      </div>
    </div>
  );
}

function ProductArt({ solution, compact = false }: { solution: Solution; compact?: boolean }) {
  const tone = toneStyles[solution.tone];
  return (
    <div
      className={`relative isolate overflow-hidden rounded-[24px] ${compact ? "h-[126px]" : "h-[255px]"}`}
      style={{ background: tone.background }}
      aria-label={`${solution.title} product illustration`}
    >
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle, rgba(246,240,229,.55) 1px, transparent 1px)", backgroundSize: "15px 15px" }} />
      <div className="absolute -right-10 -top-12 size-40 rounded-full border border-[#f6f0e5]/30" />
      <div className="absolute right-2 top-3 size-24 rounded-full border border-[#f6f0e5]/25" />
      <div
        className={`absolute ${compact ? "bottom-5 left-[27%] h-[69%] w-[24%] border-[7px]" : "bottom-7 left-[29%] h-[72%] w-[23%] border-[12px]"} -rotate-[14deg] rounded-[60%_40%_34%_48%] border-[#f6f0e5] bg-[#1b2b48]/35 shadow-[16px_20px_0_rgba(20,34,61,.18)]`}
      />
      <div className={`absolute ${compact ? "bottom-4 right-[18%] h-3 w-[35%]" : "bottom-6 right-[17%] h-5 w-[39%]"} -rotate-[7deg] rounded-full bg-[#f6f0e5]`} />
      <div className={`absolute ${compact ? "bottom-[22%] left-[47%] size-2" : "bottom-[20%] left-[46%] size-3"} rounded-full`} style={{ background: tone.accent, boxShadow: `0 0 0 5px ${tone.accent}35` }} />
      <div className="absolute bottom-4 left-5 font-mono text-[9px] uppercase tracking-[.18em]" style={{ color: `${tone.ink}b8` }}>
        MAFAZ / CLINICAL STUDY
      </div>
      {!compact && (
        <div className="absolute right-5 top-5 rounded-full border border-[#f6f0e5]/30 px-3 py-1 text-[9px] font-bold uppercase tracking-[.14em]" style={{ color: tone.ink }}>
          {solution.category}
        </div>
      )}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.19em] text-[#1e716d]">
      <span className="h-px w-7 bg-[#da7049]" />
      {children}
    </div>
  );
}

export function MafazMobilityPolished() {
  const [category, setCategory] = useState<Category>("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [arabic, setArabic] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Solution | null>(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = category === "All" ? solutions : solutions.filter((solution) => solution.category === category);
  const visibleSolutions = showAll ? filtered : filtered.slice(0, 2);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div
      className="min-h-[100dvh] overflow-x-hidden bg-[#f5f0e7] text-[#302b2b]"
      style={{ fontFamily: '"DM Sans", "Noto Sans Arabic", sans-serif' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
        .mafaz-serif { font-family: "Instrument Serif", Georgia, serif; }
        .mafaz-mono { font-family: "DM Sans", sans-serif; }
        .mafaz-noise:after { content: ""; position: fixed; inset: 0; z-index: 40; pointer-events: none; opacity: .035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.4'/%3E%3C/svg%3E"); }
        @keyframes mafaz-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mafaz-float { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-8px) rotate(2deg); } }
        .mafaz-rise { animation: mafaz-rise .7s cubic-bezier(.2,.8,.2,1) both; }
        .mafaz-rise-2 { animation: mafaz-rise .7s .1s cubic-bezier(.2,.8,.2,1) both; }
        .mafaz-rise-3 { animation: mafaz-rise .7s .2s cubic-bezier(.2,.8,.2,1) both; }
        .mafaz-float { animation: mafaz-float 7s ease-in-out infinite; }
      `}</style>

      <div className="mafaz-noise">
        <div className="border-b border-[#d5cec1] bg-[#e9e3d8]">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#687274] lg:px-10">
            <span>Amman · Alrazi Street</span>
            <span className="hidden items-center gap-2 sm:flex"><span className="size-1.5 rounded-full bg-[#1e716d]" /> Clinical line open · Sun–Thu 08:00—18:00</span>
            <button type="button" onClick={() => setArabic((value) => !value)} className="flex items-center gap-1.5 transition-colors hover:text-[#1c3f74]" aria-label="Switch language">
              <Globe2 size={12} /> {arabic ? "EN" : "عربي"}
            </button>
          </div>
        </div>

        <header className="sticky top-0 z-30 border-b border-[#d5cec1]/80 bg-[#f5f0e7]/90 backdrop-blur-lg">
          <div className="mx-auto flex min-h-[78px] max-w-[1380px] items-center justify-between px-5 lg:px-10">
            <button type="button" onClick={() => scrollTo("top")} className="text-left" aria-label="Back to top"><Mark /></button>
            <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
              {[
                ["top", "Solutions"],
                ["catalog", "Clinical catalogue"],
                ["approach", "Our approach"],
              ].map(([id, label], index) => (
                <button key={id} type="button" onClick={() => scrollTo(id)} className="group flex items-center gap-2 text-[12px] font-semibold text-[#687274] transition-colors hover:text-[#1c3f74]">
                  <span className="font-mono text-[9px] text-[#da7049]">0{index + 1}</span>{label}
                  <span className="h-px w-0 bg-[#da7049] transition-all group-hover:w-4" />
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setModalOpen(true)} className="hidden items-center gap-2 rounded-full bg-[#1c3f74] px-4 py-2.5 text-[11px] font-bold text-[#f5f0e7] transition-transform hover:-translate-y-0.5 sm:flex">
                Talk to the team <ArrowUpRight size={14} />
              </button>
              <button type="button" onClick={() => setMenuOpen((value) => !value)} className="grid size-10 place-items-center rounded-full border border-[#cfc8bb] text-[#1c3f74] lg:hidden" aria-label="Toggle navigation">
                {menuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="border-t border-[#d5cec1] bg-[#f5f0e7] px-5 py-3 lg:hidden" aria-label="Mobile navigation">
              {["top", "catalog", "approach"].map((id, index) => (
                <button key={id} type="button" onClick={() => scrollTo(id)} className="flex w-full items-center justify-between border-b border-[#d5cec1] py-4 text-left text-sm font-bold">
                  <span><span className="mr-3 font-mono text-[10px] text-[#da7049]">0{index + 1}</span>{id === "top" ? "Solutions" : id === "catalog" ? "Clinical catalogue" : "Our approach"}</span>
                  <ChevronRight size={15} className="text-[#1e716d]" />
                </button>
              ))}
            </nav>
          )}
        </header>

        <main id="top">
          <section className="mx-auto grid max-w-[1380px] items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[.94fr_1.06fr] lg:px-10 lg:pb-28 lg:pt-24">
            <div className="mafaz-rise">
              <Eyebrow>Mobility, more considered <span className="ml-1 font-normal normal-case tracking-normal text-[#687274]">/ الحركة، بعناية أكبر</span></Eyebrow>
              <h1 className="mafaz-serif max-w-[690px] text-[clamp(4.2rem,8vw,7.9rem)] leading-[.82] tracking-[-.055em] text-[#1c3f74]">
                Move toward <i className="text-[#1e716d]">more.</i>
              </h1>
              <p className="mt-8 max-w-[475px] text-[17px] leading-8 text-[#687274]">
                Mobility solutions shaped around the way you live, not only the diagnosis on your chart.
              </p>
              <p className="mt-2 max-w-[450px] text-[13px] leading-6 text-[#8a918f]" dir="rtl">
                حلول للحركة مصمّمة حول طريقة عيشك، لا حول التشخيص وحده.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => scrollTo("catalog")} className="group flex items-center gap-3 rounded-full bg-[#1c3f74] px-6 py-3.5 text-sm font-bold text-[#f5f0e7] transition-transform hover:-translate-y-0.5">
                  Find your fit <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-full border border-[#cfc8bb] px-5 py-3.5 text-sm font-bold text-[#1c3f74] transition-colors hover:border-[#1e716d]">
                  Start a conversation <Plus size={15} />
                </button>
              </div>
              <div className="mt-12 flex items-center gap-3 text-[11px] text-[#687274]">
                <span className="grid size-7 place-items-center rounded-full bg-[#d9eee8] text-[#1e716d]"><ShieldCheck size={15} /></span>
                <span>Designed with clinical teams</span>
                <span className="text-[#b6b0a6]">·</span>
                <span dir="rtl">صُمّمت مع الفرق السريرية</span>
              </div>
            </div>

            <div className="mafaz-rise-2 relative mx-auto aspect-square w-full max-w-[600px]">
              <div className="absolute inset-[8%] rounded-[47%_53%_45%_55%] bg-[#d9eee8]" />
              <div className="mafaz-float absolute inset-[15%] rounded-[43%_57%_60%_40%] bg-[#1e716d]" />
              <div className="absolute inset-[27%] rounded-[47%_53%_50%_50%] border-[22px] border-[#f5f0e7] bg-[#1c3f74] shadow-[18px_25px_0_rgba(28,63,116,.14)]" />
              <div className="absolute left-[39%] top-[18%] h-[28%] w-[8%] -rotate-12 rounded-full bg-[#da7049]" />
              <div className="absolute bottom-[14%] right-[8%] flex items-center gap-2 rounded-full border border-[#cfc8bb] bg-[#f7f3eb] px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#1c3f74] shadow-[0_12px_25px_rgba(28,63,116,.12)]">
                <span className="size-2 rounded-full bg-[#1e716d]" /> Responsive fit
              </div>
              <div className="absolute left-[1%] top-[34%] max-w-[156px] rounded-[18px] border border-[#cfc8bb] bg-[#f7f3eb]/95 p-4 shadow-[0_15px_35px_rgba(28,63,116,.1)]">
                <span className="block font-mono text-[10px] text-[#da7049]">01 / 03</span>
                <span className="mt-2 block text-[12px] font-semibold leading-5 text-[#1c3f74]">Movement, measured differently.</span>
              </div>
              <div className="absolute bottom-[8%] left-[17%] font-serif text-[92px] leading-none text-[#1c3f74]/[.08]">M</div>
            </div>
          </section>

          <section className="border-y border-[#d5cec1] bg-[#e9e3d8]">
            <div className="mx-auto grid max-w-[1380px] divide-y divide-[#d5cec1] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
              {[
                ["12+", "years of clinical mobility", "عاماً من الحركة السريرية"],
                ["4.8k", "people supported", "شخصاً حصلوا على الدعم"],
                ["96%", "referral follow-through", "نسبة متابعة الإحالات"],
              ].map(([value, label, arabicLabel]) => (
                <div key={value} className="flex items-center gap-4 py-7 sm:justify-center sm:py-9">
                  <span className="mafaz-serif text-4xl text-[#1c3f74]">{value}</span>
                  <span className="max-w-[145px] text-[11px] leading-4 text-[#687274]">{label}<span className="mt-1 block text-[10px]" dir="rtl">{arabicLabel}</span></span>
                </div>
              ))}
            </div>
          </section>

          <section id="catalog" className="mx-auto max-w-[1380px] scroll-mt-24 px-5 py-20 lg:px-10 lg:py-28">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <Eyebrow>Find your fit <span className="ml-1 font-normal normal-case tracking-normal text-[#687274]">/ اعثر على الحل المناسب</span></Eyebrow>
                <h2 className="mafaz-serif max-w-[620px] text-5xl leading-[.9] tracking-[-.04em] text-[#1c3f74] md:text-6xl">A clearer route to <i className="text-[#1e716d]">better movement.</i></h2>
              </div>
              <p className="max-w-[270px] text-sm leading-6 text-[#687274]">Browse by clinical need. Every solution is a starting point for a more informed conversation.</p>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#d5cec1] pb-4">
              <div className="flex gap-1 rounded-full bg-[#e9e3d8] p-1">
                {(["All", "Prosthetics", "Orthotics"] as Category[]).map((item) => (
                  <button key={item} type="button" onClick={() => { setCategory(item); setShowAll(false); }} className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${category === item ? "bg-[#1c3f74] text-[#f5f0e7]" : "text-[#687274] hover:text-[#1c3f74]"}`}>
                    {item}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[.15em] text-[#929793]">{filtered.length} solutions / {category}</span>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {visibleSolutions.map((solution, index) => (
                <article key={solution.id} className={`group rounded-[26px] border border-[#d5cec1] bg-[#f9f5ed] p-2 transition-transform hover:-translate-y-1 ${index === 0 && visibleSolutions.length === 1 ? "md:col-span-2" : ""}`}>
                  <ProductArt solution={solution} />
                  <div className="flex items-end justify-between gap-5 p-4 pb-3">
                    <div>
                      <span className="font-mono text-[10px] text-[#da7049]">{solution.index} / {solution.category.toUpperCase()}</span>
                      <h3 className="mafaz-serif mt-1 text-3xl leading-none text-[#1c3f74]">{solution.title}</h3>
                      <p className="mt-1 text-[11px] text-[#1e716d]" dir="rtl">{solution.arabic}</p>
                      <p className="mt-3 text-[12px] text-[#687274]">{solution.note}</p>
                    </div>
                    <button type="button" onClick={() => setSelected(solution)} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e9e3d8] text-[#1c3f74] transition-colors group-hover:bg-[#1c3f74] group-hover:text-[#f5f0e7]" aria-label={`View ${solution.title}`}>
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && <div className="rounded-[26px] border border-dashed border-[#cfc8bb] p-12 text-center md:col-span-2"><p className="mafaz-serif text-3xl text-[#1c3f74]">The catalogue is resting.</p><p className="mt-2 text-sm text-[#687274]">Try another clinical need.</p></div>}
            </div>
            {filtered.length > 2 && (
              <button type="button" onClick={() => setShowAll((value) => !value)} className="mx-auto mt-8 flex items-center gap-2 rounded-full border border-[#cfc8bb] px-5 py-3 text-[11px] font-bold text-[#1c3f74] transition-colors hover:border-[#1e716d]">
                {showAll ? "Show fewer" : "View all solutions"} <ChevronDown size={14} className={showAll ? "rotate-180" : ""} />
              </button>
            )}
          </section>

          <section id="approach" className="scroll-mt-24 bg-[#1c3f74] text-[#f5f0e7]">
            <div className="mx-auto grid max-w-[1380px] gap-12 px-5 py-20 lg:grid-cols-[.78fr_1.22fr] lg:px-10 lg:py-24">
              <div>
                <Eyebrow><span className="text-[#a6e5d8]">The Mafaz approach / <span dir="rtl">منهجية مفاز</span></span></Eyebrow>
                <h2 className="mafaz-serif text-5xl leading-[.91] md:text-6xl">Small changes.<br /><i className="text-[#a6e5d8]">Real distance.</i></h2>
                <p className="mt-6 max-w-sm text-sm leading-6 text-[#f5f0e7]/65">A device is only successful when it disappears into the person&apos;s day. Our team stays close from first measure to next chapter.</p>
                <button type="button" onClick={() => setModalOpen(true)} className="mt-8 flex items-center gap-3 rounded-full bg-[#da7049] px-5 py-3.5 text-sm font-bold text-[#302b2b] transition-transform hover:-translate-y-0.5">
                  Meet the clinical team <MoveRight size={16} />
                </button>
              </div>
              <div className="grid gap-7 sm:grid-cols-3">
                {[
                  [HeartPulse, "Human first", "A device should feel like part of your rhythm."],
                  [ShieldCheck, "Evidence led", "Each adjustment has a reason and a measure."],
                  [Sparkles, "Always evolving", "The best fit keeps learning with you."],
                ].map(([Icon, title, body]) => {
                  const Glyph = Icon as typeof HeartPulse;
                  return <div key={title as string} className="border-t border-[#f5f0e7]/20 pt-5"><Glyph size={21} className="text-[#a6e5d8]" /><h3 className="mafaz-serif mt-5 text-3xl">{title as string}</h3><p className="mt-3 text-sm leading-6 text-[#f5f0e7]/60">{body as string}</p></div>;
                })}
              </div>
            </div>
          </section>

          <section className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-7 px-5 py-20 sm:flex-row sm:items-center lg:px-10 lg:py-24">
            <div><Eyebrow>One conversation away <span className="ml-1 font-normal normal-case tracking-normal text-[#687274]">/ محادثة واحدة تفصلك</span></Eyebrow><h2 className="mafaz-serif max-w-2xl text-4xl leading-tight text-[#1c3f74] md:text-5xl">Have a person in mind? <i className="text-[#1e716d]">Let&apos;s begin there.</i></h2></div>
            <button type="button" onClick={() => setModalOpen(true)} className="group flex shrink-0 items-center gap-3 rounded-full bg-[#da7049] px-6 py-4 text-sm font-bold text-[#302b2b] transition-transform hover:-translate-y-0.5">Make a referral <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></button>
          </section>
        </main>

        <footer className="border-t border-[#d5cec1] bg-[#e9e3d8]">
          <div className="mx-auto grid max-w-[1380px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
            <div><Mark /><p className="mt-5 max-w-xs text-sm leading-6 text-[#687274]">Clinical mobility, made personal.<br /><span dir="rtl">حلول الحركة، مصمّمة لك.</span></p></div>
            <div><p className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#1e716d]">Explore</p><div className="flex flex-col gap-3 text-sm text-[#687274]"><button type="button" onClick={() => scrollTo("catalog")} className="text-left hover:text-[#1c3f74]">Solutions / الحلول</button><button type="button" onClick={() => scrollTo("approach")} className="text-left hover:text-[#1c3f74]">Our approach / منهجيتنا</button></div></div>
            <div><p className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#1e716d]">Clinical line</p><div className="flex flex-col gap-3 text-sm text-[#687274]"><span>Amman, Jordan · Alrazi Street</span><a href="tel:+962795185080" className="flex items-center gap-2 hover:text-[#1c3f74]"><Phone size={14} />+962 79 518 5080</a><a href="https://wa.me/962795185080" className="flex items-center gap-2 hover:text-[#1c3f74]"><MessageCircle size={14} />WhatsApp / واتساب</a></div></div>
            <div><p className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#1e716d]">MAFAZ / 01</p><p className="text-sm leading-6 text-[#687274]">A considered path forward for every body.</p></div>
          </div>
          <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-2 border-t border-[#d5cec1] px-5 py-5 text-[10px] uppercase tracking-[.08em] text-[#929793] sm:flex-row lg:px-10"><span>© 2026 Mafaz Mobility</span><span>Orthotics · Prosthetics · Clinical support</span></div>
        </footer>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1c3f74]/35 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={`${selected.title} details`}>
          <div className="relative w-full max-w-[720px] overflow-hidden rounded-[28px] border border-[#d5cec1] bg-[#f9f5ed] shadow-[0_30px_80px_rgba(28,63,116,.25)]">
            <button type="button" onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-[#f5f0e7]/80 text-[#1c3f74]" aria-label="Close details"><X size={17} /></button>
            <div className="grid sm:grid-cols-[.82fr_1.18fr]">
              <ProductArt solution={selected} />
              <div className="p-7 sm:p-9"><span className="font-mono text-[10px] text-[#da7049]">{selected.index} / {selected.category.toUpperCase()}</span><h2 className="mafaz-serif mt-2 text-5xl leading-none text-[#1c3f74]">{selected.title}</h2><p className="mt-1 text-sm text-[#1e716d]" dir="rtl">{selected.arabic}</p><p className="mt-6 text-sm leading-7 text-[#687274]">{selected.detail}</p><div className="mt-7 flex items-center gap-3 border-t border-[#d5cec1] pt-5 text-[11px] text-[#687274]"><Check size={15} className="text-[#1e716d]" /> Personal fitting · Clinical follow-up</div><button type="button" onClick={() => { setSelected(null); setModalOpen(true); }} className="mt-7 flex items-center gap-2 rounded-full bg-[#1c3f74] px-5 py-3 text-sm font-bold text-[#f5f0e7]">Discuss this solution <ArrowRight size={15} /></button></div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c3f74]/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Start a conversation">
          <div className="relative w-full max-w-[490px] rounded-[28px] border border-[#d5cec1] bg-[#f9f5ed] p-7 shadow-[0_30px_80px_rgba(28,63,116,.25)] sm:p-9">
            <button type="button" onClick={() => setModalOpen(false)} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-[#e9e3d8] text-[#1c3f74]" aria-label="Close conversation form"><X size={17} /></button>
            <Eyebrow>Private clinical line / <span dir="rtl">خط سريري خاص</span></Eyebrow>
            <h2 className="mafaz-serif text-5xl leading-[.9] text-[#1c3f74]">Let&apos;s make<br /><i className="text-[#1e716d]">a plan.</i></h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#687274]">Leave a number and the best time to reach you. Our clinical team will take it from there.</p>
            <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); setModalOpen(false); }}>
              <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#302b2b]">Your name</span><input required className="w-full rounded-xl border border-[#cfc8bb] bg-[#f5f0e7] px-4 py-3 text-sm outline-none focus:border-[#1e716d]" placeholder="Dr. / Ms. / Mr." /></label>
              <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#302b2b]">Phone number</span><input required type="tel" className="w-full rounded-xl border border-[#cfc8bb] bg-[#f5f0e7] px-4 py-3 text-sm outline-none focus:border-[#1e716d]" placeholder="+962 79 000 0000" /></label>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#da7049] px-5 py-3.5 text-sm font-bold text-[#302b2b]">Send enquiry <ArrowRight size={15} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MafazMobilityPolished;