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

const HREF = ROUTES["red-cross"];

export function RedCross() {
  return (
    <DesktopApp id={HREF}>
      <RedCrossShell />
    </DesktopApp>
  );
}

function RedCrossShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <Image
          src="/cruz-roja.avif"
          alt="Mexican Red Cross"
          className="size-12 aspect-8/9 object-contain"
          width={64}
          height={72}
        />
        <DesktopIconText>Mexican Red Cross</DesktopIconText>
      </DesktopIcon>
      <Window
        defaultSize={{
          height: 720,
          width: 1080,
        }}
      >
        <WindowHeader>
          <WindowName>Mexican Red Cross</WindowName>
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
