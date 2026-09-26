"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  HeartHandshake,
} from "lucide-react";

import styles from "./HomeDonorTicker.module.css";

type HomeDonorTickerProps = {
  monthLabel: string;
  donors: string[];
};

const MOBILE_MAX_WIDTH = 639;
const TABLET_MAX_WIDTH = 1023;

const MOBILE_SPEED_PX_PER_SECOND = 40;
const TABLET_SPEED_PX_PER_SECOND = 45;
const DESKTOP_SPEED_PX_PER_SECOND = 50;

function getTargetSpeed() {
  if (
    window.innerWidth <=
    MOBILE_MAX_WIDTH
  ) {
    return MOBILE_SPEED_PX_PER_SECOND;
  }

  if (
    window.innerWidth <=
    TABLET_MAX_WIDTH
  ) {
    return TABLET_SPEED_PX_PER_SECOND;
  }

  return DESKTOP_SPEED_PX_PER_SECOND;
}

export default function HomeDonorTicker({
  monthLabel,
  donors,
}: HomeDonorTickerProps) {
  const tickerText =
    donors.join(" • ");

  const groupRef =
    useRef<HTMLSpanElement>(null);

  const trackRef =
    useRef<HTMLDivElement>(null);

  const [paused, setPaused] =
    useState(false);

  useEffect(() => {
    const group =
      groupRef.current;

    const track =
      trackRef.current;

    if (
      !group ||
      !track
    ) {
      return;
    }

    let frameId = 0;

    const updateDuration = () => {
      cancelAnimationFrame(
        frameId,
      );

      frameId =
        requestAnimationFrame(
          () => {
            const distance =
              group.getBoundingClientRect()
                .width;

            if (
              distance <= 0
            ) {
              return;
            }

            const durationSeconds =
              distance /
              getTargetSpeed();

            track.style.setProperty(
              "--ticker-duration",
              `${durationSeconds.toFixed(3)}s`,
            );
          },
        );
    };

    updateDuration();

    const resizeObserver =
      typeof ResizeObserver !==
      "undefined"
        ? new ResizeObserver(
            updateDuration,
          )
        : null;

    resizeObserver?.observe(
      group,
    );

    window.addEventListener(
      "resize",
      updateDuration,
      {
        passive: true,
      },
    );

    return () => {
      cancelAnimationFrame(
        frameId,
      );

      resizeObserver?.disconnect();

      window.removeEventListener(
        "resize",
        updateDuration,
      );
    };
  }, [tickerText]);

  return (
    <div
      className={`${styles.root} border-t border-brand-800 bg-brand-950 px-4 py-3 text-white sm:px-6`}
    >
      <div className={styles.layout}>
        <div className={styles.heading}>
          <HeartHandshake
            aria-hidden="true"
            className={styles.icon}
          />
          <span>
            Terima kasih, donatur{" "}
            {monthLabel}
          </span>
        </div>

        <span className="sr-only">
          {tickerText}
        </span>

        <div
          className={styles.viewport}
          aria-hidden="true"
        >
          <div
            ref={trackRef}
            className={`${styles.track} ${
              paused
                ? styles.paused
                : ""
            }`}
          >
            <span
              ref={groupRef}
              className={styles.group}
            >
              {tickerText}
            </span>
            <span
              className={styles.group}
            >
              {tickerText}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.pauseControl}
          aria-pressed={paused}
          onClick={() =>
            setPaused(
              (current) =>
                !current,
            )
          }
        >
          {paused
            ? "Lanjutkan"
            : "Jeda"}
        </button>
      </div>
    </div>
  );
}
