import type { Metadata } from "next";
import CentivApp from "@/components/CentivApp";

export const metadata: Metadata = {
  title: "Centiv workspace — approve a cap, ask, watch every paid call",
};

export default function Workspace() {
  return <CentivApp />;
}
