"use client";

interface AlertProps {
  message: string;
  title?: string;
  type: "success" | "error" | "info";
  className?: string;
}

export function Alert({
  message,
  title,
  type = "info",
  className = "",
}: AlertProps) {
  let alertClass = "";
  let defaultTitle = "";
  let Icon = null;

  if (type === "success") {
    alertClass = "success-alert";
    defaultTitle = "Thành công";
    Icon = (
      <svg
        className="h-6 w-6 text-green-400 mr-4"
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
    );
  } else if (type === "error") {
    alertClass = "error-alert";
    defaultTitle = "Lỗi";
    Icon = (
      <svg
        className="h-6 w-6 text-red-400 mr-4"
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
    );
  } else {
    alertClass = "info-alert";
    defaultTitle = "Thông tin";
    Icon = (
      <svg
        className="h-6 w-6 text-blue-400 mr-4"
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
    );
  }

  return (
    <div className={`${alertClass} ${className}`}>
      <div className="flex">
        <div className="py-1 mr-2">{Icon}</div>
        <div>
          <p className="font-bold">{title || defaultTitle}</p>
          <p
            className={`text-sm ${
              type === "success"
                ? "text-green-300"
                : type === "error"
                ? "text-red-300"
                : "text-blue-300"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
