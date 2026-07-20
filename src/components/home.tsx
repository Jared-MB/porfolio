"use client";

import { DesktopApp } from "@dayos/core";
import { useWindowRoute } from "@dayos/next";
import { FileText, Square, X } from "lucide-react";
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

const HREF = ROUTES.home;

export function Home({ title }: { title: string }) {
  return (
    <DesktopApp id={HREF}>
      <HomeShell title={title} />
    </DesktopApp>
  );
}

function HomeShell({ title }: { title: string }) {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>
        <FileText className="size-12" />
        <DesktopIconText>{title}</DesktopIconText>
      </DesktopIcon>
      <Window
        defaultSize={{
          height: 540,
          width: 760,
        }}
      >
        <WindowHeader>
          <WindowName>{title}</WindowName>
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
