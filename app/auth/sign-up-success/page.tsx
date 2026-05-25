import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Cảm ơn bạn đã đăng ký!
              </CardTitle>
              <CardDescription>Vui lòng kiểm tra email của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tài khoản của bạn đã được tạo thành công. Vui lòng kiểm tra hộp thư đến (và thư rác) để xác nhận tài khoản trước khi đăng nhập.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
