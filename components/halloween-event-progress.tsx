"use client";

import { useEffect, useState } from "react";
import { getHalloweenEventProgress } from "@/lib/events/halloween-season";
import styles from "./halloween-event-progress.module.css";

export function HalloweenEventProgress({
  initialProgress,
}: {
  initialProgress: ReturnType<typeof getHalloweenEventProgress>;
}) {
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    const update = () => setProgress(getHalloweenEventProgress());
    const timer = window.setInterval(update, 60_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  if (!progress.active) return null;
  return (
    <section className={styles.progress} aria-label="Progresso do evento de Halloween">
      <div className={styles.caption}>
        <span>Noites Apavorantes</span>
        <strong>{progress.percent}%</strong>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Progresso de Noites Apavorantes"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-valuetext={`${progress.percent}%`}
      >
        <span className={styles.fill} style={{ width: `${progress.percent}%` }} />
      </div>
    </section>
  );
}
