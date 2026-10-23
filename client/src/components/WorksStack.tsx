import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./works-stack.css";

export type StackWork = { id: string | number; title: string; description: string; tags: string[]; image: string; href?: string; sideLabel?: string; gallery?: string[] };

const placeholderImages = [1, 2, 3, 4, 5].map((n) => `/media/placeholders/work-${n}.svg`);

// Placeholder projects shown until the portfolio items in the dashboard have descriptions.
export function placeholderWorks(isArabic: boolean): StackWork[] {
  const ar: StackWork[] = [
    { id: "p1", image: "/media/placeholders/work-1.svg", title: "هوية «نخلة» للقهوة", tags: ["هوية بصرية", "شعار", "تغليف", "دليل الهوية"], description: "هوية كاملة لمحمصة قهوة سعودية: شعار، ألوان، أكواب وتغليف، ودليل يحافظ على حضور العلامة في كل فرع." },
    { id: "p2", image: "/media/placeholders/work-2.svg", title: "إعلان موشن «رحلة»", tags: ["موشن جرافيك", "إعلان", "سوشال ميديا"], description: "إعلان متحرك مدته ٣٠ ثانية لإطلاق خدمة جديدة، بنسخ مقاسة لإنستقرام وتيك توك وسناب شات." },
    { id: "p3", image: "/media/placeholders/work-3.svg", title: "تطبيق «مِشوار»", tags: ["تجربة المستخدم", "واجهات", "نموذج أولي", "اختبار المستخدمين"], description: "تصميم تطبيق توصيل من الفكرة إلى نموذج قابل للتجربة، بتجربة عربية سهلة تبدأ من أول شاشة." },
    { id: "p4", image: "/media/placeholders/work-4.svg", title: "حملة رمضان بالذكاء الاصطناعي", tags: ["فيديو بالذكاء الاصطناعي", "حملة", "محتوى"], description: "سلسلة فيديوهات قصيرة لموسم رمضان، منتجة بالذكاء الاصطناعي ومعدّلة يدويًا لتطابق هوية العلامة." },
    { id: "p5", image: "/media/placeholders/work-5.svg", title: "متجر «عَبَق» للعطور", tags: ["متجر إلكتروني", "تصميم واجهات", "صور المنتجات"], description: "واجهة متجر عطور تبرز كل منتج بصورة واضحة ووصف قصير، مع تجربة شراء سريعة على الجوال." },
  ];
  // Each placeholder project borrows the other four images as its desktop gallery.
  ar.forEach((item, i) => { item.gallery = placeholderImages.filter((_, j) => j !== i); });
  if (isArabic) return ar;
  const en = [
    { title: "Nakhla Coffee identity", tags: ["Brand identity", "Logo", "Packaging", "Brand guide"], description: "A complete identity for a Saudi coffee roaster: logo, colors, cups and packaging, plus a guide that keeps every branch on brand." },
    { title: "Rehla motion ad", tags: ["Motion graphics", "Ad", "Social media"], description: "A 30-second animated launch ad, cut to size for Instagram, TikTok and Snapchat." },
    { title: "Mishwar app", tags: ["UX", "Interfaces", "Prototype", "User testing"], description: "A delivery app taken from idea to a clickable prototype, with an Arabic-first experience from the first screen." },
    { title: "Ramadan AI campaign", tags: ["AI video", "Campaign", "Content"], description: "A series of short Ramadan videos made with AI and finished by hand to match the brand." },
    { title: "Abaq perfume store", tags: ["E-commerce", "Interface design", "Product imagery"], description: "A perfume storefront that gives every product a clear image and a short story, with fast checkout on mobile." },
  ];
  return ar.map((item, i) => ({ ...item, ...en[i] }));
}

const DEPTH = 4; // cards visible behind the front one
// Corner order for the desktop images, so two images sit on opposite sides: top-left, top-right, bottom-left, bottom-right.
const FLOAT_SLOTS = [1, 3, 2, 4];

// A stacked deck of projects. Scrolling through the section brings the next card forward:
// the front card drops away and returns to the back of the deck, and its tags fade in on arrival.
export default function WorksStack({ items, brandLabel, isArabic }: { items: StackWork[]; brandLabel: string; isArabic: boolean }) {
  const count = items.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const previous = useRef(0);
  const [active, setActive] = useState(0);
  const [pill, setPill] = useState({ x: 0, w: 0 });

  // Scroll position inside the tall track picks the front card.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = track.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const progress = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      setActive(Math.min(count - 1, Math.floor(progress * count)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [count]);

  // Cards that leave the front drop down and fade, then reappear at the back (and the reverse when scrolling up).
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = active;
    if (from === active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const forward = active > from;
    const steps = Math.abs(active - from);
    const away = "translateY(65%) translateZ(4rem) scaleY(1.28)";
    items.forEach((_, i) => {
      const card = cardRefs.current[i];
      if (!card) return;
      const before = (i - from + count) % count;
      const after = (i - active + count) % count;
      const resting = positionFor(after);
      if (forward && before < steps) {
        // Stays above the new front card while it falls, then drops to the back.
        const top = String(count + steps - before);
        card.animate([
          { transform: positionFor(before), opacity: 1, filter: "blur(0px)", zIndex: top, easing: "cubic-bezier(.45,0,.75,.4)" },
          { transform: away, opacity: 0, filter: "blur(4px)", zIndex: top, offset: 0.45 },
          { transform: resting, opacity: 0, filter: "blur(0px)", zIndex: "1", offset: 0.47, easing: "ease-out" },
          { transform: resting, opacity: 1, zIndex: "1" },
        ], { duration: 900, delay: before * 90, fill: "backwards" });
      } else if (!forward && after < steps) {
        // Reverse: fades out of the back, then rises from below into place.
        card.animate([
          { transform: positionFor(count - steps + after), opacity: 1, easing: "ease-in" },
          { transform: positionFor(count - steps + after), opacity: 0, offset: 0.25 },
          { transform: away, opacity: 0, filter: "blur(4px)", offset: 0.27, easing: "cubic-bezier(.2,.7,.25,1)" },
          { transform: resting, opacity: 1, filter: "blur(0px)" },
        ], { duration: 900, delay: (steps - 1 - after) * 90, fill: "backwards" });
      }
    });
  }, [active, count, items]);

  // The orange pill follows the active tab (re-measured once fonts load or the rail resizes).
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const measure = () => {
      const tab = tabRefs.current[active];
      if (tab) setPill({ x: tab.offsetLeft, w: tab.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail.firstElementChild as Element);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [active, isArabic, count]);

  // Keep the active tab centred in the rail. scrollBy is relative, so it works the same in RTL and LTR.
  useEffect(() => {
    const tab = tabRefs.current[active];
    const rail = railRef.current;
    if (!tab || !rail) return;
    const t = tab.getBoundingClientRect();
    const r = rail.getBoundingClientRect();
    rail.scrollBy({ left: t.left + t.width / 2 - (r.left + r.width / 2), behavior: "smooth" });
  }, [active]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const span = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((index + 0.5) / count), behavior: "smooth" });
  };

  if (!count) return null;
  return (
    <div className="wstack" ref={trackRef} style={{ ["--wstack-count" as string]: count }}>
      <div className="wstack-sticky">
        <div className="wstack-deck">
        {/* Desktop only: the front project's extra images sit beside the card, partly tucked behind it. */}
        {items.map((item, i) => item.gallery?.length ? (
          <div key={item.id} className={`wstack-gallery${i === active ? " is-on" : ""}`} aria-hidden={i !== active}>
            {item.gallery.slice(0, 4).map((src, g) => (
              <figure key={src} className={`wstack-float wstack-float--${FLOAT_SLOTS[g]}`} style={{ transitionDelay: i === active ? `${200 + g * 110}ms` : "0ms" }}>
                <img src={src} alt="" loading="lazy" />
              </figure>
            ))}
          </div>
        ) : null)}
          {items.map((item, i) => {
            const depth = (i - active + count) % count;
            const isFront = depth === 0;
            const card = (
              <>
                <div className="wstack-media">
                  <img src={item.image} alt={item.title} loading={i < 2 ? "eager" : "lazy"} />
                  <div className="wstack-notch" aria-hidden="true">
                    <svg viewBox="0 0 23 178"><path d="M0 178V0c0 7.57.939 15.1 2.789 22.44 1.84 7.344 4.598 14.497 8.226 21.334 15.346 28.928 15.346 61.53 0 90.452C3.762 147.895 0 162.849 0 178" /></svg>
                    <span>{item.sideLabel || brandLabel}</span>
                  </div>
                  <ul className="wstack-tags">
                    {item.tags.map((tag, t) => <li key={tag} style={{ transitionDelay: isFront ? `${260 + t * 90}ms` : "0ms" }}>{tag}</li>)}
                  </ul>
                </div>
                <div className="wstack-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </>
            );
            const common = {
              ref: (el: HTMLElement | null) => { cardRefs.current[i] = el; },
              className: `wstack-card${isFront ? " is-front" : ""}${depth > DEPTH ? " is-hidden" : ""}`,
              style: { zIndex: count - depth, transform: positionFor(depth) },
              "aria-hidden": !isFront,
            };
            return item.href ? (
              <a key={item.id} href={item.href} tabIndex={isFront ? 0 : -1} {...common}>{card}</a>
            ) : (
              <article key={item.id} onClick={() => isFront && goTo((active + 1) % count)} {...common}>{card}</article>
            );
          })}
        </div>
        <div className="wstack-rail" ref={railRef}>
          <div className="wstack-tabs" role="tablist" aria-label={isArabic ? "الأعمال" : "Projects"}>
            <span className="wstack-pill" aria-hidden="true" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
            {items.map((item, i) => (
              <button key={item.id} ref={(el) => { tabRefs.current[i] = el; }} role="tab" aria-selected={i === active} className={i === active ? "is-active" : ""} onClick={() => goTo(i)}>
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function positionFor(depth: number) {
  if (depth === 0) return "none";
  return `translateY(calc(var(--wstack-peek) * ${-depth})) translateZ(calc(var(--wstack-depth) * ${-depth}))`;
}
