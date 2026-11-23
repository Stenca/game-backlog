import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function PageTransition({ children }: Props) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.main>
  );
}
