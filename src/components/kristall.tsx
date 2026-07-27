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

const HREF = ROUTES.kristall;

export function Kristall() {
  return (
    <DesktopApp id={HREF}>
      <KristallShell />
    </DesktopApp>
  );
}

function KristallShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <Image
          src="/kristall.webp"
          alt="Kristall Logo"
          className="size-12"
          width={48}
          height={48}
        />
        <DesktopIconText>Kristall</DesktopIconText>
      </DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>Kristall</WindowName>
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
