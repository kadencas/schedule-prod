import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ClientDashboard from "./ClientDashboard";

/**
 * Server-rendered DashboardPage component:
 * 1. Retrieves the current user session; redirects to the sign-in page if none is found.
 * 2. If authenticated, fetches the company name from an internal API.
 * 3. Renders the client-side dashboard, passing company and user name as props.
 *
 * @returns The main ClientDashboard component with personalized data.
 */

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/account-management/signin");

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/company`, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const { name: companyName } = await res.json();

  return (
    <ClientDashboard
      userName={session.user?.name || "Employee"}
      companyName={companyName}
    />
  );
}