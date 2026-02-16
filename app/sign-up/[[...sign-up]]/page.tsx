// import { SignUp } from "@clerk/nextjs";
// import { auth } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";

// export default async function Page() {
//   // SERVER CHECK: If already logged in, go to dashboard immediately.
//   const { userId } = await auth();
//   if (userId) {
//     redirect("/dashboard");
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
//       <SignUp 
//         routing="path"
//         path="/sign-up"
//         signInUrl="/sign-in"
//         forceRedirectUrl="/dashboard"
//         appearance={{
//             elements: {
//                 formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
//                 card: 'shadow-2xl rounded-[32px] border border-gray-100',
//                 headerTitle: 'text-gray-900 font-bold',
//                 headerSubtitle: 'text-gray-500',
//                 socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50 text-gray-600',
//                 formFieldInput: 'rounded-xl border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500',
//                 footerActionLink: 'text-indigo-600 hover:text-indigo-700'
//             }
//         }}
//       />
//     </div>
//   );
// }

import { redirect } from "next/navigation";

export default function Page() {
  // DISABLE SIGN UP: Redirect to Sign In
  redirect("/sign-in");
}