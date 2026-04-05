import type { Metadata } from "next";
import MyNotes from "@connect/pages/MyNotes";

export const metadata: Metadata = {
  title: "Mis Notas",
};

export default function MyNotesPage() {
  return <MyNotes />;
}
