import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicOps AI Control Plane",
  description: "Synthetic healthcare AI operations control plane for FHIR workflows, reliability, governance, and automation ROI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
