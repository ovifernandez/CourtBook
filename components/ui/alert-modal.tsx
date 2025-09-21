"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlertModalProps {
  open: boolean
  onClose: () => void
  title?: string
  message: string
}

export function AlertModal({ open, onClose, title = "Aviso", message }: AlertModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[92%] max-w-sm rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="mx-auto text-lg font-semibold text-slate-900">{title}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="px-6 pb-6 text-center text-slate-600">{message}</DialogDescription>

        <DialogFooter className="px-6 pb-6">
          <Button
            onClick={onClose}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 rounded-xl"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
