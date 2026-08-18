// src/components/UI/dialog.tsx
// @ts-nocheck
// import PropTypes from "prop-types";
import { cloneElement, useEffect, useRef } from "react";
import * as ReactDOM from "react-dom";
import { useAppDispatch } from "../../hooks/use-apps";
import React, { ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open?: boolean) => void;
  children: ReactNode;
  maxWidth?: string;
  height?: string;
};

// ==================== MAIN DIALOG ====================
export const Dialog = ({ open, onOpenChange, children, maxWidth = "640px", height = "max-content" }: DialogProps) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        try {
          onOpenChange(false);
        } catch {
          onOpenChange();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full relative"
        style={{ maxWidth, height }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          aria-label="Close dialog"
          onClick={() => {
            try {
              onOpenChange(false);
            } catch {
              onOpenChange();
            }
          }}
          className="absolute top-4 right-4 text-2xl leading-none text-gray-500 hover:text-gray-800"
        >
          ×
        </button>
      </div>
    </div>,
    typeof document !== "undefined" ? document.body : null
  );
};

// ==================== DIALOG DESCRIPTION (NEW) ====================
export const DialogDescription = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    {children}
  </p>
);

// ==================== BUTTON DISMISS DIALOG ====================
export const ButtonDismissDialog = ({
  open,
  onOpenChange,
  maxWidth = "448px",
  height = "max-content",
  children,
}) => {
  const dispatch = useAppDispatch();

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] !m-0">
      <div
        className="bg-white rounded-lg shadow-lg w-full relative"
        style={{ maxWidth, height }}
      >
        {children}
        <button
          className="absolute top-6 right-6 text-[24px] text-gray-500 hover:text-gray-800 flex items-center justify-start"
          onClick={() => dispatch(onOpenChange(false))}
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
};

// ==================== OUTSIDE DISMISS DIALOG ====================
export const OutsideDismissDialog = ({
  open,
  onOpenChange,
  maxWidth = "480px",
  height = "max-content",
  children,
}) => {
  const dispatch = useAppDispatch();
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        // dispatch(onOpenChange(false));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="confirmation-modal-overlay"
      onClick={() => dispatch(onOpenChange(false))}
    >
      <div
        ref={ref}
        className="bg-white cursor-default rounded-lg shadow-lg w-full relative max-md:w-[90%]"
        style={{ maxWidth, height }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// ==================== DIALOG TRIGGER ====================
export const DialogTrigger = ({
  children,
  onClick,
}) => {
  const dispatch = useAppDispatch();

  return cloneElement(children, {
    onClick: () => dispatch(onClick(true)),
  });
};

// ==================== DIALOG CONTENT ====================
export const DialogContent = ({
  children,
  className = "",
}) => <div className={`dialog-content ${className}`}>{children}</div>;

// ==================== DIALOG HEADER ====================
export const DialogHeader = ({
  children,
  className = "",
}) => (
  <div className={`dialog-header mb-4 p-6 pb-0 flex flex-col gap-2 ${className}`}>
    {children}
  </div>
);

// ==================== DIALOG TITLE ====================
export const DialogTitle = ({
  children,
}: {
  children: ReactNode;
}) => <h2 className="text-xl font-medium">{children}</h2>;

// ==================== DIALOG SUBTITLE ====================
export const DialogSubTitle = ({
  children,
}: {
  children: ReactNode;
}) => <p className="text-sm text-text-placeholder">{children}</p>;

// ==================== DIALOG SUBHEADER ====================
export const DialogSubHeader = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`text-sm text-gray-500 ${className}`}>
    {children}
  </div>
);

// ==================== DIALOG FOOTER ====================
export const DialogFooter = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col sm:flex-row justify-end gap-3 p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// ==================== DIALOG ACTIONS ====================
export const DialogActions = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col sm:flex-row justify-end gap-2 p-6 pt-0 ${className}`}>
    {children}
  </div>
);