import React from 'react'

const SkeletonRow = () => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl animate-pulse mb-3">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-white/10"></div>
      <div>
        <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-20"></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="w-8 h-8 rounded-lg bg-white/10"></div>
      <div className="w-8 h-8 rounded-lg bg-white/10"></div>
    </div>
  </div>
)


export default SkeletonRow;

