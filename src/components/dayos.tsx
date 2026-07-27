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

const HREF = ROUTES.dayos;

export function Dayos() {
  return (
    <DesktopApp id={HREF}>
      <DayosShell />
    </DesktopApp>
  );
}

function DayosShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <FileArchive className="size-12" />
        <DesktopIconText>DayOS</DesktopIconText>
      </DesktopIcon>
      <Window
        defaultSize={{
          height: 600,
          width: 1180,
        }}
      >
        <WindowHeader>
          <WindowName>DayOS</WindowName>
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
