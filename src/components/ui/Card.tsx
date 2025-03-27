"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  type?: "gradient" | "component";
}

export function Card({
  children,
  className = "",
  type = "component",
}: CardProps) {
  const baseClass = type === "gradient" ? "gradient-card" : "component-card";

  return <div className={`${baseClass} ${className}`}>{children}</div>;
}

interface CardSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CardSection({
  title,
  icon,
  children,
  className = "",
}: CardSectionProps) {
  return (
    <div className={`component-card ${className}`}>
      <h3 className="subsection-title">
        {icon}
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
