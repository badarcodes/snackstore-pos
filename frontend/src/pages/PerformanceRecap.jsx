import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  Filter,
  Download,
  Printer,
  Medal,
  Users,
  CheckCircle2,
  Star,
  RefreshCw,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { evaluationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PerformanceRecap() {
  const { showToast, storeSettings } = useAuth();
  const [period, setPeriod] = useState('monthly'); // 'weekly' | 'monthly'
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [week, setWeek] = useState(getWeekNumber(new Date()));
  const [loading, setLoading] = useState(true);
  const [recapData, setRecapData] = useState(null);

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  const fetchRecap = async () => {
    setLoading(true);
    try {
      const params = { period, year };
      if (period === 'monthly') {
        params.month = month;
      } else {
        params.week = week;
      }

      const res = await evaluationAPI.getRecap(params);
      if (res.data.success) {
        setRecapData(res.data.data);
      }
    } catch (err) {
      showToast('Gagal memuat rekapitulasi: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
  }, [period, year, month, week]);

  const handlePrint = () => {
    window.print();
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const rankings = recapData?.rankings || [];
  const summary = recapData?.summary || { totalEmployeesEvaluated: 0, overallAverage: 0, totalEvaluations: 0 };
  const topPerformer = recapData?.topPerformer;

  // Chart data preparation
  const barChartData = rankings.map(r => ({
    name: r.name.split(' ')[0],
    fullName: r.name,
    'Skor Rata-rata': Number(r.averageScore),
    'Kedisiplinan': Number(r.averages?.discipline || 0),
    'Kualitas': Number(r.averages?.quality || 0),
    'Pelayanan': Number(r.averages?.service || 0),
    'Kerja Sama': Number(r.averages?.teamwork || 0),
    'Inisiatif': Number(r.averages?.initiative || 0)
  }));

  // Store 5 indicators overall average for radar/summary
  const indicatorAverages = [
    {
      subject: 'Kedisiplinan',
      A: rankings.length > 0
        ? Number((rankings.reduce((acc, r) => acc + (r.averages?.discipline || 0), 0) / rankings.length).toFixed(2))
        : 0,
      fullMark: 5
    },
    {
      subject: 'Kualitas & Higienitas',
      A: rankings.length > 0
        ? Number((rankings.reduce((acc, r) => acc + (r.averages?.quality || 0), 0) / rankings.length).toFixed(2))
        : 0,
      fullMark: 5
    },
    {
      subject: 'Pelayanan Pelanggan',
      A: rankings.length > 0
        ? Number((rankings.reduce((acc, r) => acc + (r.averages?.service || 0), 0) / rankings.length).toFixed(2))
        : 0,
      fullMark: 5
    },
    {
      subject: 'Kerja Sama Tim',
      A: rankings.length > 0
        ? Number((rankings.reduce((acc, r) => acc + (r.averages?.teamwork || 0), 0) / rankings.length).toFixed(2))
        : 0,
      fullMark: 5
    },
    {
      subject: 'Inisiatif Kerja',
      A: rankings.length > 0
        ? Number((rankings.reduce((acc, r) => acc + (r.averages?.initiative || 0), 0) / rankings.length).toFixed(2))
        : 0,
      fullMark: 5
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-stone-900">Rekapitulasi Kinerja Karyawan</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Laporan berkala hasil penilaian kinerja toko kue mingguan dan bulanan otomatis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Period Toggle */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'weekly' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'monthly' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Bulanan
            </button>
          </div>

          {/* Period Specific Selectors */}
          {period === 'monthly' ? (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 bg-white focus:outline-none cursor-pointer"
            >
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 bg-white focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Minggu ke-{w}
                </option>
              ))}
            </select>
          )}

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 bg-white focus:outline-none cursor-pointer"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Cetak Laporan"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-xl font-black uppercase text-stone-900">
          {storeSettings.store_name || 'TOKO KUE JAYA BARU'}
        </h1>
        <p className="text-xs text-stone-600">
          {storeSettings.store_address || 'Jl. Raya Kue Tradisional & Modern No. 88, Bandung'}
        </p>
        <h2 className="text-sm font-bold mt-3 text-stone-800 uppercase tracking-wider">
          LAPORAN REKAPITULASI PENILAIAN KINERJA KARYAWAN ({period === 'monthly' ? `Bulan ${monthNames[month - 1]} ${year}` : `Minggu ke-${week} Tahun ${year}`})
        </h2>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Rata-rata Skor Toko
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-amber-900">{summary.overallAverage}</span>
            <span className="text-xs font-semibold text-stone-400">/ 5.00</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Kategori:{' '}
            <span className="font-bold text-amber-700">
              {Number(summary.overallAverage) >= 4.5
                ? 'Sangat Baik (A)'
                : Number(summary.overallAverage) >= 3.5
                ? 'Baik (B)'
                : 'Cukup (C)'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Karyawan Terbaik #{1}
          </div>
          <div className="text-lg font-black text-stone-900 mt-1 truncate">
            {topPerformer ? topPerformer.name : '-'}
          </div>
          <div className="text-[11px] text-amber-600 font-bold mt-1 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Skor {topPerformer?.averageScore || 0} / 5.00 ({topPerformer?.grade || '-'})</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Karyawan Dievaluasi
          </div>
          <div className="text-3xl font-black text-stone-900 mt-1">
            {summary.totalEmployeesEvaluated} <span className="text-xs font-normal text-stone-500">Orang</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Total staf aktif toko</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Total Sesi Penilaian
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {summary.totalEvaluations} <span className="text-xs font-normal text-stone-500">Catatan</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Presisi harian tercatat</div>
        </div>
      </div>

      {/* Visual Analytics Section (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Left: Bar Chart of Employee Scores */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Perbandingan Skor Rata-rata Karyawan</h2>
              <p className="text-xs text-stone-500">Skala 1.00 s.d. 5.00 pada periode terpilih</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              Target Min: 3.50
            </span>
          </div>

          <div className="h-72 w-full">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-stone-900 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-1">
                            <div className="font-bold text-amber-300">{data.fullName}</div>
                            <div>Skor Rata-rata: <span className="font-bold">{data['Skor Rata-rata']}</span></div>
                            <div className="text-[10px] text-stone-300">
                              Disiplin: {data.Kedisiplinan} • Kualitas: {data.Kualitas} • Pelayanan: {data.Pelayanan}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Skor Rata-rata" fill="#d97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Belum ada data grafik penilaian untuk periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Right: Radar Chart of 5 Indicators */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Keseimbangan 5 Indikator Toko</h2>
            <p className="text-xs text-stone-500">Rata-rata kumulatif seluruh tim kue</p>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={85} data={indicatorAverages}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                <Radar name="Rata-rata Tim" dataKey="A" stroke="#d97706" fill="#d97706" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Ranking & Breakdown Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Peringkat & Rincian Penilaian Kinerja Karyawan
            </h2>
            <p className="text-xs text-stone-500">
              Diurutkan berdasarkan skor rata-rata tertinggi lengkap dengan riwayat kehadiran
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center">Peringkat</th>
                <th className="py-3.5 px-4">Karyawan & Jabatan</th>
                <th className="py-3.5 px-4 text-center">1. Disiplin</th>
                <th className="py-3.5 px-4 text-center">2. Kualitas</th>
                <th className="py-3.5 px-4 text-center">3. Pelayanan</th>
                <th className="py-3.5 px-4 text-center">4. Tim</th>
                <th className="py-3.5 px-4 text-center">5. Inisiatif</th>
                <th className="py-3.5 px-4 text-center">Rata-rata & Predikat</th>
                <th className="py-3.5 px-4 text-center">Presensi Hadir</th>
                <th className="py-3.5 px-4 text-center">Jumlah Dinilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-amber-600" />
                    Menghitung rekapitulasi penilaian kinerja...
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-stone-400">
                    Belum ada data evaluasi yang tercatat untuk periode ini.
                  </td>
                </tr>
              ) : (
                rankings.map((r) => (
                  <tr key={r.employeeId} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      {r.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black text-xs">
                          🥇 1
                        </span>
                      ) : r.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-200 text-stone-800 font-black text-xs">
                          🥈 2
                        </span>
                      ) : r.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-200 text-amber-900 font-black text-xs">
                          🥉 3
                        </span>
                      ) : (
                        <span className="font-bold text-stone-600">#{r.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-stone-900">{r.name}</div>
                        <div className="text-[11px] text-stone-500">
                          {r.employeeCode} • {r.position}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-700">
                      {r.averages?.discipline || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-700">
                      {r.averages?.quality || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-700">
                      {r.averages?.service || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-700">
                      {r.averages?.teamwork || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-700">
                      {r.averages?.initiative || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-black text-amber-950 font-mono">
                          ★ {Number(r.averageScore).toFixed(2)}
                        </span>
                        <span
                          className={`mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold ${
                            r.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.grade === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Grade {r.grade}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-emerald-700">{r.attendanceSummary?.HADIR || 0} Hadir</span>
                        {r.attendanceSummary?.IZIN > 0 && (
                          <span className="text-blue-600">({r.attendanceSummary.IZIN} Izin)</span>
                        )}
                        {r.attendanceSummary?.SAKIT > 0 && (
                          <span className="text-amber-600">({r.attendanceSummary.SAKIT} Sakit)</span>
                        )}
                        {r.attendanceSummary?.ALPA > 0 && (
                          <span className="text-rose-600">({r.attendanceSummary.ALPA} Alpa)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-stone-600">
                      {r.evaluationCount} Hari
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer Signatures */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-12 pb-6 px-8 text-center text-xs">
          <div>
            <p className="text-stone-500">Dibuat & Diverifikasi,</p>
            <div className="h-16" />
            <p className="font-bold text-stone-900 underline">Admin Toko Kue Jaya Baru</p>
          </div>
          <div>
            <p className="text-stone-500">Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div className="h-16" />
            <p className="font-bold text-stone-900 underline">Pemilik Toko</p>
          </div>
        </div>
      </div>
    </div>
  );
}
