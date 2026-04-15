import type { Metadata } from "next";
import { HeroSection } from "./_components/hero-section";

export const metadata: Metadata = {
  title: "Fort Worth TX DAO — Digital Sovereignty is Mission Critical",
};

export default function LandingPage() {
  return <HeroSection />;
}
