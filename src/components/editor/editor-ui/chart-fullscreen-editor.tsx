"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChartEditor } from "./chart-editor";
import { ChartData } from "@/components/blocks/editor-00/nodes/chart-node";
import { cn } from "@/lib/utils";

interface ChartFullscreenEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartData: ChartData;
  onSave: (data: ChartData) => void;
}

export function ChartFullscreenEditor({
  open,
  onOpenChange,
  chartData,
  onSave,
}: ChartFullscreenEditorProps) {
  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSave = (updatedData: ChartData) => {
    onSave(updatedData);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-background/80 backdrop-blur-xl" />
        <DialogPrimitive.Content
          className={cn(
            "max-w-none w-screen h-screen max-h-screen m-0 p-6",
            "border-0 bg-background/95 backdrop-blur-xl",
            "fixed inset-0 top-0 left-0 right-0 bottom-0",
            "translate-y-0 -translate-y-0 translate-x-0 -translate-x-0",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
            "duration-300 rounded-none z-50 overflow-y-auto"
          )}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-gradient-light text-xl">
              Modifier le graphique
            </DialogTitle>
            <DialogDescription>
              Configurez votre graphique : type, données et séries
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="max-w-5xl mx-auto">
              <ChartEditor
                chartData={chartData}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

