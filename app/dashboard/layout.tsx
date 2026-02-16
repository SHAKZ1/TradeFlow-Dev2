import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ClientLayout from "./ClientLayout"; 

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    redirect("/sign-in");
  }

  // Self-Healing Sync
  const email = clerkUser.emailAddresses[0].emailAddress;
  const user = await db.user.upsert({
    where: { id: userId },
    update: {}, 
    create: {
        id: userId,
        email: email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
    }
  });

  const isConnected = !!user?.ghlLocationId;

  // PASS BRANDING DATA
  return (
    <ClientLayout 
        isConnected={isConnected}
        companyLogo={user.companyLogoUrl}
        companyBanner={user.companyBannerUrl}
    >
      {children}
    </ClientLayout>
  );
}