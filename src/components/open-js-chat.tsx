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

const HREF = ROUTES["open-js-chat"];

export function OpenJSChat() {
  return (
    <DesktopApp id={HREF}>
      <OpenJSChatShell />
    </DesktopApp>
  );
}

function OpenJSChatShell() {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <AppWindow className="size-12" />
        <DesktopIconText>OpenJS Chat</DesktopIconText>
      </DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>OpenJS Chat</WindowName>
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
