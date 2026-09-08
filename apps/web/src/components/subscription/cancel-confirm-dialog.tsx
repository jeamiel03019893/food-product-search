"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Shared by two flows that both confirm before cancelling a
// subscription — switching to a different plan (cancel, then
// checkout) and cancelling outright (no new subscription). Each call
// site supplies its own copy rather than this component picking
// between hardcoded variants, so it stays reusable for either case
// without knowing about them.
interface CancelConfirmDialogProps {
  open: boolean;
  pending: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  pendingLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CancelConfirmDialog = ({
  open,
  pending,
  title,
  description,
  cancelLabel,
  confirmLabel,
  pendingLabel,
  onCancel,
  onConfirm,
}: CancelConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
