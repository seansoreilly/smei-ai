import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home() {
  const guid = uuidv4();
  redirect(`/${guid}`);
}
