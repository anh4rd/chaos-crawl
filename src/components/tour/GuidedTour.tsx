import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Icon from "../ui/Icon";
import "../../styles/GuidedTour.css";

export interface GuidedTourStep {
  target: string;
  title: string;
  body: string;
  page?: string;
}

type TourPosition = { top: number; left: number; width: number };
const GAP = 14;
const EDGE = 14;

export default function GuidedTour({
  steps,
  onNavigate,
  onClose,
  label = "QUICK TOUR",
}: {
  steps: GuidedTourStep[];
  onNavigate?: (page: string) => void;
  onClose: () => void;
  label?: string;
}) {
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState<TourPosition | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const step = steps[index];

  const measure = useCallback(() => {
    if (!step) return;
    const target = document.querySelector<HTMLElement>(step.target);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setTargetRect(rect);
    const card = cardRef.current;
    const cardHeight = card?.getBoundingClientRect().height ?? 230;
    const width = Math.min(420, window.innerWidth - EDGE * 2);
    const left = Math.max(
      EDGE,
      Math.min(
        rect.left + rect.width / 2 - width / 2,
        window.innerWidth - width - EDGE,
      ),
    );
    const roomBelow = window.innerHeight - rect.bottom - GAP - EDGE;
    const roomAbove = rect.top - GAP - EDGE;
    let top: number;
    if (roomBelow >= Math.min(cardHeight, 210) || roomBelow >= roomAbove) {
      top = Math.min(rect.bottom + GAP, window.innerHeight - cardHeight - EDGE);
    } else {
      top = Math.max(EDGE, rect.top - cardHeight - GAP);
    }
    // If the target is near the bottom and neither side has room, use a bottom dock
    // while keeping a clear visual gap around the highlighted control.
    if (roomBelow < 150 && roomAbove < 150)
      top = Math.max(EDGE, window.innerHeight - cardHeight - EDGE);
    setPosition({ top, left, width });
  }, [step]);

  useEffect(() => {
    if (!step) return;
    if (step.page) onNavigate?.(step.page);
    let attempts = 0;
    let timer = 0;
    const locate = () => {
      setTargetRect(null);
      setPosition(null);
      document
        .querySelectorAll(".cc-tour-highlight")
        .forEach((node) => node.classList.remove("cc-tour-highlight"));
      const target = document.querySelector<HTMLElement>(step.target);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        target.classList.add("cc-tour-highlight");
        window.setTimeout(measure, 220);
      } else if (attempts < 20) {
        attempts += 1;
        timer = window.setTimeout(locate, 100);
      }
    };
    const frame = window.requestAnimationFrame(locate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      document
        .querySelectorAll(".cc-tour-highlight")
        .forEach((node) => node.classList.remove("cc-tour-highlight"));
    };
  }, [index, step?.target, step?.page, onNavigate, measure]);

  useLayoutEffect(() => {
    measure();
    const onViewportChange = () => measure();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onViewportChange)
        : null;
    if (cardRef.current) observer?.observe(cardRef.current);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      observer?.disconnect();
    };
  }, [measure, index]);

  if (!step || typeof document === "undefined") return null;
  const pad = 9;
  const rect = targetRect;
  const topHeight = rect ? Math.max(0, rect.top - pad) : window.innerHeight;
  const leftWidth = rect ? Math.max(0, rect.left - pad) : 0;
  const rightLeft = rect
    ? Math.min(window.innerWidth, rect.right + pad)
    : window.innerWidth;
  const bottomTop = rect ? Math.min(window.innerHeight, rect.bottom + pad) : 0;

  return createPortal(
    <div
      className="cc-tour-layer"
      role="dialog"
      aria-modal="true"
      aria-label={`${label}: ${step.title}`}
    >
      <div
        className="cc-tour-scrim cc-tour-scrim--top"
        style={{ height: topHeight }}
      />
      {rect && (
        <>
          <div
            className="cc-tour-scrim cc-tour-scrim--left"
            style={{
              top: rect.top - pad,
              height: rect.height + pad * 2,
              width: leftWidth,
            }}
          />
          <div
            className="cc-tour-scrim cc-tour-scrim--right"
            style={{
              top: rect.top - pad,
              height: rect.height + pad * 2,
              left: rightLeft,
            }}
          />
          <div
            className="cc-tour-scrim cc-tour-scrim--bottom"
            style={{ top: bottomTop, left: 0, right: 0, bottom: 0 }}
          />
        </>
      )}
      <section
        ref={cardRef}
        className="cc-tour-card"
        style={
          position
            ? { top: position.top, left: position.left, width: position.width }
            : undefined
        }
      >
        <div className="cc-tour-card-top">
          <span>
            {label} · {index + 1} OF {steps.length}
          </span>
          <button type="button" onClick={onClose} aria-label="Close tour">
            <Icon name="x" className="icon--size-18" />
          </button>
        </div>
        <div className="cc-tour-progress">
          {steps.map((item, i) => (
            <i
              key={`${item.title}-${i}`}
              className={i <= index ? "is-done" : ""}
            />
          ))}
        </div>
        <span className="cc-tour-kicker">
          {step.page
            ? step.page.replaceAll("-", " ").toUpperCase()
            : "EXPLORE THE GAME"}
        </span>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="cc-tour-actions">
          <button type="button" className="cc-tour-skip" onClick={onClose}>
            Skip tour
          </button>
          <div>
            <button
              type="button"
              className="cc-tour-back"
              disabled={index === 0}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
            >
              <Icon name="arrow-left" className="icon--size-16" /> Back
            </button>
            <button
              type="button"
              className="cc-tour-next"
              onClick={() =>
                index === steps.length - 1
                  ? onClose()
                  : setIndex((value) => Math.min(steps.length - 1, value + 1))
              }
            >
              {index === steps.length - 1 ? "Finish" : "Next"}{" "}
              <Icon name="arrow-right" className="icon--size-16" />
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
