// Các biểu tượng (icon) thường dùng trong các components
export const Icons = {
  User: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),

  Market: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),

  Bolt: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),

  Settings: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),

  Info: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),

  Check: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),

  X: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),

  ChevronDown: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),

  Refresh: (props: { className?: string }) => (
    <svg
      className={props.className || "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),

  Checkmark: (props: { className?: string }) => (
    <svg
      className={props.className || "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4"
      />
    </svg>
  ),

  Spinner: (props: { className?: string }) => (
    <svg
      className={`animate-spin ${props.className || "h-5 w-5"}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  ),
};

// Components cho alerts
export const Alerts = {
  Success: ({
    message,
    title = "Thành công",
  }: {
    message: string;
    title?: string;
  }) => (
    <div className="success-alert">
      <div className="flex">
        <div className="py-1 mr-2">
          <Icons.Check className="h-6 w-6 text-green-400 mr-4" />
        </div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-green-300">{message}</p>
        </div>
      </div>
    </div>
  ),

  Error: ({ message, title = "Lỗi" }: { message: string; title?: string }) => (
    <div className="error-alert">
      <div className="flex">
        <div className="py-1 mr-2">
          <Icons.X className="h-6 w-6 text-red-400 mr-4" />
        </div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-red-300">{message}</p>
        </div>
      </div>
    </div>
  ),

  Info: ({
    message,
    title = "Thông tin",
  }: {
    message: string;
    title?: string;
  }) => (
    <div className="info-alert">
      <div className="flex">
        <div className="py-1 mr-2">
          <Icons.Info className="h-6 w-6 text-blue-400 mr-4" />
        </div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-blue-300">{message}</p>
        </div>
      </div>
    </div>
  ),
};

// Components cho buttons
export const Buttons = {
  Primary: ({
    children,
    onClick,
    disabled = false,
    className = "",
    type = "button",
    icon,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
    icon?: React.ReactNode;
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  ),

  Success: ({
    children,
    onClick,
    disabled = false,
    className = "",
    type = "button",
    icon,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
    icon?: React.ReactNode;
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-success ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  ),

  Danger: ({
    children,
    onClick,
    disabled = false,
    className = "",
    type = "button",
    icon,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
    icon?: React.ReactNode;
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-danger ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  ),
};

// Loading indicator
export const LoadingSpinner = ({
  text = "Đang xử lý...",
}: {
  text?: string;
}) => (
  <>
    <Icons.Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
    <span>{text}</span>
  </>
);

// Section card styles
export const Cards = {
  Gradient: ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={`gradient-card ${className}`}>{children}</div>,

  Component: ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={`component-card ${className}`}>{children}</div>,

  Section: ({
    title,
    icon,
    children,
    className = "",
  }: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`component-card ${className}`}>
      <h3 className="subsection-title">
        {icon}
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  ),
};

// Form components
export const Form = {
  Group: ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={`form-group ${className}`}>{children}</div>,

  Label: ({
    children,
    htmlFor,
    className = "",
  }: {
    children: React.ReactNode;
    htmlFor?: string;
    className?: string;
  }) => (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-300 mb-2 ${className}`}
    >
      {children}
    </label>
  ),

  Input: ({
    type = "text",
    value,
    onChange,
    placeholder = "",
    id,
    name,
    min,
    max,
    className = "",
  }: {
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    id?: string;
    name?: string;
    min?: string | number;
    max?: string | number;
    className?: string;
  }) => (
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
  ),

  Select: ({
    value,
    onChange,
    options,
    id,
    name,
    className = "",
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    id?: string;
    name?: string;
    className?: string;
  }) => (
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
  ),

  Hint: ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <p
      className={`text-xs text-gray-400 mt-2 bg-dark-100 p-1.5 rounded italic ${className}`}
    >
      {children}
    </p>
  ),
};
