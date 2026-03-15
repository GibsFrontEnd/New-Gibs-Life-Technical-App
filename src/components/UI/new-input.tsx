import * as React from "react";
import { MdOutlineSearch } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { cn } from "../../utils/class-names";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full px-3 py-2 rounded-md border bg-white outline-none focus:outline-none focus:border-primary-blue disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

interface SearchProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  searchClassName?: string;
}

const Search: React.FC<SearchProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  searchClassName = "",
  ...props
}) => {
  // ✅ Ensure value is never undefined
  const inputValue = value || '';
  
  return (
    <div className={cn("relative", className)}>
      <MdOutlineSearch
        className="absolute left-2.5 top-[50%] -translate-y-1/2"
        size={24}
      />
      <input
        type="text"
        value={inputValue}  // ✅ Always has a value
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-full pl-10 py-2 rounded-md bg-neutral-placeholderBg placeholder-neutral-mediumGray",
          searchClassName
        )}
        {...props}
      />
    </div>
  );
};

interface PasswordProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  searchClassName?: string;
}

const Password: React.FC<PasswordProps> = ({
  value,
  onChange,
  className = "",
  error = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // ✅ Ensure value is never undefined
  const inputValue = value || '';

  return (
    <div className="relative w-full h-max">
      <input
        required
        className={`w-full px-3 py-2 rounded-md bg-neutral-softWhite border border-neutral-lightGray placeholder:text-neutral-mediumGray focus:border-primary-vividBlue ${className} ${
          error ? "border-primary-brightRed" : "border-neutral-lightGray"
        }`}
        type={showPassword ? "text" : "password"}
        value={inputValue}  // ✅ Always has a value
        onChange={onChange}
        {...props}
      />
      <div
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${
          error && "translate-y-[calc(-50%_-_12px)]"
        }`}
        onClick={togglePasswordVisibility}
      >
        {!showPassword ? (
          <FiEye size={25} color="gray" />
        ) : (
          <FiEyeOff size={25} color="gray" />
        )}
      </div>
      {error && <p className="text-sm text-primary-brightRed mt-1">{error}</p>}
    </div>
  );
};

export { Input, Search, Password };