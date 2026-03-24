import AdminLayout from '@/components/admin/AdminLayout'
import ManagerHolidays from '@/pages/manager/Holidays'

export default function AdminHolidays() {
  return (
    <AdminLayout>
      <ManagerHolidays embedded useAdminScope />
    </AdminLayout>
  )
}
