export const ACTION_VI: Record<string, string> = {
  "Treatment Applied": "Đã xử lý",
  Pruning: "Cắt tỉa",
  "Pruning and Fungicide": "Cắt tỉa + Phun thuốc",
  "Chemical Injection": "Tiêm thuốc",
  "Fungicide Spray": "Phun thuốc diệt nấm",
};

export const STATUS_VI: Record<string, string> = {
  Healthy: "Khỏe mạnh",
  Monitoring: "Đang theo dõi",
  Diseased: "Bị bệnh",
};

export const SEVERITY_VI: Record<string, string> = {
  Mild: "Nhẹ",
  Moderate: "Trung bình",
  Severe: "Nghiêm trọng",
  Critical: "Rất nghiêm trọng",
  None: "Không",
};

export const CATEGORY_VI: Record<string, string> = {
  Fungal: "Nấm",
  Bacterial: "Vi khuẩn",
  "Insect Pest": "Sâu hại",
  None: "Không xác định",
};

export const PART_VI: Record<string, string> = {
  leaf: "Lá",
  stem: "Thân",
  fruit: "Trái",
  root: "Rễ",
  flower: "Hoa",
};

export const PRIORITY_VI: Record<string, string> = {
  Critical: "Khẩn cấp",
  High: "Cao",
  Medium: "Trung bình",
  Low: "Thấp",
};

export const ALERT_STATUS_VI: Record<string, string> = {
  unread: "Chưa đọc",
  read: "Đã đọc",
  archived: "Lưu trữ",
};

export const ROLE_VI: Record<string, string> = {
  Admin: "Quản trị viên",
  "Company Manager": "Quản lý công ty",
  "Farm Manager": "Quản lý trang trại",
  Inspector: "Kiểm tra viên",
  Technician: "Kỹ thuật viên",
};

export const ALERT_TYPE_VI: Record<string, string> = {
  "Leaf Spot": "Đốm lá",
  "Root Rot": "Thối rễ",
  "Powdery Mildew": "Bệnh phấn trắng",
  Anthracnose: "Bệnh thán thư",
  Phytophthora: "Nấm Phytophthora",
  Healthy: "Khỏe mạnh",
  "Fruit Borer": "Sâu đục quả",
  "Algae Spot": "Đốm tảo",
  "Stem Rot": "Thối thân",
  Canker: "Loét thân",
  Mealybug: "Rệp sáp",
  "Nutrient Deficiency": "Thiếu dinh dưỡng",
  "Disease outbreak": "Bùng phát dịch bệnh",
  "Climate warning": "Cảnh báo thời tiết",
  "System notice": "Thông báo hệ thống",
  Notification: "Thông báo",
};

export const DISEASE_VI: Record<string, string> = {
  Healthy: "Khỏe mạnh",
  "Leaf Spot": "Đốm lá",
  "Root Rot": "Thối rễ",
  "Fruit Borer": "Sâu đục quả",
  "Powdery Mildew": "Phấn trắng",
  Anthracnose: "Thán thư",
  Phytophthora: "Bệnh Phytophthora",
  "Algae Spot": "Đốm tảo",
  "Nutrient Deficiency": "Thiếu dinh dưỡng",
  "Sooty Mold": "Muội đen",
  "Stem Rot": "Thối thân",
  "Fruit Rot": "Thối quả",
  Canker: "Loét thân",
  "Leaf Blight": "Héo lá",
};

export const USER_STATUS_VI: Record<string, string> = {
  Active: "Hoạt động",
  Inactive: "Ngừng hoạt động",
};

export const INSPECTION_STATUS_VI: Record<string, string> = {
  completed: "Hoàn thành",
  in_progress: "Đang xử lý",
  "in progress": "Đang xử lý",
  pending: "Chờ xử lý",
  cancelled: "Đã hủy",
  confirmed: "Đã xác nhận",
};

export const vi = (
  map: Record<string, string>,
  value?: string | null
): string => {
  if (!value) return "";
  return map[value] ?? value;
};
