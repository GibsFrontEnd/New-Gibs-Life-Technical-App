import { createContext, useState, useContext, type ReactNode } from "react";
import { cn } from "../../utils/class-names";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

// Define types for the context
interface SelectContextType {
  value: any;
  onValueChange: (value: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Create context with initial value and type
const SelectContext = createContext<SelectContextType | undefined>(undefined);

// Select component props
interface SelectProps {
  value: any;
  onValueChange: (value: any) => void;
  children: ReactNode;
  width?: string;
}

export function Select({ value, onValueChange, children, width = "" }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        isOpen,
        setIsOpen,
      }}
    >
      <div className="relative" style={{ width }}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// SelectTrigger component props
interface SelectTriggerProps {
  children: ReactNode;
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectTrigger({ children, id, name, className, disabled }: SelectTriggerProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error("SelectTrigger must be used within a Select component");
  }

  const { isOpen, setIsOpen } = context;

  return (
    <button
      id={id}
      name={name}
      type="button"
      disabled={disabled}
      onClick={() => setIsOpen(!isOpen)}
      // className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      className={cn("flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50", className)}
    >
      {children}
      {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
    </button>
  );
}

// SelectValue component props
interface SelectValueProps {
  placeholder: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error("SelectValue must be used within a Select component");
  }

  const { value } = context;

  return (
    <span className="text-gray-700">
      {value || <span className="text-gray-400">{placeholder}</span>}
    </span>
  );
}

// SelectContent component props
interface SelectContentProps {
  children: ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error("SelectContent must be used within a Select component");
  }

  const { isOpen } = context;

  return (
    isOpen && (
      <div className="absolute left-0 z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg">
        {children}
      </div>
    )
  );
}

// SelectItem component props
interface SelectItemProps {
  value: any;
  children: ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error("SelectItem must be used within a Select component");
  }

  const { onValueChange, setIsOpen } = context;

  const handleSelect = () => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-[#155dfd]"
    >
      {children}
    </button>
  );
}