"use client";

interface InputProps {
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  min?: string | number;
  max?: string | number;
  className?: string;
  label?: string;
  hint?: string;
}

export function Input({
  type = "text",
  value,
  onChange,
  placeholder = "",
  id,
  name,
  min,
  max,
  className = "",
  label,
  hint,
}: InputProps) {
  return (
    <div className="form-group">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        id={id}
        name={name}
        min={min?.toString()}
        max={max?.toString()}
        className={`form-input ${className}`}
      />
      {hint && (
        <p className="text-xs text-gray-400 mt-2 bg-dark-100 p-1.5 rounded italic">
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  id?: string;
  name?: string;
  className?: string;
  label?: string;
  hint?: string;
}

export function Select({
  value,
  onChange,
  options,
  id,
  name,
  className = "",
  label,
  hint,
}: SelectProps) {
  return (
    <div className="form-group">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        id={id}
        name={name}
        className={`form-select ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="text-xs text-gray-400 mt-2 bg-dark-100 p-1.5 rounded italic">
          {hint}
        </p>
      )}
    </div>
  );
}
