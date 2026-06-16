import React from 'react'

const SkeletonCard = () => (
  <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-lg animate-pulse">
    <div className="h-48 bg-white/10 w-full"></div>
    <div className="p-4">
      <div className="h-5 bg-white/10 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-white/10 rounded w-1/3"></div>
    </div>
  </div>
)


export default SkeletonCard;

