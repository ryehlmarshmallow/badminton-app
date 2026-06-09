import { getOwnerCourts } from "@/lib/actions";
import { RegisterCourtDialog, Court } from "@/components/register-court-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Phone, Clock, Dumbbell, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourtsPage() {
  const courts = await getOwnerCourts() as unknown as Court[];

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Store className="h-6 w-6 text-emerald-600" />
            Quản lý sân cầu lông
          </h2>
          <p className="text-sm text-zinc-500">
            Đăng ký và quản lý các sân cầu lông của bạn.
          </p>
        </div>
        <div>
          <RegisterCourtDialog />
        </div>
      </div>

      {/* Courts List */}
      {courts.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
            <Store className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Chưa có sân nào được đăng ký</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-1 mx-auto">
              Đăng ký sân cầu lông của bạn ngay hôm nay để người dùng có thể đặt lịch hẹn và tham gia thi đấu.
            </p>
          </div>
          <RegisterCourtDialog />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courts.map((court: Court) => {
            const workingHoursStr = `${court.working_start.toString().padStart(2, "0")}:00 - ${court.working_end.toString().padStart(2, "0")}:00`;
            
            return (
              <Card key={court.id} className="border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow relative overflow-hidden bg-white dark:bg-zinc-900">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        <Store className="h-5 w-5 text-emerald-500 shrink-0" />
                        {court.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Dumbbell className="h-3.5 w-3.5 text-zinc-400" />
                        Quy mô: {court.num_fields} sân nhỏ (Fields)
                      </CardDescription>
                    </div>
                    
                    {/* Edit Dialog Trigger */}
                    <RegisterCourtDialog
                      court={court}
                      trigger={
                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold gap-1">
                          <Edit className="h-3.5 w-3.5" />
                          Chỉnh sửa
                        </Button>
                      }
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 pt-0 text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300">
                    <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{court.address}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <Phone className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>{court.phone}</span>
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Giờ hoạt động: <strong>{workingHoursStr}</strong></span>
                  </div>

                  {/* Extra pricing note */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                    <span>Lịch trình & bảng giá đã được cấu hình hoạt động.</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
