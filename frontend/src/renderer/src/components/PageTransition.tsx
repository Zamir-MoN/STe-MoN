import React from 'react'
import { motion } from 'framer-motion'

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
)


export default PageTransition;

