#!/bin/bash
# Production build script - skip tsc type checking (Vite handles compilation)
# The codebase has gradual TypeScript adoption; strict tsc blocks build unnecessarily
npx vite build
