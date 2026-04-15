import type { Metadata } from "next";
import Counseling from "@connect/pages/Counseling";

export const metadata: Metadata = {
  title: "Consejería",
};

export default function CounselingPage() {
  return <Counseling />;
}
