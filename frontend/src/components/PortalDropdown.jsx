import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PortalDropdown({ isOpen, onClose, triggerRef, children }) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      if (!triggerRef.current || !dropdownRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();

      let top = triggerRect.bottom + window.scrollY + 4; // 4px margin
      let left = triggerRect.left + window.scrollX;

      // Check if it goes off the bottom of the viewport
      if (triggerRect.bottom + dropdownRect.height + 10 > window.innerHeight) {
        // Place above the button
        top = triggerRect.top + window.scrollY - dropdownRect.height - 4;
      }

      // Check if it goes off the right of the viewport
      if (triggerRect.left + dropdownRect.width + 10 > window.innerWidth) {
        // Align right edge of dropdown with right edge of button
        left = triggerRect.right + window.scrollX - dropdownRect.width;
      }

      setCoords({ top, left });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        zIndex: 9999, // Ensure it's above everything
      }}
      className="w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1"
    >
      {children}
    </div>,
    document.body
  );
}
