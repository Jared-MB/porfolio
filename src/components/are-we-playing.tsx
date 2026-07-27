"use client";

import { DesktopApp } from "@dayos/core";
import { useWindowRoute } from "@dayos/next";
import { AppWindow, Square, X } from "lucide-react";
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

const HREF = ROUTES["are-we-playing"];

export function AreWePlaying() {
  return (
    <DesktopApp id={HREF}>
      <AreWePlayingShell />
    </DesktopApp>
  );
}

function AreWePlayingShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <AppWindow className="size-12" />
        <DesktopIconText>AreWePlaying?</DesktopIconText>
      </DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>AreWePlaying?</WindowName>
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
