export function Hero() {
  return (
    <div className="flex flex-col gap-12 items-center py-10">
      <div className="flex items-center justify-center bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold tracking-wide uppercase">
        🏟️ Nền tảng ghép sân cầu lông số 1 Việt Nam
      </div>
      <h1 className="text-4xl lg:text-6xl font-black text-center text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
        Kết nối đam mê,<br/> <span className="text-emerald-600 italic">Lên sân rực rỡ</span>
      </h1>
      <p className="text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 text-center max-w-2xl leading-relaxed">
        Tìm kiếm trận đấu, ghép sân linh hoạt và quản lý ví ảo thông minh. 
        Tham gia ngay cộng đồng cầu lông sôi động nhất.
      </p>
      <div className="w-full max-w-lg p-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent my-4" />
    </div>
  );
}
