import { motion, AnimatePresence } from "motion/react";

type Props = {
  message: string;
  variant?: "success" | "error";
};

const styles = {
  success:
    "rounded border border-green-900 bg-green-950/40 px-3 py-2 text-sm text-green-400",
  error:
    "rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400",
} as const;

export default function StatusMessage({ message, variant = "success" }: Props) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={styles[variant]}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
