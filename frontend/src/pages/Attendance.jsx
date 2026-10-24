import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Users,
  Plus,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  FileText,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { attendanceAPI, leaveAPI, employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Attendance() {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'leaves'
  
  // Date State for Attendance
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State Attendance
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    date: selectedDate,
    status: 'HADIR',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    notes: ''
  });

  // Modal State Leave Request
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'CUTI',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Modal State Leave Approval/Rejection
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        employeeAPI.getAll(),
        attendanceAPI.getAll({ date: selectedDate }),
        leaveAPI.getAll()
      ]);

      if (empRes.data.success) {
        setEmployees(empRes.data.employees || []);
      }
      if (attRes.data.success) {
        setAttendances(attRes.data.attendances || []);
      }
      if (leaveRes.data.success) {
        setLeaves(leaveRes.data.leaves || []);
      }
    } catch (err) {
      showToast('Gagal memuat data presensi & cuti: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Bulk check-in all active employees
  const handleBulkCheckIn = async () => {
    if (!window.confirm(`Catat semua karyawan aktif hadir pada tanggal ${selectedDate} jam 08:00?`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await attendanceAPI.bulkCheckIn({
        date: selectedDate,
        checkInTime: '08:00',
        status: 'HADIR'
      });
      showToast(res.data.message || 'Presensi otomatis berhasil disimpan!', 'success');
      fetchData();
    } catch (err) {
      showToast('Gagal presensi massal: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Attendance Modal for an employee
  const handleOpenAttendanceModal = (emp, existingAtt = null) => {
    if (existingAtt) {
      setAttendanceForm({
        employeeId: emp.id,
        date: selectedDate,
        status: existingAtt.status,
        checkInTime: existingAtt.checkInTime || '',
        checkOutTime: existingAtt.checkOutTime || '',
        notes: existingAtt.notes || ''
      });
    } else {
      setAttendanceForm({
        employeeId: emp.id,
        date: selectedDate,
        status: 'HADIR',
        checkInTime: '08:00',
        checkOutTime: '',
        notes: ''
      });
    }
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await attendanceAPI.record(attendanceForm);
      showToast('Presensi berhasil disimpan!', 'success');
      setIsAttendanceModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Gagal menyimpan presensi: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Leave Request
  const handleSaveLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await leaveAPI.create(leaveForm);
      showToast('Pengajuan cuti/izin berhasil didaftarkan!', 'success');
      setIsLeaveModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Gagal mendaftarkan cuti: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Review Leave Modal
  const handleOpenReview = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setAdminNotes(action === 'APPROVED' ? 'Disetujui oleh Admin Toko' : 'Tidak dapat disetujui karena jadwal toko padat');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    setSubmitting(true);
    try {
      await leaveAPI.updateStatus(selectedLeave.id, {
        status: reviewAction,
        adminNotes
      });
      showToast(`Pengajuan berhasil di-${reviewAction === 'APPROVED' ? 'setujui' : 'tolak'}!`, 'success');
      setIsReviewModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Gagal memperbarui status: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Date Navigation
  const changeDateByDays = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Attendance stats for selected date
  const presentCount = attendances.filter(a => a.status === 'HADIR').length;
  const permitCount = attendances.filter(a => a.status === 'IZIN').length;
  const sickCount = attendances.filter(a => a.status === 'SAKIT').length;
  const alpaCount = attendances.filter(a => a.status === 'ALPA').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-stone-900">Pengelolaan Presensi & Cuti Karyawan</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Pencatatan jam kerja, lembur, status kehadiran harian, serta persetujuan cuti dan izin oleh Admin
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Presensi Harian</span>
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'leaves'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Izin & Cuti</span>
            {pendingLeavesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
                {pendingLeavesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'attendance' ? (
        <>
          {/* Date Selector & Bulk Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => changeDateByDays(-1)}
                className="p-2 border border-stone-200 hover:bg-stone-50 rounded-xl cursor-pointer text-stone-600"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 border border-stone-200 rounded-xl bg-stone-50">
                <Calendar className="w-4 h-4 text-stone-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => changeDateByDays(1)}
                className="p-2 border border-stone-200 hover:bg-stone-50 rounded-xl cursor-pointer text-stone-600"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 cursor-pointer"
              >
                Hari Ini
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleBulkCheckIn}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Check-in Otomatis Semua Hadir (08:00)</span>
              </button>
              <button
                onClick={fetchData}
                className="p-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Hadir</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">{presentCount} Orang</div>
              </div>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Izin</div>
                <div className="text-xl font-black text-blue-600 mt-0.5">{permitCount} Orang</div>
              </div>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sakit</div>
                <div className="text-xl font-black text-amber-600 mt-0.5">{sickCount} Orang</div>
              </div>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <HelpCircle className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Alpa / Belum Presensi</div>
                <div className="text-xl font-black text-rose-600 mt-0.5">
                  {employees.filter(e => e.isActive).length - (presentCount + permitCount + sickCount)} Orang
                </div>
              </div>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <XCircle className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Daily Attendance Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Karyawan</th>
                    <th className="py-3.5 px-4">Status Kehadiran</th>
                    <th className="py-3.5 px-4">Jam Masuk</th>
                    <th className="py-3.5 px-4">Jam Pulang</th>
                    <th className="py-3.5 px-4">Catatan Harian</th>
                    <th className="py-3.5 px-4 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {employees.filter(e => e.isActive).map((emp) => {
                    const record = attendances.find(a => a.employeeId === emp.id);

                    return (
                      <tr key={emp.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-stone-900">{emp.name}</div>
                              <div className="text-[11px] text-stone-500">{emp.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {record ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                record.status === 'HADIR'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : record.status === 'IZIN'
                                  ? 'bg-blue-100 text-blue-800'
                                  : record.status === 'SAKIT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  record.status === 'HADIR'
                                    ? 'bg-emerald-500'
                                    : record.status === 'IZIN'
                                    ? 'bg-blue-500'
                                    : record.status === 'SAKIT'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              {record.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                              Belum Dicatat
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                          {record?.checkInTime || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                          {record?.checkOutTime || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                          {record?.notes || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAttendanceModal(emp, record)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            {record ? 'Edit Presensi' : 'Catat Presensi'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Leave Requests Section */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Daftar Pengajuan Cuti & Izin Karyawan</h2>
              <p className="text-xs text-stone-500">
                Semua pengajuan cuti tahunan, sakit, atau izin keperluan keluarga diputuskan oleh Admin
              </p>
            </div>

            <button
              onClick={() => {
                setLeaveForm({
                  employeeId: employees[0]?.id || '',
                  leaveType: 'CUTI',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  reason: ''
                });
                setIsLeaveModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Cuti / Izin Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Karyawan</th>
                    <th className="py-3.5 px-4">Jenis</th>
                    <th className="py-3.5 px-4">Rentang Tanggal</th>
                    <th className="py-3.5 px-4">Alasan Pengajuan</th>
                    <th className="py-3.5 px-4">Status & Catatan Admin</th>
                    <th className="py-3.5 px-4 text-right">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-stone-400">
                        Belum ada riwayat pengajuan cuti atau izin karyawan.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => {
                      const start = new Date(leave.startDate);
                      const end = new Date(leave.endDate);
                      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                      return (
                        <tr key={leave.id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-stone-900">{leave.employee?.name}</div>
                            <div className="text-[11px] text-stone-500">{leave.employee?.position}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                              {leave.leaveType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-stone-800 font-semibold">
                              {start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} -{' '}
                              {end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-stone-400">{diffDays} Hari Kalender</div>
                          </td>
                          <td className="py-3.5 px-4 text-stone-700 max-w-xs">{leave.reason}</td>
                          <td className="py-3.5 px-4">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  leave.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : leave.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {leave.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                                {leave.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                {leave.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                {leave.status === 'APPROVED'
                                  ? 'DISETUJUI'
                                  : leave.status === 'REJECTED'
                                  ? 'DITOLAK'
                                  : 'MENUNGGU PERSETUJUAN'}
                              </span>
                              {leave.adminNotes && (
                                <div className="text-[10px] text-stone-500 mt-1 italic">
                                  Catatan: {leave.adminNotes}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {leave.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenReview(leave, 'APPROVED')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  onClick={() => handleOpenReview(leave, 'REJECTED')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-stone-400 text-[11px] font-semibold">Telah Diputuskan</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Catat Presensi Karyawan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Karyawan</label>
            <select
              disabled
              value={attendanceForm.employeeId}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-stone-100 font-bold"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Status Kehadiran</label>
              <select
                value={attendanceForm.status}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              >
                <option value="HADIR">HADIR</option>
                <option value="IZIN">IZIN</option>
                <option value="SAKIT">SAKIT</option>
                <option value="ALPA">ALPA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Jam Masuk</label>
              <input
                type="time"
                value={attendanceForm.checkInTime}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Jam Pulang</label>
              <input
                type="time"
                value={attendanceForm.checkOutTime}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Catatan / Keterangan</label>
            <textarea
              rows="2"
              value={attendanceForm.notes}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
              placeholder="Contoh: Datang tepat waktu, lembur 1 jam membuat roti tawar"
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(false)}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Daftarkan Pengajuan Cuti / Izin"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Pilih Karyawan</label>
            <select
              value={leaveForm.employeeId}
              onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
            >
              {employees.filter(e => e.isActive).map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.position})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Tipe Pengajuan</label>
            <select
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
            >
              <option value="CUTI">CUTI TAHUNAN / PRIBADI</option>
              <option value="IZIN">IZIN KELUARGA / KELUAR KOTA</option>
              <option value="SAKIT">SURAT SAKIT DOKTER</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Alasan Pengajuan</label>
            <textarea
              rows="3"
              required
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              placeholder="Alasan lengkap keperluan cuti/izin karyawan..."
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Ajukan Permohonan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Leave Modal (Approve / Reject) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={reviewAction === 'APPROVED' ? 'Persetujuan Pengajuan Cuti' : 'Penolakan Pengajuan Cuti'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveReview} className="space-y-4">
          <div className={`p-3 rounded-xl border text-xs ${
            reviewAction === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <p className="font-semibold">
              Anda akan <span className="font-bold underline">{reviewAction === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'}</span> pengajuan{' '}
              <span className="font-bold">{selectedLeave?.leaveType}</span> untuk{' '}
              <span className="font-bold">{selectedLeave?.employee?.name}</span>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Catatan Evaluasi Admin</label>
            <textarea
              rows="3"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Tambahkan catatan atau alasan persetujuan/penolakan..."
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 ${
                reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? 'Memproses...' : reviewAction === 'APPROVED' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
