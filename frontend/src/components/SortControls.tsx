"use client";

import { Tab, Tabs } from "@heroui/react";
import { Clock, TrendingUp } from "lucide-react";
import type { Key } from "react";
import type { Sort } from "@/lib/apiClient";

interface SortControlsProps {
  sort: Sort;
  onChange: (sort: Sort) => void;
}

// Controlled toggle: holds no sort state of its own, it renders the `sort` prop
// and reports the chosen value upward so the parent stays the single source of
// truth. HeroUI Tabs gives accessible, keyboard-navigable selection out of the box.
export default function SortControls({ sort, onChange }: SortControlsProps) {
  return (
    <Tabs
      aria-label="Sort ideas"
      selectedKey={sort}
      onSelectionChange={(key: Key) => onChange(key as Sort)}
      color="primary"
      variant="light"
      size="sm"
      radius="full"
      classNames={{
        tabList: "bg-default-100",
        cursor: "bg-background shadow-sm",
        tabContent: "text-default-500 group-data-[selected=true]:text-primary",
      }}
    >
      <Tab
        key="popularity"
        title={
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Popular</span>
          </div>
        }
      />
      <Tab
        key="recent"
        title={
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Recent</span>
          </div>
        }
      />
    </Tabs>
  );
}
