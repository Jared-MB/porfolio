"use client";

import { FileText, Square, X } from "lucide-react";
import { DesktopApp } from "@/lib/dayos/desktop";
import { useWindowRoute } from "@/lib/dayos/next";
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

const HREF = ROUTES.cv;

export function CV() {
  return (
    <DesktopApp id={HREF}>
      <CVShell />
    </DesktopApp>
  );
}

function CVShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <FileText className="size-12" />
        <DesktopIconText>cv.pdf</DesktopIconText>
      </DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>cv.pdf</WindowName>
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
