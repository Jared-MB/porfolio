"use client";

import { DesktopApp } from "@dayos/core";
import { useWindowRoute } from "@dayos/next";
import { FileArchive, Square, X } from "lucide-react";
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

const HREF = ROUTES.sfb;

export function SuspenseFallbackDebugger() {
  return (
    <DesktopApp id={HREF}>
      <SuspenseFallbackDebuggerShell />
    </DesktopApp>
  );
}

function SuspenseFallbackDebuggerShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <FileArchive className="size-12" />
        <DesktopIconText>Suspense Fallback Debugger</DesktopIconText>
      </DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>Suspense Fallback Debugger</WindowName>
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
