import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props
});

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z"/><path d="m9.3 12 1.8 1.8 3.8-4"/></svg>
);

export const CartIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
);

export const ActivityIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>
);

export const SlidersIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h7M15 18h5"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg>
);

export const SparklesIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z"/><path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z"/><path d="m6 14 .8 2.2L9 17l-2.2.8L6 20l-.8-2.2L3 17l2.2-.8L6 14Z"/></svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="m5 12 4 4L19 6"/></svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="m6 6 12 12M18 6 6 18"/></svg>
);

export const LockIcon = (props: IconProps) => (
  <svg {...base(props)}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
);

export const BotIcon = (props: IconProps) => (
  <svg {...base(props)}><rect x="4" y="7" width="16" height="12" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M9 16h6"/></svg>
);

export const UserIcon = (props: IconProps) => (
  <svg {...base(props)}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
);

export const ArrowIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>
);

export const RotateIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M20 7v5h-5"/><path d="M18.5 15a7 7 0 1 1 0-7.5L20 9"/></svg>
);

export const ChevronIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="m9 18 6-6-6-6"/></svg>
);
