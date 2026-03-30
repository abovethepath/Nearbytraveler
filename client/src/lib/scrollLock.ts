/**
 * Shared scroll lock utility — prevents double-locking and ensures cleanup.
 * Use lockScroll()/unlockScroll() instead of directly setting body.style.overflow.
 */
let lockCount = 0;
const LOCK_CLASS = 'nt-scroll-locked';

export function lockScroll() {
  lockCount++;
  if (lockCount === 1) {
    document.body.classList.add(LOCK_CLASS);
  }
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove(LOCK_CLASS);
  }
}

/** Emergency reset — use when you suspect a stuck lock. */
export function forceUnlockScroll() {
  lockCount = 0;
  document.body.classList.remove(LOCK_CLASS);
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('width');
  document.body.style.removeProperty('height');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('left');
  document.body.removeAttribute('data-scroll-locked');
  document.documentElement.style.removeProperty('overflow');
}
