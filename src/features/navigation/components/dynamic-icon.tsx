import React from "react";
import {
  LayoutDashboard,
  Map,
  Building2,
  Hospital,
  ClipboardCheck,
  Stethoscope,
  Activity,
  PackageCheck,
  Users,
  ShieldCheck,
  FileBarChart,
  BarChart3,
  UploadCloud,
  Settings,
  HelpCircle,
  LucideProps,
} from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  switch (name) {
    case "LayoutDashboard":
      return <LayoutDashboard {...props} />;
    case "Map":
      return <Map {...props} />;
    case "Building2":
      return <Building2 {...props} />;
    case "Hospital":
      return <Hospital {...props} />;
    case "ClipboardCheck":
      return <ClipboardCheck {...props} />;
    case "Stethoscope":
      return <Stethoscope {...props} />;
    case "Activity":
      return <Activity {...props} />;
    case "PackageCheck":
      return <PackageCheck {...props} />;
    case "Users":
      return <Users {...props} />;
    case "ShieldCheck":
      return <ShieldCheck {...props} />;
    case "FileBarChart":
      return <FileBarChart {...props} />;
    case "BarChart3":
      return <BarChart3 {...props} />;
    case "UploadCloud":
      return <UploadCloud {...props} />;
    case "Settings":
      return <Settings {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
}
