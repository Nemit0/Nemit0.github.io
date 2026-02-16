import { redirect } from "next/navigation";
import { defaultLanguage } from "@/lib/i18n";

export default function Home() {
  redirect(`/${defaultLanguage}`);
}
