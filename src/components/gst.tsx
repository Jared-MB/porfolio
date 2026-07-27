"use client";

import { DesktopApp } from "@dayos/core";
import { useWindowRoute } from "@dayos/next";
import { Square, X } from "lucide-react";
import Image from "next/image";
import { ROUTES } from "@/lib/routes";
import { DesktopIcon, DesktopIconText } from "./ui/desktop";
import {
  Window,
  WindowActions,
  WindowClose,
  WindowContent,
  WindowExpand,
  WindowHeader,
  WindowName,
} from "./ui/window";

const HREF = ROUTES.gst;

export function GST() {
  return (
    <DesktopApp id={HREF}>
      <GSTShell />
    </DesktopApp>
  );
}

function GSTShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <Image
          src="/gst.avif"
          alt="GST"
          className="size-12 object-contain"
          width={48}
          height={48}
        />
        <DesktopIconText>Transportes Bonampak</DesktopIconText>
      </DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>Transportes Bonampak</WindowName>
          <WindowActions>
            <WindowExpand>
              <Square className="size-4" />
            </WindowExpand>
            <WindowClose>
              <X className="size-4" />
            </WindowClose>
          </WindowActions>
        </WindowHeader>
        <WindowContent>{content}</WindowContent>
      </Window>
    </>
  );
}
