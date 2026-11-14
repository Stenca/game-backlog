import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
};

export default function DeleteConfirmOverlay({
  onConfirm,
  onCancel,
  isDeleting = false,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded bg-background/80 p-3 text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-sm font-medium text-ink">Delete ?</p>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Yes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            No
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
