"use client";

import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`neu-shimmer neu-inset rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`neu-card p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="w-1/3 h-5" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-full h-16 rounded-2xl" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-20 h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonSubjectCard() {
  return (
    <div className="neu-card p-6 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-16 h-6 rounded-full" />
          <Skeleton className="w-24 h-4 rounded-full" />
        </div>
        <Skeleton className="w-4/5 h-6 rounded-xl" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-32 h-4 rounded-lg" />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-white/60">
        <div className="flex justify-between">
          <Skeleton className="w-16 h-3 rounded-lg" />
          <Skeleton className="w-10 h-3 rounded-lg" />
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
        <div className="pt-2 flex justify-end">
          <Skeleton className="w-28 h-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonWorkspace() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-7 rounded-xl" />
          <Skeleton className="w-32 h-5 rounded-lg" />
        </div>
        <Skeleton className="w-36 h-8 rounded-xl" />
      </div>

      {/* Main Header Card skeleton */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-6 rounded-full" />
          <Skeleton className="w-24 h-6 rounded-full" />
        </div>
        <Skeleton className="w-1/2 h-8 rounded-2xl" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="w-48 h-4 rounded-lg" />
        </div>
        <div className="flex gap-3 pt-3">
          <Skeleton className="w-32 h-9 rounded-xl" />
          <Skeleton className="w-36 h-9 rounded-xl" />
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="w-full h-44 rounded-3xl" />
        <Skeleton className="w-full h-44 rounded-3xl" />
        <Skeleton className="w-full h-44 rounded-3xl" />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="w-full space-y-6">
      {/* Welcome banner skeleton */}
      <div className="neu-card p-6 sm:p-8 space-y-3">
        <Skeleton className="w-1/3 h-8 rounded-2xl" />
        <Skeleton className="w-2/3 h-4 rounded-lg" />
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="neu-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-20 h-4 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
            <Skeleton className="w-16 h-7 rounded-xl" />
            <Skeleton className="w-full h-2 rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Grid: Subjects & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="neu-card p-6 space-y-4">
            <Skeleton className="w-1/4 h-6 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="neu-card p-6 space-y-4">
            <Skeleton className="w-1/3 h-6 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonChatInbox() {
  return (
    <div className="neu-card flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-3xl h-full">
      {/* Left Column Skeleton */}
      <div className="md:col-span-5 lg:col-span-4 border-r border-white/80 p-4 space-y-3 flex flex-col h-full bg-white/20">
        <Skeleton className="w-full h-8 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="w-16 h-7 rounded-xl" />
          <Skeleton className="w-20 h-7 rounded-xl" />
          <Skeleton className="w-16 h-7 rounded-xl" />
        </div>
        <div className="space-y-2 flex-1 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="neu-card-sm p-3 flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="w-24 h-3.5 rounded-lg" />
                  <Skeleton className="w-10 h-3 rounded-lg" />
                </div>
                <Skeleton className="w-36 h-3 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column Skeleton */}
      <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 bg-white/10 p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/80">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="w-36 h-4 rounded-lg" />
            <Skeleton className="w-48 h-3 rounded-lg" />
          </div>
        </div>

        <div className="flex-1 space-y-3 neu-inset p-4 rounded-2xl flex flex-col justify-end">
          <div className="self-start w-2/3">
            <Skeleton className="h-16 rounded-2xl" />
          </div>
          <div className="self-end w-1/2">
            <Skeleton className="h-12 rounded-2xl" />
          </div>
          <div className="self-start w-3/4">
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="flex-1 h-10 rounded-xl" />
          <Skeleton className="w-20 h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonAssignmentList() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="w-40 h-9 rounded-xl" />
        <Skeleton className="w-36 h-9 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="neu-card p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="w-20 h-5 rounded-full" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-5 rounded-lg" />
            <Skeleton className="w-full h-3 rounded-lg" />
            <div className="flex justify-between items-center pt-2 border-t border-white/60">
              <Skeleton className="w-24 h-4 rounded-lg" />
              <Skeleton className="w-16 h-7 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
