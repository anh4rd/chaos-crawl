var e=`import { useModalDialog } from "../ui/useModalDialog";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Icon from "../ui/Icon";

export interface GuidedTourStep {
  target: string;
  title: string;
  body: string;
  page?: string;
}

type TourPosition = { top: number; left: number; width: number; pad: number };

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
  const dialogRef = useModalDialog();
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
    if (!card) return;
    const settings = getComputedStyle(card);
    const gap = Number.parseFloat(settings.getPropertyValue("--tour-gap"));
    const edge = Number.parseFloat(settings.getPropertyValue("--tour-edge"));
    const maxWidth = Number.parseFloat(
      settings.getPropertyValue("--tour-width"),
    );
    const pad = Number.parseFloat(
      settings.getPropertyValue("--tour-target-pad"),
    );
    const preferredRoom = Number.parseFloat(
      settings.getPropertyValue("--tour-preferred-room"),
    );
    const dockRoom = Number.parseFloat(
      settings.getPropertyValue("--tour-dock-room"),
    );
    const cardHeight = card.getBoundingClientRect().height;
    const width = Math.min(maxWidth, window.innerWidth - edge * 2);
    const left = Math.max(
      edge,
      Math.min(
        rect.left + rect.width / 2 - width / 2,
        window.innerWidth - width - edge,
      ),
    );
    const roomBelow = window.innerHeight - rect.bottom - gap - edge;
    const roomAbove = rect.top - gap - edge;
    let top: number;
    if (
      roomBelow >= Math.min(cardHeight, preferredRoom) ||
      roomBelow >= roomAbove
    ) {
      top = Math.min(rect.bottom + gap, window.innerHeight - cardHeight - edge);
    } else {
      top = Math.max(edge, rect.top - cardHeight - gap);
    }
    // If the target is near the bottom and neither side has room, use a bottom dock
    // while keeping a clear visual gap around the highlighted control.
    if (roomBelow < dockRoom && roomAbove < dockRoom)
      top = Math.max(edge, window.innerHeight - cardHeight - edge);
    setPosition({ top, left, width, pad });
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
        .querySelectorAll(".tour-highlight")
        .forEach((node) => node.classList.remove("tour-highlight"));
      const target = document.querySelector<HTMLElement>(step.target);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        target.classList.add("tour-highlight");
        timer = window.setTimeout(measure, 220);
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
        .querySelectorAll(".tour-highlight")
        .forEach((node) => node.classList.remove("tour-highlight"));
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
  const pad = position?.pad ?? 0;
  const rect = targetRect;
  const topHeight = rect ? Math.max(0, rect.top - pad) : window.innerHeight;
  const leftWidth = rect ? Math.max(0, rect.left - pad) : 0;
  const rightLeft = rect
    ? Math.min(window.innerWidth, rect.right + pad)
    : window.innerWidth;
  const bottomTop = rect ? Math.min(window.innerHeight, rect.bottom + pad) : 0;

  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="guided-tour"
      aria-label={\`\${label}: \${step.title}\`}
    >
      <button
        type="button"
        className="guided-tour__scrim guided-tour__scrim--top"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        style={{ height: topHeight }}
      />
      {rect && (
        <>
          <button
            type="button"
            className="guided-tour__scrim guided-tour__scrim--left"
            aria-hidden="true"
            tabIndex={-1}
            onClick={onClose}
            style={{
              top: rect.top - pad,
              height: rect.height + pad * 2,
              width: leftWidth,
            }}
          />
          <button
            type="button"
            className="guided-tour__scrim guided-tour__scrim--right"
            aria-hidden="true"
            tabIndex={-1}
            onClick={onClose}
            style={{
              top: rect.top - pad,
              height: rect.height + pad * 2,
              left: rightLeft,
            }}
          />
          <button
            type="button"
            className="guided-tour__scrim guided-tour__scrim--bottom"
            aria-hidden="true"
            tabIndex={-1}
            onClick={onClose}
            style={{ top: bottomTop, left: 0, right: 0, bottom: 0 }}
          />
        </>
      )}
      <section
        ref={cardRef}
        className="guided-tour__card"
        style={
          position
            ? { top: position.top, left: position.left, width: position.width }
            : undefined
        }
      >
        <div className="guided-tour__header">
          <span>
            {label} · {index + 1} OF {steps.length}
          </span>
          <button type="button" onClick={onClose} aria-label="Close tour">
            <Icon name="x" className="icon--size-18" />
          </button>
        </div>
        <div className="guided-tour__progress">
          {steps.map((item, i) => (
            <i
              key={\`\${item.title}-\${i}\`}
              className={\`guided-tour__step\${i <= index ? " guided-tour__step--done" : ""}\`}
            />
          ))}
        </div>
        <span className="guided-tour__kicker">
          {step.page
            ? step.page.replaceAll("-", " ").toUpperCase()
            : "EXPLORE THE GAME"}
        </span>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="guided-tour__actions">
          <button type="button" className="guided-tour__skip" onClick={onClose}>
            Skip tour
          </button>
          <div>
            <button
              type="button"
              className="guided-tour__back"
              disabled={index === 0}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
            >
              <Icon name="arrow-left" className="icon--size-16" /> Back
            </button>
            <button
              type="button"
              className="guided-tour__next"
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
    </dialog>,
    document.body,
  );
}
`;export{e as default};