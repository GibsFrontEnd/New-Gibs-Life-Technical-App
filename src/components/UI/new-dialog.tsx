// import PropTypes from "prop-types";
import { cloneElement, useEffect, useRef } from "react";
import * as ReactDOM from "react-dom";
import { useAppDispatch } from "../../hooks/use-apps";


export const ButtonDismissDialog = ({// @ts-ignore
  open,
  onOpenChange,
  maxWidth = "448px",
  height = "max-content",
  className = "",
  children,
}: any) => {
  const dispatch = useAppDispatch();

  // Prevent background body scroll while dialog is open to avoid scrollbar jitter / screen shaking
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (typeof onOpenChange === "function") {
      const res = onOpenChange(false);
      if (res && typeof res === "object" && res.type) {
        dispatch(res);
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999] !m-0 p-3 sm:p-4 md:p-6 overflow-hidden">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full relative flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden ${className}`}
        style={{
          maxWidth,
          ...(height && height !== "max-content" ? { height } : {}),
        }}
      >
        {children}
        <button
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 text-gray-400 hover:text-gray-700 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-xl leading-none"
          onClick={handleClose}
          type="button"
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
};

export const OutsideDismissDialog = ({// @ts-ignore
  open,onOpenChange,maxWidth = "448px",height = "max-content",className = "",children,
}: any) => {
  const dispatch = useAppDispatch();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(// @ts-ignore
    event) {// @ts-ignore
      if (ref.current && !ref.current.contains(event.target)) {
        if (typeof onOpenChange === "function") {
          const res = onOpenChange(false);
          if (res && typeof res === "object" && res.type) {
            dispatch(res);
          }
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch, onOpenChange]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999] p-3 sm:p-4 md:p-6 overflow-hidden">
      <div
        ref={ref}
        className={`bg-white cursor-default rounded-xl shadow-2xl w-full relative flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden ${className}`}
        style={{ maxWidth, ...(height && height !== "max-content" ? { height } : {}) }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export const DialogTrigger = ({ // @ts-ignore
  children, onClick }) => {
  const dispatch = useAppDispatch();

  return cloneElement(children, {
    onClick: () => dispatch(onClick(true)),
  });
};

export const DialogContent = ({ // @ts-ignore
  children, className = "" }) => (
  <div className={`dialog-content overflow-y-auto flex-1 min-h-0 ${className}`}>{children}</div>
);

export const DialogHeader = ({ // @ts-ignore
  children, className = "" }) => (
  <div className={`dialog-header p-4 sm:p-6 pb-3 sm:pb-4 border-b flex-shrink-0 flex flex-col gap-1 ${className}`}>{children}</div>
);

export const DialogTitle = ({ // @ts-ignore
  children, className = "" }) => (
  <h2 className={`text-lg sm:text-xl font-semibold text-gray-900 ${className}`}>{children}</h2>
);

export const DialogSubTitle = ({ // @ts-ignore
  children, className = "" }) => (
  <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
);

export const DialogFooter = ({ // @ts-ignore
  children, className = "" }) => (
  <div className={`dialog-footer border-t bg-gray-50/90 p-4 sm:p-6 py-3 sm:py-4 flex-shrink-0 ${className}`}>{children}</div>
);
