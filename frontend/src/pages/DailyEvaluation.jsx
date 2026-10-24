import React, { useState, useEffect } from 'react';
import {
  Award,
  Star,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Save,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { evaluationAPI, employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DailyEvaluation() {
  const { showToast } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 5 Indikator Penilaian
  const indicators = [
    {
      key: 'scoreDiscipline',
      name: '1. Kedisiplinan & Ketepatan Waktu',
      desc: 'Ketepatan jam masuk, kesiapan kerja, dan kepatuhan terhadap aturan toko kue'
    },
    {
      key: 'scoreQuality',
      name: '2. Kualitas Kerja & Kebersihan (Higienitas)',
      desc: 'Ketelitian rasa kue, standar resep, kebersihan area kerja, dan sanitasi'
    },
    {
      key: 'scoreService',
      name: '3. Pelayanan Pelanggan & Keramahan',
      desc: 'Sikap ramah, senyum 5S, ketanggapan melayani pembeli di toko kue'
    },
    {
      key: 'scoreTeamwork',
      name: '4. Kerja Sama Tim & Koordinasi',
      desc: 'Komunikasi antar bagian produksi kue, etalase, dan kasir toko'
    },
    {
      key: 'scoreInitiative',
      name: '5. Inisiatif & Tanggung Jawab',
      desc: 'Kecepatan bertindak, inisiatif restock kue habis, dan tanggung jawab kerja'
    }
  ];

  const scaleLabels = {
    1: { label: 'Sangat Tidak Baik', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    2: { label: 'Tidak Baik', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    3: { label: 'Cukup / Rata-rata', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    4: { label: 'Baik', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    5: { label: 'Sangat Baik', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' }
  };

  // Form State
  const [scores, setScores] = useState({
    scoreDiscipline: 5,
    scoreQuality: 5,
    scoreService: 5,
    scoreTeamwork: 5,
    scoreInitiative: 5
  });
  const [notes, setNotes] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, evalRes] = await Promise.all([
        employeeAPI.getAll(),
        evaluationAPI.getAll({ date: selectedDate })
      ]);

      if (empRes.data.success) {
        const activeEmps = (empRes.data.employees || []).filter(e => e.isActive);
        setEmployees(activeEmps);
        if (activeEmps.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(activeEmps[0].id);
        }
      }

      if (evalRes.data.success) {
        setEvaluations(evalRes.data.evaluations || []);
      }
    } catch (err) {
      showToast('Gagal memuat evaluasi: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // When selected employee or evaluations change, update form
  useEffect(() => {
    if (!selectedEmployeeId) return;
    const existing = evaluations.find(e => e.employeeId === Number(selectedEmployeeId));
    if (existing) {
      setScores({
        scoreDiscipline: existing.scoreDiscipline,
        scoreQuality: existing.scoreQuality,
        scoreService: existing.scoreService,
        scoreTeamwork: existing.scoreTeamwork,
        scoreInitiative: existing.scoreInitiative
      });
      setNotes(existing.notes || '');
    } else {
      // Default reset
      setScores({
        scoreDiscipline: 4,
        scoreQuality: 4,
        scoreService: 4,
        scoreTeamwork: 4,
        scoreInitiative: 4
      });
      setNotes('');
    }
  }, [selectedEmployeeId, evaluations]);

  // Compute live average
  const currentAverage = (
    (scores.scoreDiscipline +
      scores.scoreQuality +
      scores.scoreService +
      scores.scoreTeamwork +
      scores.scoreInitiative) /
    5
  ).toFixed(2);

  const getScoreBadge = (avg) => {
    const num = Number(avg);
    if (num >= 4.5) return { text: 'Sangat Baik (A)', color: 'bg-emerald-100 text-emerald-800' };
    if (num >= 3.5) return { text: 'Baik (B)', color: 'bg-blue-100 text-blue-800' };
    if (num >= 2.5) return { text: 'Cukup (C)', color: 'bg-amber-100 text-amber-800' };
    if (num >= 1.5) return { text: 'Kurang (D)', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Sangat Kurang (E)', color: 'bg-rose-100 text-rose-800' };
  };

  const handleScoreChange = (key, val) => {
    setScores(prev => ({ ...prev, [key]: Number(val) }));
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      showToast('Pilih karyawan terlebih dahulu', 'error');
      return;
    }
    setSaving(true);
    try {
      await evaluationAPI.record({
        employeeId: Number(selectedEmployeeId),
        evaluationDate: selectedDate,
        ...scores,
        notes
      });
      showToast('Penilaian kinerja berhasil disimpan!', 'success');
      fetchData();
    } catch (err) {
      showToast('Gagal menyimpan evaluasi: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const changeDateByDays = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const selectedEmp = employees.find(e => e.id === Number(selectedEmployeeId));
  const evaluatedCount = evaluations.length;
  const totalActive = employees.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-stone-900">Penilaian Kinerja Harian Karyawan</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Evaluasi harian oleh Admin berdasarkan 5 indikator utama kinerja toko kue skala 1 sampai 5
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 cursor-pointer"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-amber-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-amber-200 font-bold uppercase tracking-wider">
            Status Evaluasi Tanggal {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="text-2xl font-black mt-1">
            {evaluatedCount} dari {totalActive} Karyawan Telah Dinilai
          </div>
          <p className="text-xs text-amber-100/80 mt-0.5">
            {evaluatedCount === totalActive
              ? '✅ Seluruh karyawan telah lengkap dievaluasi untuk tanggal ini.'
              : `Masih ada ${totalActive - evaluatedCount} karyawan yang belum dinilai.`}
          </p>
        </div>

        <div className="w-full sm:w-48 bg-amber-950/60 p-3 rounded-xl border border-amber-700/50">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>Kelengkapan</span>
            <span>{totalActive > 0 ? Math.round((evaluatedCount / totalActive) * 100) : 0}%</span>
          </div>
          <div className="w-full h-2 bg-amber-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${totalActive > 0 ? (evaluatedCount / totalActive) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Layout: Left Column (Employee List), Right Column (5-Indicator Evaluation Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Employee Selection List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              Pilih Karyawan untuk Dinilai:
            </h2>
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {employees.map((emp) => {
                const isSelected = Number(selectedEmployeeId) === emp.id;
                const evalData = evaluations.find(e => e.employeeId === emp.id);

                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs ${
                          isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate">{emp.name}</div>
                        <div className="text-[11px] text-stone-500 truncate">{emp.position}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {evalData ? (
                        <div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            ★ {Number(evalData.averageScore).toFixed(2)}
                          </div>
                          <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Sudah Dinilai</div>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-400">
                          Belum Dinilai
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: 5 Indicators Evaluation Form */}
        <div className="lg:col-span-8">
          {selectedEmp ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              {/* Form Title & Current Employee Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {selectedEmp.employeeCode}
                  </span>
                  <h2 className="text-lg font-bold text-stone-900 mt-1">{selectedEmp.name}</h2>
                  <p className="text-xs text-stone-500">{selectedEmp.position} • Toko Kue Jaya Baru</p>
                </div>

                {/* Live Average Score Display */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 px-4 py-3 rounded-2xl text-right flex items-center gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-stone-500 uppercase">Nilai Rata-rata</div>
                    <div className="text-2xl font-black text-amber-900 leading-tight">
                      {currentAverage} <span className="text-xs font-normal text-stone-500">/ 5.00</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-bold ${getScoreBadge(currentAverage).color}`}>
                    {getScoreBadge(currentAverage).text}
                  </div>
                </div>
              </div>

              {/* 5 Indicators Interactive Assessment */}
              <form onSubmit={handleSaveEvaluation} className="space-y-6">
                <div className="space-y-5">
                  {indicators.map((ind, index) => {
                    const currentScore = scores[ind.key];

                    return (
                      <div
                        key={ind.key}
                        className="p-4 rounded-xl border border-stone-200 hover:border-amber-300 transition-colors bg-stone-50/50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <div>
                            <div className="text-xs font-bold text-stone-900">{ind.name}</div>
                            <div className="text-[11px] text-stone-500">{ind.desc}</div>
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                              scaleLabels[currentScore].color
                            }`}
                          >
                            Tingkat {currentScore}: {scaleLabels[currentScore].label}
                          </span>
                        </div>

                        {/* 5 Levels Rating Buttons */}
                        <div className="grid grid-cols-5 gap-2 mt-3">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const isSelected = currentScore === lvl;

                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleScoreChange(ind.key, lvl)}
                                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                  isSelected
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/30'
                                    : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50/50 hover:border-amber-300'
                                }`}
                              >
                                <span className="text-sm">
                                  {lvl === 5 ? '⭐⭐⭐⭐⭐' : lvl === 4 ? '⭐⭐⭐⭐' : lvl === 3 ? '⭐⭐⭐' : lvl === 2 ? '⭐⭐' : '⭐'}
                                </span>
                                <span className="text-xs font-extrabold">{lvl}</span>
                                <span className="text-[9px] font-medium hidden sm:inline text-center opacity-90 truncate max-w-full">
                                  {scaleLabels[lvl].label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Evaluation Notes */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                    Catatan Evaluasi / Rekomendasi Admin (Opsional):
                  </label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Pekerjaan adonan bolu sangat rapi dan higienis. Pertahankan ketepatan waktu hadir."
                    className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-900/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Menyimpan Penilaian...' : 'Simpan Penilaian Harian'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-400">
              Pilih karyawan di sebelah kiri untuk memulai penilaian.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
