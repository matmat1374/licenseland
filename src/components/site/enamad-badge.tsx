"use client";

import { useState, useEffect } from "react";

export function EnamadBadge() {
  const [src, setSrc] = useState("/images/enamad.png");
  const officialUrl =
    "https://trustseal.enamad.ir/logo.aspx?id=7659841&Code=rLdieswp6iADLFY2xqoMYaOdEDroIuoi";

  useEffect(() => {
    // Try to load the official live dynamic logo from enamad in background
    const img = new Image();
    img.src = officialUrl;
    img.onload = () => {
      if (img.width > 20) {
        setSrc(officialUrl);
      }
    };
    img.onerror = () => {
      setSrc("/images/enamad.png");
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h4 className="mb-4 text-sm font-bold w-full text-right">نمادها</h4>
      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm transition-transform hover:scale-105 border border-border/40">
        <a
          referrerPolicy="origin"
          target="_blank"
          href="https://trustseal.enamad.ir/?id=7659841&Code=rLdieswp6iADLFY2xqoMYaOdEDroIuoi"
          className="flex h-full w-full items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            referrerPolicy="origin"
            src={src}
            alt="نماد اعتماد الکترونیکی (اینماد)"
            style={{ cursor: "pointer" }}
            // @ts-ignore
            code="rLdieswp6iADLFY2xqoMYaOdEDroIuoi"
            className="max-h-full max-w-full object-contain"
            onError={() => setSrc("/images/enamad.png")}
          />
        </a>
      </div>
    </div>
  );
}
