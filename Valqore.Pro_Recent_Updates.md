# Valqore.Pro - Recent Updates Changelog

This document summarizes all the recent features, bug fixes, UI improvements, and optimizations implemented in the Valqore.Pro application.

## 🚀 Features & Enhancements

- **Discount System Validation & UI**
  - Added full backend and database support for adding percentage-based discounts to games.
  - Updated the "Buy Panel" to dynamically calculate and display the accurate *original* price (strikethrough) based on the final price and discount percentage.
  
- **Bundle Management System**
  - Removed the unnecessary YouTube trailer link requirement for Game Bundles.
  - Added a dynamic multi-image link uploader specifically for Game Bundles, allowing admins to add multiple screenshots or covers for bundled games.
  - Separated the "Manage Games" tables into two distinct, organized sections: **Single Games** and **Game Bundles**.

- **Media Viewer Improvements**
  - **Single Games:** The media gallery will now cleanly display *only* the video player for single games, automatically hiding the cover image from the thumbnail gallery to prevent redundancy.
  - **YouTube Thumbnails:** The media selector now automatically extracts the video ID from the provided YouTube Trailer URL and fetches the official, high-quality YouTube thumbnail instead of displaying a generic grey box.

- **UI & Branding Updates**
  - Removed cluttered, hardcoded tags (like AAA, Horror) and "System Requirements" placeholders.
  - Updated the details panel to clearly reflect the brand: 
    - **Powered by:** Valqore.Pro
    - **Platform:** Steam
    - **Type:** Steam Account

## ⚡ Performance Optimizations (Windows 10 / 11)

- **Electron Hardware Acceleration**
  - Appended strict Chromium flags (`enable-gpu-rasterization`, `enable-zero-copy`, `disable-software-rasterizer`) to offload rendering directly to the graphics card.
  - Disabled the heavy `transparent: true` window mode. This prevents the Windows Desktop Window Manager (DWM) from struggling to calculate background compositing every frame, eliminating UI lag.
- **CSS GPU Offloading**
  - Re-wrote the animated gradient background to use `transform: rotate` instead of `background-position`. This shifts the animation completely off the CPU and into the GPU compositor thread, resulting in a buttery-smooth 60+ FPS experience.

## 🐛 Bug Fixes

- **Library Access Bug (Buy Now Button)**
  - Fixed an issue where clicking "BUY NOW" would instantly change the button text to "ALREADY IN LIBRARY" even if the server rejected the request (e.g., if the user did not have access to a selective game). The UI now properly waits for server confirmation before updating.

## 📦 Build & Release

- **Custom App Icon**
  - Converted the provided JPEG icon into a standardized format.
  - Successfully packaged and rebuilt the application via `electron-builder`.
  - The optimized production installer was outputted to `frontend/dist/Valqore.Pro Setup 1.0.0.exe`.
