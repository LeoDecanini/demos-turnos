"use client";
import { useEffect } from "react";

export default function SWRegisterReservar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/reservar-sw.js", { scope: "/reservar/" })
        .catch(() => {});
    }
  }, []);
  return null;
}
