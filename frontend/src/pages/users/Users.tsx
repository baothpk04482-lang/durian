import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Building2,
  Sprout,
  Grid,
  Edit2,
  Trash2,
  Eye,
  Plus
} from "lucide-react";
import Toolbar from "../../components/common/Toolbar";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import DrawerForm from "../../components/common/DrawerForm";
import RecordDetailDrawer from "../../components/common/RecordDetailDrawer";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import { userService } from "../../services/user.service";
import { companyService } from "../../services/company.service";
import type { User } from "../../types/user";
import type { Company } from "../../types/company";
import { formatDateTime } from "../../utils/dateFormatter";
import { vi, ROLE_VI, USER_STATUS_VI } from "../../utils/translate";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedCompanyId, setSelectedCompanyId] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    user_code: "",
    full_name: "",
    email: "",
    password: "",
    role: "Inspector",
    company_id: "",
    status: "Active",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<User | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    userService.get<User[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as User[];
        setUsers(arr);
        setTotalUsers((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết người dùng.";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, searchQuery]);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: perPage,
      };

      Promise.allSettled([
        userService.get<User[] & { total?: number; total_pages?: number }>({ params }),
        companyService.get(),
      ])
        .then(([usersResult, companiesResult]) => {
          if (usersResult.status === "fulfilled") {
            const usersData = usersResult.value;
            const arr = usersData as unknown as User[];
            setUsers(arr);
            setTotalUsers((usersData as any).total ?? arr.length);
            setTotalPages((usersData as any).total_pages ?? Math.ceil(((usersData as any).total ?? arr.length) / perPage));
          } else {
            const msg = usersResult.reason instanceof Error ? usersResult.reason.message : "Không thể tải chi tiết người dùng.";
            setError(msg);
          }
          if (companiesResult.status === "fulfilled") {
            setCompanies(companiesResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchUsers();
  }, [currentPage, searchQuery, fetchUsers]);

  const getCompanyName = (id: string) => {
    const company = companies.find((c) => c._id === id || c.company_code === id);
    return company ? company.company_name : id;
  };

  const getRoleLabel = (role: string) => {
    return vi(ROLE_VI, role) || role;
  };

  const getRoleChipVariant = (role: string): "Success" | "Warning" | "Resolved" | "Info" | "Pending" => {
    switch (role) {
      case "Admin":
        return "Success";
      case "Inspector":
        return "Warning";
      case "Company Manager":
        return "Resolved";
      case "Farm Manager":
        return "Info";
      case "Technician":
      default:
        return "Pending";
    }
  };

  const handleAddClick = () => {
    setCurrentUser(null);
    setFormData({
      user_code: "",
      full_name: "",
      email: "",
      password: "",
      role: "Inspector",
      company_id: companies[0]?._id || "",
      status: "Active",
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setFormData({
      user_code: user.user_code || "",
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
      company_id: user.company_id || "",
      status: user.status || "Active",
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (user: User) => {
    setDetailRecord(user);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      role: formData.role,
      company_id: formData.company_id || undefined,
      status: formData.status,
      ...(formData.password ? { password: formData.password } : {}),
    };

    try {
      if (currentUser) {
        await userService.put(currentUser._id, payload);
      } else {
        await userService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu người dùng.";
      alert(msg);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedUserId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUserId) {
      try {
        await userService.delete(selectedUserId);
        fetchUsers();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa người dùng.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedUserId(null);
      }
    }
  };

  const roles = ["All", ...Array.from(new Set(users.map((u) => u.role).filter(Boolean)))];
  const statuses = ["All", ...Array.from(new Set(users.map((u) => u.status || "Active").filter(Boolean)))];
  const statusLabels: Record<string, string> = {
    All: "Tất cả",
    ...USER_STATUS_VI,
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === "All" || u.role === selectedRole;
    const matchesCompany = selectedCompanyId === "All" || u.company_id === selectedCompanyId;
    const matchesStatus = selectedStatus === "All" || (u.status || "Active") === selectedStatus;
    return matchesRole && matchesCompany && matchesStatus;
  });

  const totalAdmins = users.filter((u) => u.role === "Admin").length;
  const totalInspectors = users.filter((u) => u.role === "Inspector").length;
  const totalManagers = users.filter((u) => u.role === "Company Manager" || u.role === "Farm Manager").length;

  const columns = [
    { key: "user_code", label: "Mã người dùng", width: "120px" },
    { key: "full_name", label: "Họ và tên", width: "1fr" },
    { key: "email", label: "Email", width: "1fr" },
    { key: "role", label: "Vai trò", width: "160px" },
    { key: "company_id", label: "Công ty", width: "1fr" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  const tableRows = filteredUsers.map((row) => ({
    user_code: <span className="font-semibold text-gray-900">{row.user_code || "N/A"}</span>,
    full_name: <span className="text-gray-700 font-semibold">{row.full_name}</span>,
    email: <span className="text-gray-600">{row.email}</span>,
    role: (
      <StatusChip
        label={row.role}
        variant={getRoleChipVariant(row.role)}
      />
    ),
    company_id: <span className="text-gray-600 font-semibold">{getCompanyName(row.company_id || "")}</span>,
    created_at: <span className="text-gray-500">{formatDateTime(row.created_at)}</span>,
    actions: (
      <div className="flex items-center justify-end gap-2 pr-6">
        <button
          onClick={() => handleViewClick(row)}
          type="button"
          title="Xem"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEditClick(row)}
          type="button"
          aria-label="Chỉnh sửa người dùng"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Xóa người dùng"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
          title="Xóa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  }));

  const drawerFooter = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={() => setIsDrawerOpen(false)}
        type="button"
        className="px-4 py-2 border border-gray-200 rounded-[12px] text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-all"
      >
        Hủy
      </button>
      <button
        onClick={handleSave}
        type="button"
        className="px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-[14px] font-semibold hover:bg-emerald-700 transition-all"
      >
        Lưu
      </button>
    </div>
  );

  const emptyState = error ? (
    <div className="text-red-600 text-sm font-semibold py-6 text-center">
      {error}. Vui lòng thử lại sau.
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col h-full space-y-4">
      <Toolbar
        title="Người dùng"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm người dùng..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Thêm người dùng</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Công ty:</span>
          <select value={selectedCompanyId} onChange={(e) => { setSelectedCompanyId(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo công ty" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">Tất cả</option>
            {companies.map((c) => (<option key={c._id} value={c._id}>{c.company_name}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Vai trò:</span>
          <select value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo vai trò" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Trạng thái:</span>
          <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo trạng thái" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {statuses.map((s) => (<option key={s} value={s}>{statusLabels[s] || s}</option>))}
          </select>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Tổng người dùng" value={loading ? "..." : totalUsers} icon={Users} />
        <StatCard compact title="Tổng quản trị viên" value={loading ? "..." : totalAdmins} icon={Building2} color="text-blue-600" />
        <StatCard compact title="Tổng kiểm tra viên" value={loading ? "..." : totalInspectors} icon={Sprout} color="text-amber-600" />
        <StatCard compact title="Tổng quản lý" value={loading ? "..." : totalManagers} icon={Grid} color="text-indigo-600" />
      </div>

      <DataTable
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyState={emptyState}
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={totalUsers}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      <DrawerForm
        title={drawerMode === "edit" ? "Sửa người dùng" : "Thêm người dùng"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {currentUser && (
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Mã người dùng
              </label>
              <input
                type="text"
                value={formData.user_code}
                disabled
                aria-label="Mã người dùng"
                className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] cursor-not-allowed focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="VD: Nguyễn Văn A"
              aria-label="Họ và tên"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
             
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Địa chỉ email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="VD: nguyen.van@durian.ai"
              aria-label="Địa chỉ email"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
             
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mật khẩu {currentUser && <span className="text-gray-400 font-normal">(Để trống để giữ nguyên)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              aria-label="Mật khẩu"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
             
              required={!currentUser}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Công ty
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              aria-label="Công ty"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
             
            >
              <option value="">Không có công ty</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Vai trò
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              aria-label="Vai trò"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
             
              required
            >
              <option value="Admin">Quản trị viên</option>
              <option value="Company Manager">Quản lý công ty</option>
              <option value="Farm Manager">Quản lý trang trại</option>
              <option value="Inspector">Kiểm tra viên</option>
              <option value="Technician">Kỹ thuật viên</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              aria-label="Trạng thái"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
             
              required
            >
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Ngừng hoạt động</option>
            </select>
          </div>
        </form>
      </DrawerForm>

      <RecordDetailDrawer
        title="Chi tiết người dùng"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord
            ? [
                {
                  title: "Thông tin người dùng",
                  fields: [
                    { label: "Mã người dùng", value: detailRecord.user_code || "—" },
                    { label: "Họ tên", value: detailRecord.full_name },
                    { label: "Email", value: detailRecord.email },
                  ],
                },
                {
                  title: "Phân quyền",
                  fields: [
                    { label: "Vai trò", value: getRoleLabel(detailRecord.role) },
                  ],
                },
                ...(detailRecord.company_id
                  ? [
                      {
                        title: "Thuộc tổ chức",
                        fields: [
                          { label: "Công ty", value: getCompanyName(detailRecord.company_id) },
                        ],
                      },
                    ]
                  : []),
                {
                  title: "Thời gian",
                  fields: [
                    { label: "Ngày tạo", value: formatDateTime(detailRecord.created_at) },
                    ...((detailRecord as any).updated_at
                      ? [{ label: "Ngày cập nhật", value: formatDateTime((detailRecord as any).updated_at) }]
                      : []),
                  ],
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        title="Xóa người dùng"
        description="Bạn có chắc chắn muốn xóa người dùng này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
}
