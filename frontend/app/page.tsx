import { redirect } from "next/navigation";

export default function Home() {
  // Day 1 approach: redirect to the first pipeline step (/upload) rather than
  // showing a landing card, per design.md's "choose whichever is simpler" allowance.
  redirect("/upload");
}
