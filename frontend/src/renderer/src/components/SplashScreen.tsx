import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-animated opacity-50"></div>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, type: "spring", bounce: 0.5 }}
        className="relative flex flex-col items-center z-10"
      >
        <div className="relative mb-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-valqore-accent/30 border-t-valqore-accent border-b-valqore-accent opacity-50"
          ></motion.div>
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 rounded-full border border-valqore-accent/20 border-r-valqore-accent border-l-valqore-accent opacity-30"
          ></motion.div>
          <Gamepad2 size={80} className="text-white drop-shadow-[0_0_15px_rgba(42,71,94,0.8)] relative z-10" />
        </div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl font-black tracking-widest text-transparent bg-clip-text from-valqore-accent via-white to-valqore-accent mb-2 drop-shadow-lg"
        >
          STe MoN
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-valqore-accent/60 font-mono tracking-[0.3em] text-xs uppercase"
        >
          Initializing Core Systems
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 flex flex-col items-center"
      >
        <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
          Developed by <span className="text-valqore-accent font-bold text-xs tracking-widest">Zamir</span>
        </p>
      </motion.div>
    </motion.div>
  )
}


export default SplashScreen;


