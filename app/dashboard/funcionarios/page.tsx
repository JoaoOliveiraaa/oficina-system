import { redirect } from "next/navigation"
import { getUserWithProfile } from "@/lib/get-user-with-profile"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EmployeeList } from "@/components/employee-list"

export default async function FuncionariosPage() {
  const { user, profile } = await getUserWithProfile()

  if (!user) {
    redirect("/auth/login")
  }

  // Only admins can access this page
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout userEmail={user.email!} userName={profile?.nome || undefined} userRole={profile?.role}>
      <div className="p-6 lg:p-8">
        <EmployeeList />
      </div>
    </DashboardLayout>
  )
}
