"use client";

import { ReactNode } from "react";

interface MotionProps {
  children: ReactNode;
  initial?: any;
  animate?: any;
  exit?: any;
  whileHover?: any;
  whileInView?: any;
  viewport?: any;
  transition?: any;
  className?: string;
  variants?: any;
  key?: string;
}

export function MotionDiv({ 
  children, 
  className = "", 
  whileHover, 
  initial,
  animate,
  variants,
  ...props 
}: MotionProps) {
  let classes = className;
  
  // Gestione hover
  if (whileHover?.scale) {
    classes += " transition-transform hover:scale-105";
  }
  
  // Gestione animazioni iniziali
  if (initial?.opacity === 0 || animate?.opacity === 1) {
    classes += " animate-in fade-in duration-500";
  }
  
  if (initial?.y === 20 || initial?.y === 30) {
    classes += " slide-in-from-bottom-4";
  }
  
  if (initial?.x === 20) {
    classes += " slide-in-from-left-4";
  }
  
  if (initial?.scale === 0.9 || initial?.scale === 0.95) {
    classes += " zoom-in-95";
  }
  
  // Gestione viewport animations
  if (whileInView) {
    classes += " animate-in fade-in slide-in-from-bottom-4 duration-500";
  }
  
  return (
    <div className={classes.trim()} {...props}>
      {children}
    </div>
  );
}

export function AnimatePresence({ children, mode }: { children: ReactNode; mode?: string }) {
  return <>{children}</>;
}

// Alias per compatibilità
export const motion = {
  div: MotionDiv,
};
