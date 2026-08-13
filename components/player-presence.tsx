"use client";

import { useEffect } from "react";
import { touchPlayerPresenceAction } from "@/app/presence-actions";

export function PlayerPresence() {
  useEffect(() => {
    const touch = () => void touchPlayerPresenceAction();
    touch();
    const timer = window.setInterval(touch, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
