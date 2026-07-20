"use client";

import { Folder, Square, X } from "lucide-react";
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

const HREF = ROUTES.documents;

export function Documents() {
  return (
    <DesktopApp id={HREF}>
      <DocumentsShell />
    </DesktopApp>
  );
}

function DocumentsShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <Folder className="size-12" />
        <DesktopIconText>My Documents</DesktopIconText>
      </DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>My documents</WindowName>
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
