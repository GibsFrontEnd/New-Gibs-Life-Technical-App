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
      // className="flex items-center justify-between w-full px-4 py-2 border rounded bg-white"
      className={cn("flex items-center justify-between w-full px-4 py-2 border rounded bg-white", className)}
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
      <div className="absolute text-sm left-0 z-50 mt-2 w-full bg-white border rounded shadow">
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
      className="block w-full px-4 py-2 text-left hover:bg-gray-100"
    >
      {children}
    </button>
  );
}