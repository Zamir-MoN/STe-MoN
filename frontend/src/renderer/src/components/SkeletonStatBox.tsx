import React from 'react'

const SkeletonStatBox = () => (
  <div className="bg-white/5 border border-white/5 rounded-xl p-4 animate-pulse flex items-center justify-between">
    <div>
      <div className="h-3 bg-white/10 rounded w-24 mb-2"></div>
      <div className="h-6 bg-white/10 rounded w-16"></div>
    </div>
    <div className="w-10 h-10 rounded-full bg-white/10"></div>
  </div>
)


export default SkeletonStatBox;

