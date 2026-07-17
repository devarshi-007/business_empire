import React from "react";
import { Button } from "@/components/ui/button";

export function BankruptcyOverlay() {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl md:text-8xl font-serif text-destructive font-bold uppercase tracking-widest mb-4 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]">
        Bankrupt
      </h1>
      <p className="text-xl text-muted-foreground mb-8 text-center max-w-md">
        You have lost all your money and properties. Your assets have been returned to the bank.
      </p>
      <div className="border border-destructive/50 p-6 rounded bg-destructive/10 text-destructive-foreground text-center">
        <p className="uppercase tracking-widest text-sm opacity-80 mb-2">Game Status</p>
        <p className="text-lg">You can continue to watch the game unfold.</p>
      </div>
    </div>
  );
}
