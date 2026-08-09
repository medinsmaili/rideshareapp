import { Users, Route, BookOpen, Car, Flag, MapPin, ShieldCheck, Loader2, GraduationCap } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useRides, useCities, useBookings, useVehicles, useUsers, useReports } from "@/lib/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

export default function DashboardPage() {
  const { data: usersData, isLoading: ul } = useUsers();
  const { data: ridesData, isLoading: rl } = useRides();
  const { data: citiesData, isLoading: cl } = useCities();
  const { data: bookingsData, isLoading: bl } = useBookings();
  const { data: vehiclesData, isLoading: vl } = useVehicles();
  const { data: reportsData, isLoading: rpl } = useReports();

  const users = extractArray(usersData);
  const rides = extractArray(ridesData);
  const cities = extractArray(citiesData);
  const bookings = extractArray(bookingsData);
  const vehicles = extractArray(vehiclesData);
  const reports = extractArray(reportsData);

  const isLoading = ul || rl || cl || bl || vl || rpl;
  const activeRides = rides.filter((r: any) => r.status === "active").length;
  const pendingReports = reports.filter((r: any) => r.status === "pending").length;
  const verifiedDrivers = users.filter((u: any) => u.is_verified_driver).length;
  const verifiedStudents = users.filter((u: any) => u.is_student_verified).length;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of the NISU ridesharing platform" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={users.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Active Rides" value={activeRides} icon={<Route className="h-5 w-5" />} description={`${rides.length} total`} />
        <StatCard title="Bookings" value={bookings.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Pending Reports" value={pendingReports} icon={<Flag className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Vehicles" value={vehicles.length} icon={<Car className="h-5 w-5" />} />
        <StatCard title="Cities" value={cities.length} icon={<MapPin className="h-5 w-5" />} />
        <StatCard title="Verified Drivers" value={verifiedDrivers} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard title="Verified Students" value={verifiedStudents} icon={<GraduationCap className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Recent Rides</h2></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.slice(0, 5).map((ride: any) => (
                <TableRow key={ride.id}>
                  <TableCell className="text-sm">
                    {ride.origin_city?.name || ride.originCity?.name || "?"} → {ride.destination_city?.name || ride.destinationCity?.name || "?"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ride.driver ? `${ride.driver.first_name} ${ride.driver.last_name}` : ride.driver_name || "—"}
                  </TableCell>
                  <TableCell><StatusBadge status={ride.status} /></TableCell>
                </TableRow>
              ))}
              {rides.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No rides yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b"><h2 className="font-semibold">Pending Reports</h2></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Reported User</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.filter((r: any) => r.status === 'pending').length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No pending reports</TableCell></TableRow>
              ) : reports.filter((r: any) => r.status === 'pending').slice(0, 5).map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell className="text-sm">{report.reason}</TableCell>
                  <TableCell className="text-sm">
                    {report.reportedUser ? `${report.reportedUser.first_name} ${report.reportedUser.last_name}` : report.reported_user_name || "—"}
                  </TableCell>
                  <TableCell><StatusBadge status={report.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
