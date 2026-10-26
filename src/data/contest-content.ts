export interface NewsArticle {
  id: string;
  category: string;
  campus: string;
  title: string;
  excerpt: string;
  content: string[];
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  featured?: boolean;
}

export interface TimelinePhase {
  step: string;
  dateRange: string;
  title: string;
  description: string;
  status: "completed" | "live" | "upcoming";
  badge: string;
  iconKey: "file" | "vote" | "mic" | "trophy";
}

export interface VotingRuleItem {
  code: string;
  title: string;
  description: string;
  iconKey: "auth" | "limit" | "lock";
}

export const EVENT_TIMELINE: TimelinePhase[] = [
  {
    step: "01",
    dateRange: "01/10 — 15/10/2026",
    title: "Đề cử & Thẩm định Hồ sơ tại FPoly Đồng Nai",
    description:
      "Hơn 240 hồ sơ sinh viên xuất sắc từ các bộ môn Công nghệ Thông tin, Kinh tế & Thiết kế Đồ họa tại FPT Polytechnic Đồng Nai trải qua vòng xét duyệt học thuật & phong trào.",
    status: "completed",
    badge: "ĐÃ HOÀN THÀNH",
    iconKey: "file",
  },
  {
    step: "02",
    dateRange: "20/10 — 10/11/2026",
    title: "Mở cổng Bình chọn Trực tuyến Real-time",
    description:
      "Cộng đồng sinh viên, giảng viên và khán giả đăng nhập Google bình chọn tối đa 03 lượt/ngày. Điểm bình chọn chiếm 40% tổng điểm chung cuộc.",
    status: "live",
    badge: "ĐANG DIỄN RA",
    iconKey: "vote",
  },
  {
    step: "03",
    dateRange: "14/11/2026",
    title: "Vòng Thuyết trình Dự án & Bản lĩnh Ong Vàng",
    description:
      "Top 8 ứng viên bảo vệ dự án thực chiến và đối thoại trực tiếp cùng Hội đồng Giám khảo FPT Polytechnic Đồng Nai và đại diện doanh nghiệp đối tác.",
    status: "upcoming",
    badge: "SẮP TỚI",
    iconKey: "mic",
  },
  {
    step: "04",
    dateRange: "20/11/2026 • 19:00",
    title: "Đêm Gala Chung kết tại FPT Polytechnic Đồng Nai",
    description:
      "Đêm đại nhạc hội & lễ vinh danh Gương mặt Sinh viên Tiêu biểu 2026 diễn ra trực tiếp tại cơ sở FPT Polytechnic Đồng Nai (Biên Hòa, Đồng Nai).",
    status: "upcoming",
    badge: "GALA CHUNG KẾT",
    iconKey: "trophy",
  },
];

export const VOTING_RULES: VotingRuleItem[] = [
  {
    code: "QUY TẮC 01",
    title: "Xác thực Google OAuth 2.0",
    description:
      "Mọi tài khoản Google hợp lệ (@fpt.edu.vn của sinh viên/giảng viên FPoly hoặc @gmail.com cá nhân) đều có thể đăng nhập một chạm để bình chọn minh bạch.",
    iconKey: "auth",
  },
  {
    code: "QUY TẮC 02",
    title: "Giới hạn 03 Lượt Vote / Ngày",
    description:
      "Mỗi tài khoản sở hữu tối đa 03 lượt bình chọn trong một ngày dương lịch và tự động làm mới vào đúng 00:00:00 hàng đêm.",
    iconKey: "limit",
  },
  {
    code: "QUY TẮC 03",
    title: "Đồng bộ Real-time Chống Gian lận",
    description:
      "Hệ thống khóa giao dịch nguyên tử (ACID Transaction Lock) trên PostgreSQL loại bỏ hoàn toàn double-vote và cập nhật bảng xếp hạng tức thời.",
    iconKey: "lock",
  },
];

export const CAMPUS_NEWS: NewsArticle[] = [
  {
    id: "gala-stage-dong-nai",
    category: "TIÊU ĐIỂM CƠ SỞ",
    campus: "FPoly Đồng Nai",
    title:
      "Hé lộ sân khấu Đêm Gala Vinh danh Sinh viên Tiêu biểu FPT Polytechnic Đồng Nai 2026",
    excerpt:
      "Lấy cảm hứng từ sắc cam nhiệt huyết nhà F và tinh thần Thực học — Thực nghiệp, đêm chung kết tại cơ sở Đồng Nai hứa hẹn bùng nổ cảm xúc.",
    content: [
      "Phòng Công tác Sinh viên (PDP) cùng Ban Tổ chức FPT Polytechnic Đồng Nai vừa chính thức công bố phối cảnh sân khấu Đêm Gala Vinh danh Gương mặt Sinh viên Tiêu biểu 2026 tại TP. Biên Hòa, Đồng Nai.",
      "Điểm nhấn đặc biệt của đêm Gala năm nay là khoảnh khắc mở cổng 'Golden Minute' ngay trên sân khấu, nơi từng lượt bình chọn trực tuyến của sinh viên và khán giả sẽ cập nhật trực tiếp lên màn hình LED trung tâm theo thời gian thực.",
      "Bên cạnh phần tranh tài thuyết trình của Top 8 gương mặt Ong Vàng xuất sắc nhất cơ sở Đồng Nai, đêm hội còn quy tụ các tiết mục sôi động từ CLB Âm nhạc, CLB Nhảy hiện đại và CLB Truyền thông FPoly Đồng Nai.",
    ],
    publishedAt: "26/10/2026",
    readTime: "4 phút đọc",
    imageUrl: "/images/news/news-1.jpg",
    featured: true,
  },
  {
    id: "it-projects-dong-nai",
    category: "DỰ ÁN THỰC CHIẾN",
    campus: "Bộ môn CNTT",
    title:
      "Ứng viên khối Công nghệ Thông tin FPoly Đồng Nai ghi dấu ấn với loạt phần mềm chuyển đổi số địa phương",
    excerpt:
      "Không chỉ đạt danh hiệu Ong Vàng học tập, các thí sinh còn chinh phục doanh nghiệp bằng những sản phẩm phần mềm ứng dụng thực tế tại Đồng Nai.",
    content: [
      "Ngay trong tuần đầu mở cổng bình chọn trực tuyến, các thí sinh thuộc Bộ môn Công nghệ Thông tin FPT Polytechnic Đồng Nai đã tạo nên cuộc rượt đuổi thứ hạng đầy kịch tính trên bảng xếp hạng Real-time.",
      "Nhiều dự án xuất phát từ Xưởng thực hành dự án tại cơ sở Đồng Nai đã được doanh nghiệp đánh giá cao: từ nền tảng kết nối thực tập sinh khu công nghiệp Biên Hòa đến trợ lý AI hỗ trợ tra cứu học vụ nhanh cho tân sinh viên.",
      "Ban Giám khảo đánh giá dàn ứng viên năm nay thể hiện rõ bản lĩnh tự tin, kỹ năng làm việc nhóm và năng lực triển khai sản phẩm hoàn chỉnh ngay khi còn ngồi trên ghế giảng đường.",
    ],
    publishedAt: "25/10/2026",
    readTime: "3 phút đọc",
    imageUrl: "/images/news/news-2.jpg",
  },
  {
    id: "polytechnic-creative-wave",
    category: "ONG VÀNG SÁNG TẠO",
    campus: "Thiết kế & Kinh tế",
    title:
      "Tinh thần 'Thực học — Thực nghiệp': Sinh viên Thiết kế Đồ họa & Marketing FPoly Đồng Nai bứt phá",
    excerpt:
      "Những chú Ong Vàng tài năng mang đến sắc màu sáng tạo trẻ trung với bộ nhận diện văn hóa gốm Biên Hòa và chiến dịch truyền thông triệu view.",
    content: [
      "Đại diện cho sức trẻ năng động của Cao đẳng FPT Polytechnic cơ sở Đồng Nai, các ứng viên khối ngành Thiết kế Đồ họa, Digital Marketing và PR & Tổ chức Sự kiện đang nhận được sự cổ vũ nồng nhiệt từ thầy cô và bạn bè.",
      "Mỗi hồ sơ ứng viên đều gắn liền với những dự án thật, khách hàng thật và hoạt động thiện nguyện lan tỏa hình ảnh đẹp của sinh viên FPoly tại địa phương.",
    ],
    publishedAt: "24/10/2026",
    readTime: "3 phút đọc",
    imageUrl: "/images/news/news-3.jpg",
  },
  {
    id: "scholarship-prizes-2026",
    category: "GIẢI THƯỞNG",
    campus: "FPoly Đồng Nai",
    title:
      "Công bố cơ cấu giải thưởng, Cúp Ong Vàng Vinh Danh & Học bổng phát triển tài năng 2026",
    excerpt:
      "Top 3 chung cuộc sẽ nhận Cúp vinh danh, giấy khen Giám đốc Cơ sở, tiền thưởng cùng cơ hội thực tập đặc cách tại các doanh nghiệp đối tác lớn.",
    content: [
      "Nhằm khích lệ tinh thần học tập, rèn luyện và cống hiến phong trào sinh viên tại FPT Polytechnic Đồng Nai, Ban Tổ chức công bố gói giải thưởng hấp dẫn dành cho Quán quân, hai Á quân và Giải Thí sinh được yêu thích nhất.",
      "Bên cạnh hiện kim và Cúp lưu niệm, các gương mặt tiêu biểu sẽ trở thành Đại sứ Truyền thông Sinh viên FPT Polytechnic Đồng Nai trong các sự kiện tuyển sinh và kết nối doanh nghiệp năm 2027.",
    ],
    publishedAt: "22/10/2026",
    readTime: "2 phút đọc",
    imageUrl: "/images/news/news-4.jpg",
  },
];

export const SPONSORS: Array<{
  name: string;
  role: string;
  iconKey: "school" | "graduation" | "briefcase" | "code" | "wifi" | "newspaper";
}> = [
  {
    name: "FPoly Đồng Nai",
    role: "Đơn vị Tổ chức",
    iconKey: "school",
  },
  {
    name: "FPT Education",
    role: "Hệ thống Giáo dục",
    iconKey: "graduation",
  },
  {
    name: "PDP Đồng Nai",
    role: "Phòng Công tác SV",
    iconKey: "briefcase",
  },
  {
    name: "FPT Software",
    role: "Đối tác Doanh nghiệp",
    iconKey: "code",
  },
  {
    name: "FPT Telecom",
    role: "Đối tác Hạ tầng Số",
    iconKey: "wifi",
  },
  {
    name: "CLB Truyền Thông",
    role: "Bảo trợ Truyền thông",
    iconKey: "newspaper",
  },
];
