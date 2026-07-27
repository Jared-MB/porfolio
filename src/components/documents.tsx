"use client";

import { DesktopApp } from "@dayos/core";
import { useDynamicWindows, useWindowRoute } from "@dayos/next";
import { Folder, Square, X } from "lucide-react";
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
    <>
      <DesktopApp id={HREF}>
        <DocumentsShell />
      </DesktopApp>
      <Files />
    </>
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

function Files() {
  const windows = useDynamicWindows(ROUTES.file);

  return windows.map(({ href, params }) => (
    <DesktopApp id={href} key={href}>
      <FileShell file={params.file} />
    </DesktopApp>
  ));
}

function FileShell({ file }: { file: string }) {
  const content = useWindowRoute();

  return (
    <Window
      className="window"
      defaultPosition={{ x: 220, y: 140 }}
      defaultSize={{ width: 520, height: 726 }}
      keepMounted
    >
      <WindowHeader className="window-header">
        <WindowName className="window-title">{file}</WindowName>
        <WindowActions className="window-actions">
          <WindowExpand className="window-button">▢</WindowExpand>
          <WindowClose className="window-button">✕</WindowClose>
        </WindowActions>
      </WindowHeader>
      <WindowContent className="window-content">{content}</WindowContent>
    </Window>
  );
}
