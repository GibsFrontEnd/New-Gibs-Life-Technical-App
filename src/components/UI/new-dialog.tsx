// import PropTypes from "prop-types";
import { cloneElement, useEffect, useRef } from "react";
import * as ReactDOM from "react-dom";
import { useAppDispatch } from "../../hooks/use-apps";


export const ButtonDismissDialog = ({// @ts-ignore
open,onOpenChange,maxWidth = "448px",height = "max-content",children,
}) => {
  const dispatch = useAppDispatch();

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-[#00000080] z-[9999] !m-0">
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

// ButtonDismissDialog.propTypes = {
//   open: PropTypes.bool.isRequired,
//   onOpenChange: PropTypes.func.isRequired,
//   children: PropTypes.node.isRequired,
//   maxWidth: PropTypes.string,
//   height: PropTypes.string,
// };

export const OutsideDismissDialog = ({// @ts-ignore
  open,onOpenChange,maxWidth = "448px",height = "max-content",children,
}) => {
  const dispatch = useAppDispatch();
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(// @ts-ignore
    event) {// @ts-ignore
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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-[#00000080] z-[9999] cursor-pointer" onClick={() => dispatch(onOpenChange(false))}>
      <div
        ref={ref}
        className="bg-white cursor-default rounded-lg shadow-lg w-full relative"
        style={{ maxWidth, height }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// OutsideDismissDialog.propTypes = {
//   open: PropTypes.bool.isRequired,
//   onOpenChange: PropTypes.func.isRequired,
//   children: PropTypes.node.isRequired,
//   maxWidth: PropTypes.string,
//   height: PropTypes.string,
// };

export const DialogTrigger = ({ // @ts-ignore
  children, onClick }) => {
  const dispatch = useAppDispatch();

  return cloneElement(children, {
    onClick: () => dispatch(onClick(true)),
  });
};

// DialogTrigger.propTypes = {
//   children: PropTypes.element.isRequired,
//   onClick: PropTypes.func.isRequired,
// };

export const DialogContent = ({ // @ts-ignore
  children, className }) => (
  <div className={`dialog-content ${className}`}>{children}</div>
);

// DialogContent.propTypes = {
//   children: PropTypes.node.isRequired,
//   className: PropTypes.string.isRequired,
// };

export const DialogHeader = ({ // @ts-ignore
  children }) => (
  <div className="dialog-header mb-4 p-6 pb-0 flex flex-col gap-2">{children}</div>
);

// DialogHeader.propTypes = {
//   children: PropTypes.node,
// };

export const DialogTitle = ({ // @ts-ignore
  children }) => (
  <h2 className="text-xl font-medium">{children}</h2>
);

// DialogTitle.propTypes = {
//   children: PropTypes.string.isRequired,
// };

export const DialogSubTitle = ({ // @ts-ignore
  children }) => (
  <p className="text-sm text-text-placeholder">{children}</p>
);

// DialogSubTitle.propTypes = {
//   children: PropTypes.string.isRequired,
// };
