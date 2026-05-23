import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  LayoutDashboard, PlusCircle, ClipboardList, Package2,
  User, Users, Calendar, Clock, Search, Trash2, Edit2,
  X, Check, TrendingUp, Activity, Menu, ChevronRight,
  Plus, Minus, Building2, Stethoscope, ArrowLeft, Save,
  FileText, BarChart2, AlertCircle, CheckCircle, Info,
  ChevronDown, Brain, Settings, Bell, Filter, LogOut,
  Cloud, Loader2, WifiOff
} from 'lucide-react'
import { isConfigured, auth, provider } from './firebase'
import {
  subscribeSurgeries, addSurgery, updateSurgery, deleteSurgery,
  subscribeSuppliers, addSupplier, updateSupplier, deleteSupplier,
  seedIfEmpty,
} from './db'
import {
  onAuthStateChanged, signInAnonymously, signOut as fbSignOut,
} from 'firebase/auth'

// ============================================================
// STATIC DATA
// ============================================================

const SURGEONS = [
  { id: 1, name: 'Dr. Marco Melgarejo', role: 'Jefe de Servicio' },
  { id: 2, name: 'Dr. Carlos Rodríguez', role: 'Médico Asistente' },
  { id: 3, name: 'Dra. Ana Martínez', role: 'Médico Asistente' },
  { id: 4, name: 'Dr. Luis Hernández', role: 'Médico Asistente' },
]

const RESIDENTS = [
  { id: 1, name: 'Dr. Pedro García' },
  { id: 2, name: 'Dra. Sofía López' },
  { id: 3, name: 'Dr. Miguel Torres' },
  { id: 4, name: 'Dra. Carmen Vásquez' },
  { id: 5, name: 'Dr. Andrés Morales' },
]

const INITIAL_SUPPLIERS = [
  { id: 1, name: 'Medtronic', specialty: 'Columna, Cráneo, Neuromodulación', contact: 'ventas@medtronic.cl' },
  { id: 2, name: 'Stryker', specialty: 'Columna, Trauma, Implantes', contact: 'info@stryker.cl' },
  { id: 3, name: 'DePuy Synthes', specialty: 'Columna, Trauma', contact: 'depuy@jnj.com' },
  { id: 4, name: 'NuVasive', specialty: 'Columna Mínimamente Invasiva', contact: 'nuvacl@nuvco.com' },
  { id: 5, name: 'Integra LifeSciences', specialty: 'Neurocirugía, Craniofacial', contact: 'integra@integra.cl' },
]

const SURGERY_CATEGORIES = [
  'Columna Cervical',
  'Columna Torácica',
  'Columna Lumbar',
  'Columna Lumbosacra',
  'Cráneo – Tumor',
  'Cráneo – Vascular',
  'Cráneo – Trauma',
  'Nervio Periférico',
  'Endoscopia',
  'Funcional / Estereotaxia',
  'Pediátrica',
  'Otro',
]

const CATEGORY_COLORS = {
  'Columna Cervical': '#0d9488',
  'Columna Torácica': '#0891b2',
  'Columna Lumbar': '#2563eb',
  'Columna Lumbosacra': '#4f46e5',
  'Cráneo – Tumor': '#7c3aed',
  'Cráneo – Vascular': '#db2777',
  'Cráneo – Trauma': '#dc2626',
  'Nervio Periférico': '#d97706',
  'Endoscopia': '#16a34a',
  'Funcional / Estereotaxia': '#65a30d',
  'Pediátrica': '#ca8a04',
  'Otro': '#6b7280',
}

const COMMON_DIAGNOSES = [
  'Hernia discal L4-L5 con radiculopatía',
  'Hernia discal L5-S1 con radiculopatía',
  'Hernia discal C5-C6',
  'Hernia discal C6-C7',
  'Estenosis del canal lumbar',
  'Estenosis del canal cervical',
  'Espondilolistesis lumbar degenerativa',
  'Glioblastoma multiforme',
  'Meningioma',
  'Neurinoma del acústico',
  'Metástasis cerebral',
  'Hematoma subdural agudo',
  'Hematoma epidural agudo',
  'Hemorragia subaracnoidea',
  'Fractura vertebral cervical',
  'Fractura vertebral lumbar',
  'Espondilodiscitis',
  'Malformación arteriovenosa cerebral',
  'Aneurisma cerebral',
  'Hidrocefalia',
  'Mielopatía cervical',
  'TCE grave',
]

const MOCK_SURGERIES = [
  {
    id: 1,
    date: '2026-05-15',
    durationHours: '3', durationMinutes: '20',
    patientName: 'Juan Carlos Pérez Soto',
    clinicalRecord: 'HC-2026-0521',
    primaryDiagnosis: 'Hernia discal L4-L5 con radiculopatía',
    secondaryDiagnosis: 'Estenosis del canal lumbar',
    mainSurgeon: 'Dr. Marco Melgarejo',
    residents: ['Dr. Pedro García', 'Dra. Sofía López'],
    additionalAssistants: 'Dr. Carlos Rodríguez',
    surgeryCategory: 'Columna Lumbar',
    materialCompany: 'Medtronic',
    screws: [{ id: 1, size: '5.5 x 40mm', quantity: '4' }, { id: 2, size: '5.5 x 45mm', quantity: '4' }],
    barsQuantity: '2',
    crosslinkUsed: true, crosslinkQuantity: '2',
    titaniumMeshUsed: false, titaniumMeshSpecs: '',
    otherInstruments: 'Cage TLIF 10x22mm',
    observations: 'Procedimiento sin complicaciones. Monitoreo neurofisiológico intraoperatorio normal.',
  },
  {
    id: 2,
    date: '2026-05-10',
    durationHours: '5', durationMinutes: '45',
    patientName: 'María Elena Gutiérrez',
    clinicalRecord: 'HC-2026-0498',
    primaryDiagnosis: 'Glioblastoma multiforme frontal derecho',
    secondaryDiagnosis: '',
    mainSurgeon: 'Dr. Marco Melgarejo',
    residents: ['Dr. Miguel Torres'],
    additionalAssistants: 'Dra. Ana Martínez',
    surgeryCategory: 'Cráneo – Tumor',
    materialCompany: 'Integra LifeSciences',
    screws: [],
    barsQuantity: '',
    crosslinkUsed: false, crosslinkQuantity: '',
    titaniumMeshUsed: true, titaniumMeshSpecs: 'Malla 4x4cm para cranioplastía',
    otherInstruments: 'Neuronavegación StealthStation, Microscopio Zeiss',
    observations: 'Resección subtotal. Márgenes enviados a anatomía patológica. Sin déficit neurológico nuevo.',
  },
  {
    id: 3,
    date: '2026-05-05',
    durationHours: '4', durationMinutes: '10',
    patientName: 'Roberto Sánchez Lima',
    clinicalRecord: 'HC-2026-0477',
    primaryDiagnosis: 'Fractura cervical C5-C6 con inestabilidad',
    secondaryDiagnosis: 'Mielopatía cervical',
    mainSurgeon: 'Dr. Carlos Rodríguez',
    residents: ['Dra. Carmen Vásquez', 'Dr. Andrés Morales'],
    additionalAssistants: '',
    surgeryCategory: 'Columna Cervical',
    materialCompany: 'Stryker',
    screws: [{ id: 1, size: '3.5 x 14mm', quantity: '4' }, { id: 2, size: '3.5 x 16mm', quantity: '4' }],
    barsQuantity: '1',
    crosslinkUsed: false, crosslinkQuantity: '',
    titaniumMeshUsed: false, titaniumMeshSpecs: '',
    otherInstruments: 'Placa cervical anterior Zero-P',
    observations: 'Abordaje anterior. Discectomía C5-C6 con fusión intersomática. Evolución satisfactoria.',
  },
  {
    id: 4,
    date: '2026-04-28',
    durationHours: '2', durationMinutes: '30',
    patientName: 'Carmen Rosa Villanueva',
    clinicalRecord: 'HC-2026-0443',
    primaryDiagnosis: 'Hematoma epidural agudo temporoparietal derecho',
    secondaryDiagnosis: 'TCE grave',
    mainSurgeon: 'Dra. Ana Martínez',
    residents: ['Dr. Pedro García'],
    additionalAssistants: '',
    surgeryCategory: 'Cráneo – Trauma',
    materialCompany: 'Medtronic',
    screws: [],
    barsQuantity: '',
    crosslinkUsed: false, crosslinkQuantity: '',
    titaniumMeshUsed: false, titaniumMeshSpecs: '',
    otherInstruments: 'Trépano, craneotomía temporoparietal',
    observations: 'Evacuación de hematoma epidural 45cc. Evolución neurológica favorable post-op.',
  },
  {
    id: 5,
    date: '2026-04-15',
    durationHours: '4', durationMinutes: '50',
    patientName: 'Luis Alberto Ramírez Cruz',
    clinicalRecord: 'HC-2026-0412',
    primaryDiagnosis: 'Espondilodiscitis lumbar L3-L4',
    secondaryDiagnosis: 'Diabetes mellitus tipo 2',
    mainSurgeon: 'Dr. Marco Melgarejo',
    residents: ['Dr. Miguel Torres', 'Dra. Sofía López'],
    additionalAssistants: 'Dr. Luis Hernández',
    surgeryCategory: 'Columna Lumbar',
    materialCompany: 'DePuy Synthes',
    screws: [{ id: 1, size: '6.0 x 45mm', quantity: '4' }, { id: 2, size: '6.0 x 50mm', quantity: '4' }],
    barsQuantity: '2',
    crosslinkUsed: true, crosslinkQuantity: '1',
    titaniumMeshUsed: true, titaniumMeshSpecs: 'Cage vertebral expandible 26mm',
    otherInstruments: 'Sistema ISOLA de fijación posterior',
    observations: 'Desbridamiento y fusión instrumentada. Cultivos de disco enviados a laboratorio.',
  },
  {
    id: 6,
    date: '2026-03-22',
    durationHours: '3', durationMinutes: '0',
    patientName: 'Valentina Ortiz Mora',
    clinicalRecord: 'HC-2026-0356',
    primaryDiagnosis: 'Meningioma convexidad parietal izquierda',
    secondaryDiagnosis: '',
    mainSurgeon: 'Dr. Marco Melgarejo',
    residents: ['Dr. Pedro García'],
    additionalAssistants: 'Dra. Ana Martínez',
    surgeryCategory: 'Cráneo – Tumor',
    materialCompany: 'Integra LifeSciences',
    screws: [],
    barsQuantity: '',
    crosslinkUsed: false, crosslinkQuantity: '',
    titaniumMeshUsed: false, titaniumMeshSpecs: '',
    otherInstruments: 'Microscopio OPMI Pentero, neuronavegación',
    observations: 'Resección total Simpson I. Sin complicaciones. Alta a las 48h.',
  },
]

// ============================================================
// UTILITIES
// ============================================================

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function getDurationText(s) {
  const h = parseInt(s.durationHours || 0)
  const m = parseInt(s.durationMinutes || 0)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function getDurationMinutes(s) {
  return parseInt(s.durationHours || 0) * 60 + parseInt(s.durationMinutes || 0)
}

function getTotalScrews(s) {
  if (!s.screws || s.screws.length === 0) return 0
  return s.screws.reduce((acc, sc) => acc + parseInt(sc.quantity || 0), 0)
}

function getMonthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : ''
}

function monthLabel(key) {
  const [, m] = key.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return months[parseInt(m) - 1] || ''
}

function isSpinalCategory(cat) {
  return cat && (cat.startsWith('Columna') || cat === 'Otro')
}

// ============================================================
// TOAST
// ============================================================

function Toast({ toast, onClose }) {
  const cfg = {
    success: { bg: 'bg-emerald-600', icon: <CheckCircle className="w-5 h-5 flex-shrink-0" /> },
    error: { bg: 'bg-red-600', icon: <AlertCircle className="w-5 h-5 flex-shrink-0" /> },
    info: { bg: 'bg-blue-600', icon: <Info className="w-5 h-5 flex-shrink-0" /> },
  }
  const t = cfg[toast.type] || cfg.success
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white shadow-2xl max-w-sm ${t.bg}`}
      style={{ animation: 'slideUp .25s ease' }}>
      {t.icon}
      <span className="font-medium text-sm">{toast.message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ icon, label, value, subtitle, accent = 'teal' }) {
  const gradients = {
    teal: 'from-teal-500 to-teal-600',
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    violet: 'from-violet-500 to-violet-600',
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[accent] || gradients.teal} text-white shadow-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  )
}

// ============================================================
// HORIZONTAL BAR CHART
// ============================================================

function HBarChart({ data, title }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-full">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {data.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">Sin datos disponibles</p>
        : (
          <div className="space-y-3">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-36 truncate flex-shrink-0 text-right leading-tight">{d.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || '#0d9488' }} />
                </div>
                <span className="text-xs font-bold text-slate-700 w-5 text-right flex-shrink-0">{d.value}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ============================================================
// VERTICAL BAR CHART (SVG)
// ============================================================

function VBarChart({ data, title }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = 26
  const gap = 12
  const chartH = 90
  const totalW = data.length * (barW + gap) - gap
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {data.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
        : (
          <div className="overflow-x-auto">
            <svg width={Math.max(totalW, 260)} height={chartH + 32} className="overflow-visible mx-auto block">
              {data.map((d, i) => {
                const barH = Math.max((d.value / max) * chartH, d.value > 0 ? 3 : 0)
                const x = i * (barW + gap)
                return (
                  <g key={i}>
                    <rect x={x} y={chartH - barH} width={barW} height={barH} rx={5}
                      fill={d.color || '#0d9488'} opacity="0.85" />
                    {d.value > 0 && (
                      <text x={x + barW / 2} y={chartH - barH - 5} textAnchor="middle"
                        fontSize="10" fill="#475569" fontWeight="700">{d.value}</text>
                    )}
                    <text x={x + barW / 2} y={chartH + 16} textAnchor="middle"
                      fontSize="10" fill="#94a3b8">{d.label}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        )
      }
    </div>
  )
}

// ============================================================
// SIDEBAR
// ============================================================

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new-surgery', label: 'Nueva Cirugía', icon: PlusCircle },
  { id: 'history', label: 'Historial', icon: ClipboardList },
  { id: 'inventory', label: 'Proveedores', icon: Package2 },
]

function Sidebar({ currentView, setCurrentView, open, setOpen, user, onSignOut }) {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col
      transition-transform duration-300 ease-in-out
      lg:relative lg:translate-x-0 lg:flex-shrink-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="px-5 py-5 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">NeuroGestión</p>
            <p className="text-slate-400 text-xs">Svc. Neurocirugía</p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-slate-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = currentView === item.id
          return (
            <button key={item.id} onClick={() => { setCurrentView(item.id); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                ${active
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-teal-500/40" referrerPolicy="no-referrer" />
            : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(user?.displayName || 'MM').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
          }
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{user?.displayName || 'Dr. Marco Melgarejo'}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email || 'Jefe de Servicio'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ============================================================
// TOP BAR
// ============================================================

function TopBar({ setOpen, title }) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center gap-4 flex-shrink-0 sticky top-0 z-10">
      <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
        <Menu className="w-5 h-5" />
      </button>
      <div className="min-w-0">
        <p className="font-bold text-slate-800 text-sm md:text-base truncate">{title}</p>
        <p className="text-xs text-slate-400 hidden md:block">Servicio Dr. Marco Melgarejo · Neurocirugía</p>
      </div>
      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        <span className="hidden md:block text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
          {new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({ surgeries, onNew }) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentYear = String(now.getFullYear())

  const thisMonth = useMemo(
    () => surgeries.filter(s => getMonthKey(s.date) === currentMonth),
    [surgeries, currentMonth]
  )

  const thisYear = useMemo(
    () => surgeries.filter(s => s.date && s.date.startsWith(currentYear)),
    [surgeries, currentYear]
  )

  const avgMin = useMemo(() => {
    if (thisMonth.length === 0) return 0
    return Math.round(thisMonth.reduce((acc, s) => acc + getDurationMinutes(s), 0) / thisMonth.length)
  }, [thisMonth])

  const avgText = (() => {
    const h = Math.floor(avgMin / 60), m = avgMin % 60
    if (h === 0) return `${m} min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  })()

  const totalScrews = useMemo(
    () => thisMonth.reduce((acc, s) => acc + getTotalScrews(s), 0),
    [thisMonth]
  )

  const surgeonRank = useMemo(() => {
    const counts = {}
    thisMonth.forEach(s => { if (s.mainSurgeon) counts[s.mainSurgeon] = (counts[s.mainSurgeon] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [thisMonth])

  const categoryData = useMemo(() => {
    const counts = {}
    thisYear.forEach(s => { if (s.surgeryCategory) counts[s.surgeryCategory] = (counts[s.surgeryCategory] || 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] || '#6b7280' }))
  }, [thisYear])

  const companyData = useMemo(() => {
    const counts = {}
    thisYear.forEach(s => { if (s.materialCompany) counts[s.materialCompany] = (counts[s.materialCompany] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: '#3b82f6' }))
  }, [thisYear])

  const trend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return { label: monthLabel(key), value: surgeries.filter(s => getMonthKey(s.date) === key).length, color: '#0d9488' }
    })
  }, [surgeries])

  const recent = useMemo(
    () => [...surgeries].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5),
    [surgeries]
  )

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Panel de Control</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen del Servicio de Neurocirugía</p>
        </div>
        <button onClick={onNew}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          Nueva Cirugía
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="w-5 h-5" />} label="Cirugías este mes" value={thisMonth.length}
          subtitle={`${thisYear.length} en ${currentYear}`} accent="teal" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Duración promedio" value={avgText}
          subtitle="Por cirugía este mes" accent="blue" />
        <StatCard icon={<User className="w-5 h-5" />} label="Cirujano más activo"
          value={surgeonRank[0] ? surgeonRank[0][1] : '—'}
          subtitle={surgeonRank[0] ? surgeonRank[0][0] : 'Sin datos'} accent="indigo" />
        <StatCard icon={<Settings className="w-5 h-5" />} label="Tornillos este mes" value={totalScrews}
          subtitle="Total unidades usadas" accent="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HBarChart title={`Cirugías por categoría (${currentYear})`} data={categoryData.slice(0, 8)} />
        </div>
        <VBarChart title="Tendencia 6 meses" data={trend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-500" /> Cirujanos este mes
          </h3>
          {surgeonRank.length === 0
            ? <p className="text-sm text-slate-400 py-6 text-center">Sin cirugías este mes</p>
            : surgeonRank.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-slate-700 truncate">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-teal-500"
                      style={{ width: `${(count / (surgeonRank[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-800 w-5 text-right">{count}</span>
                </div>
              </div>
            ))
          }
        </div>
        <HBarChart title={`Empresas proveedoras (${currentYear})`} data={companyData.slice(0, 5)} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-500" /> Últimas cirugías registradas
        </h3>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="pb-2 text-left font-semibold">Fecha</th>
                <th className="pb-2 text-left font-semibold">Paciente</th>
                <th className="pb-2 text-left font-semibold hidden md:table-cell">Categoría</th>
                <th className="pb-2 text-left font-semibold hidden lg:table-cell">Cirujano</th>
                <th className="pb-2 text-right font-semibold">Duración</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 text-slate-500 whitespace-nowrap">{formatDate(s.date)}</td>
                  <td className="py-2.5 font-medium text-slate-800 max-w-[180px] truncate">{s.patientName}</td>
                  <td className="py-2.5 hidden md:table-cell">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: (CATEGORY_COLORS[s.surgeryCategory] || '#6b7280') + '20',
                        color: CATEGORY_COLORS[s.surgeryCategory] || '#6b7280'
                      }}>
                      {s.surgeryCategory || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500 hidden lg:table-cell truncate max-w-[160px]">{s.mainSurgeon}</td>
                  <td className="py-2.5 text-slate-500 text-right whitespace-nowrap">{getDurationText(s)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No hay cirugías registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FORM HELPERS
// ============================================================

function FormSection({ title, icon, children, accent = 'teal' }) {
  const styles = {
    teal: 'border-l-teal-500 bg-teal-50/60 text-teal-800',
    blue: 'border-l-blue-500 bg-blue-50/60 text-blue-800',
    indigo: 'border-l-indigo-500 bg-indigo-50/60 text-indigo-800',
    violet: 'border-l-violet-500 bg-violet-50/60 text-violet-800',
    slate: 'border-l-slate-400 bg-slate-50/80 text-slate-700',
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3.5 border-l-[3px] ${styles[accent] || styles.teal}`}>
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 leading-tight">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

const iCls = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder:text-slate-300 bg-white'
const iErr = 'border-red-400 focus:ring-red-400/30 focus:border-red-400'

// ============================================================
// SURGERY FORM
// ============================================================

function SurgeryForm({ onSave, editData, onCancel, surgeons, residents, suppliers, categories }) {
  const [form, setForm] = useState(() => editData
    ? { ...editData }
    : {
      date: new Date().toISOString().split('T')[0],
      durationHours: '2', durationMinutes: '0',
      patientName: '', clinicalRecord: '',
      primaryDiagnosis: '', secondaryDiagnosis: '',
      mainSurgeon: '', residents: [], additionalAssistants: '',
      surgeryCategory: '',
      materialCompany: '',
      screws: [{ id: Date.now(), size: '', quantity: '1' }],
      barsQuantity: '',
      crosslinkUsed: false, crosslinkQuantity: '',
      titaniumMeshUsed: false, titaniumMeshSpecs: '',
      otherInstruments: '',
      observations: '',
    }
  )
  const [errors, setErrors] = useState({})
  const [diagSuggs, setDiagSuggs] = useState([])
  const [showDiag, setShowDiag] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleResident = (name) => set('residents',
    form.residents.includes(name)
      ? form.residents.filter(r => r !== name)
      : [...form.residents, name]
  )

  const addScrew = () => set('screws', [...form.screws, { id: Date.now(), size: '', quantity: '1' }])
  const removeScrew = (id) => set('screws', form.screws.filter(s => s.id !== id))
  const updateScrew = (id, field, val) => set('screws', form.screws.map(s => s.id === id ? { ...s, [field]: val } : s))

  const handleDiag = (val) => {
    set('primaryDiagnosis', val)
    if (val.length > 1) {
      const f = COMMON_DIAGNOSES.filter(d => d.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      setDiagSuggs(f); setShowDiag(f.length > 0)
    } else setShowDiag(false)
  }

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Requerido'
    if (!form.patientName.trim()) e.patientName = 'Requerido'
    if (!form.clinicalRecord.trim()) e.clinicalRecord = 'Requerido'
    if (!form.primaryDiagnosis.trim()) e.primaryDiagnosis = 'Requerido'
    if (!form.mainSurgeon) e.mainSurgeon = 'Requerido'
    if (!form.surgeryCategory) e.surgeryCategory = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => { e.preventDefault(); if (validate()) onSave(form) }

  const needsMaterial = isSpinalCategory(form.surgeryCategory)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{editData ? 'Editar Cirugía' : 'Registrar Nueva Cirugía'}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Campos marcados con (*) son obligatorios</p>
        </div>
      </div>

      {/* Datos Generales */}
      <FormSection title="Datos Generales del Procedimiento" icon={<Calendar className="w-4 h-4" />} accent="teal">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha de la cirugía" required>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className={`${iCls} ${errors.date ? iErr : ''}`} />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </Field>
          <Field label="Duración de la cirugía">
            <div className="flex gap-2">
              <select value={form.durationHours} onChange={e => set('durationHours', e.target.value)}
                className={`${iCls} flex-1`}>
                {Array.from({ length: 13 }, (_, i) => <option key={i} value={i}>{i}h</option>)}
              </select>
              <select value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)}
                className={`${iCls} flex-1`}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m =>
                  <option key={m} value={m}>{m} min</option>
                )}
              </select>
            </div>
          </Field>
          <Field label="Nombre del paciente" required>
            <input type="text" placeholder="Apellido(s), Nombre(s)" value={form.patientName}
              onChange={e => set('patientName', e.target.value)}
              className={`${iCls} ${errors.patientName ? iErr : ''}`} />
            {errors.patientName && <p className="text-xs text-red-500 mt-1">{errors.patientName}</p>}
          </Field>
          <Field label="Historia Clínica N°" required>
            <input type="text" placeholder="HC-2026-XXXX" value={form.clinicalRecord}
              onChange={e => set('clinicalRecord', e.target.value)}
              className={`${iCls} ${errors.clinicalRecord ? iErr : ''}`} />
            {errors.clinicalRecord && <p className="text-xs text-red-500 mt-1">{errors.clinicalRecord}</p>}
          </Field>
        </div>
        <div className="relative">
          <Field label="Diagnóstico principal" required>
            <input type="text" placeholder="Escribir o buscar diagnóstico..."
              value={form.primaryDiagnosis} onChange={e => handleDiag(e.target.value)}
              onBlur={() => setTimeout(() => setShowDiag(false), 150)}
              className={`${iCls} ${errors.primaryDiagnosis ? iErr : ''}`} />
            {errors.primaryDiagnosis && <p className="text-xs text-red-500 mt-1">{errors.primaryDiagnosis}</p>}
            {showDiag && (
              <div className="absolute z-10 left-0 right-0 top-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 overflow-hidden">
                {diagSuggs.map(d => (
                  <button key={d} type="button" onMouseDown={() => { set('primaryDiagnosis', d); setShowDiag(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 border-b border-slate-50 last:border-0 transition-colors">
                    {d}
                  </button>
                ))}
              </div>
            )}
          </Field>
        </div>
        <Field label="Diagnóstico secundario / comorbilidades">
          <input type="text" placeholder="Opcional" value={form.secondaryDiagnosis}
            onChange={e => set('secondaryDiagnosis', e.target.value)} className={iCls} />
        </Field>
      </FormSection>

      {/* Equipo */}
      <FormSection title="Equipo Quirúrgico" icon={<Users className="w-4 h-4" />} accent="blue">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cirujano principal" required>
            <select value={form.mainSurgeon} onChange={e => set('mainSurgeon', e.target.value)}
              className={`${iCls} ${errors.mainSurgeon ? iErr : ''}`}>
              <option value="">Seleccionar cirujano...</option>
              {surgeons.map(s => <option key={s.id} value={s.name}>{s.name} · {s.role}</option>)}
            </select>
            {errors.mainSurgeon && <p className="text-xs text-red-500 mt-1">{errors.mainSurgeon}</p>}
          </Field>
          <Field label="Otros asistentes">
            <input type="text" placeholder="Ej: Dra. Torres, Enf. Ramos" value={form.additionalAssistants}
              onChange={e => set('additionalAssistants', e.target.value)} className={iCls} />
          </Field>
        </div>
        <Field label="Médicos residentes participantes">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-0.5">
            {residents.map(r => {
              const on = form.residents.includes(r.name)
              return (
                <label key={r.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm select-none
                  ${on ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleResident(r.name)} />
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                    ${on ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white'}`}>
                    {on && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="truncate text-xs font-medium">{r.name.replace(/Dr[a]?\. /, '')}</span>
                </label>
              )
            })}
          </div>
        </Field>
      </FormSection>

      {/* Clasificación */}
      <FormSection title="Clasificación de la Cirugía" icon={<Stethoscope className="w-4 h-4" />} accent="indigo">
        <Field label="Categoría quirúrgica" required>
          <select value={form.surgeryCategory} onChange={e => set('surgeryCategory', e.target.value)}
            className={`${iCls} ${errors.surgeryCategory ? iErr : ''}`}>
            <option value="">Seleccionar categoría...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.surgeryCategory && <p className="text-xs text-red-500 mt-1">{errors.surgeryCategory}</p>}
        </Field>
      </FormSection>

      {/* Material */}
      <FormSection title="Material de Osteosíntesis e Instrumental" icon={<Settings className="w-4 h-4" />} accent="violet">
        {!needsMaterial && (
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Seleccione categoría de columna para activar campos de material específico. Puede registrar instrumental libre abajo.
          </p>
        )}
        <Field label="Empresa proveedora del material">
          <select value={form.materialCompany} onChange={e => set('materialCompany', e.target.value)} className={iCls}>
            <option value="">Sin material / No aplica</option>
            {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </Field>

        {needsMaterial && (
          <>
            <Field label="Tornillos utilizados" hint="Agregue una fila por cada medida diferente">
              <div className="space-y-2">
                {form.screws.map(screw => (
                  <div key={screw.id} className="flex gap-2 items-center">
                    <input type="text" placeholder="Medida (ej: 5.5 x 40mm)" value={screw.size}
                      onChange={e => updateScrew(screw.id, 'size', e.target.value)}
                      className={`${iCls} flex-1`} />
                    <input type="number" placeholder="Cant." min="0" value={screw.quantity}
                      onChange={e => updateScrew(screw.id, 'quantity', e.target.value)}
                      className={`${iCls} w-20 text-center`} />
                    <button type="button" onClick={() => removeScrew(screw.id)}
                      disabled={form.screws.length === 1}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 disabled:opacity-30">
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addScrew}
                  className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors">
                  <Plus className="w-4 h-4" /> Agregar medida
                </button>
              </div>
            </Field>

            <Field label="Barras / varillas (cantidad)">
              <input type="number" placeholder="0" min="0" value={form.barsQuantity}
                onChange={e => set('barsQuantity', e.target.value)} className={`${iCls} w-32`} />
            </Field>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <button type="button" onClick={() => set('crosslinkUsed', !form.crosslinkUsed)}
                  className="flex items-center gap-2.5 select-none cursor-pointer">
                  <div className={`w-10 h-6 rounded-full px-1 flex items-center transition-colors duration-200 flex-shrink-0
                    ${form.crosslinkUsed ? 'bg-teal-500' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                      ${form.crosslinkUsed ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Uso de Crosslink</span>
                </button>
                {form.crosslinkUsed && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Cantidad:</span>
                    <input type="number" min="0" value={form.crosslinkQuantity}
                      onChange={e => set('crosslinkQuantity', e.target.value)}
                      className={`${iCls} w-20 text-center`} placeholder="0" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button type="button" onClick={() => set('titaniumMeshUsed', !form.titaniumMeshUsed)}
                  className="flex items-center gap-2.5 select-none cursor-pointer">
                  <div className={`w-10 h-6 rounded-full px-1 flex items-center transition-colors duration-200 flex-shrink-0
                    ${form.titaniumMeshUsed ? 'bg-teal-500' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                      ${form.titaniumMeshUsed ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Malla de Titanio</span>
                </button>
                {form.titaniumMeshUsed && (
                  <input type="text" placeholder="Especificaciones..." value={form.titaniumMeshSpecs}
                    onChange={e => set('titaniumMeshSpecs', e.target.value)}
                    className={`${iCls} flex-1 min-w-[180px]`} />
                )}
              </div>
            </div>
          </>
        )}

        <Field label="Otro instrumental / equipamiento">
          <input type="text" placeholder="Ej: Neuronavegación, microscopio, cage, placa..." value={form.otherInstruments}
            onChange={e => set('otherInstruments', e.target.value)} className={iCls} />
        </Field>
      </FormSection>

      {/* Observaciones */}
      <FormSection title="Observaciones Clínicas" icon={<FileText className="w-4 h-4" />} accent="slate">
        <textarea rows={4} value={form.observations} onChange={e => set('observations', e.target.value)}
          placeholder="Notas relevantes, incidencias intraoperatorias, evolución postoperatoria inmediata, instrucciones especiales..."
          className={`${iCls} resize-none`} />
      </FormSection>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
          Cancelar
        </button>
        <button type="submit"
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
          <Save className="w-4 h-4" />
          {editData ? 'Guardar cambios' : 'Registrar cirugía'}
        </button>
      </div>
    </form>
  )
}

// ============================================================
// SURGERY HISTORY
// ============================================================

function SurgeryHistory({ surgeries, onEdit, onDelete, categories }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [surgeonFilter, setSurgeonFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const surgeonList = useMemo(
    () => [...new Set(surgeries.map(s => s.mainSurgeon).filter(Boolean))].sort(),
    [surgeries]
  )

  const filtered = useMemo(() => {
    let r = [...surgeries].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(s =>
        s.patientName?.toLowerCase().includes(q) ||
        s.clinicalRecord?.toLowerCase().includes(q) ||
        s.primaryDiagnosis?.toLowerCase().includes(q) ||
        s.mainSurgeon?.toLowerCase().includes(q)
      )
    }
    if (catFilter) r = r.filter(s => s.surgeryCategory === catFilter)
    if (surgeonFilter) r = r.filter(s => s.mainSurgeon === surgeonFilter)
    if (monthFilter) r = r.filter(s => getMonthKey(s.date) === monthFilter)
    return r
  }, [surgeries, search, catFilter, surgeonFilter, monthFilter])

  const clearFilters = () => { setSearch(''); setCatFilter(''); setSurgeonFilter(''); setMonthFilter('') }
  const hasFilters = search || catFilter || surgeonFilter || monthFilter

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Historial de Cirugías</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} · {surgeries.length} total registrado{surgeries.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar paciente, HC, diagnóstico..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={`${iCls} pl-9`} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className={`${iCls} flex-1 min-w-[150px]`}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={surgeonFilter} onChange={e => setSurgeonFilter(e.target.value)}
            className={`${iCls} flex-1 min-w-[150px]`}>
            <option value="">Todos los cirujanos</option>
            {surgeonList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            className={`${iCls} w-40`} />
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 border border-slate-200 transition-colors flex-shrink-0">
              <X className="w-4 h-4" /> Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Sin resultados</p>
            <p className="text-slate-400 text-sm mt-1">Intente ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Paciente / HC</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Cirujano</th>
                  <th className="px-4 py-3 text-center font-semibold hidden xl:table-cell">Duración</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(s => (
                  <React.Fragment key={s.id}>
                    <tr
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      className={`transition-colors cursor-pointer ${expanded === s.id ? 'bg-slate-50' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">{formatDate(s.date)}</td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="font-semibold text-slate-800 truncate">{s.patientName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.clinicalRecord}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {s.surgeryCategory && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{ backgroundColor: (CATEGORY_COLORS[s.surgeryCategory] || '#6b7280') + '20', color: CATEGORY_COLORS[s.surgeryCategory] || '#6b7280' }}>
                            {s.surgeryCategory}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 hidden lg:table-cell truncate max-w-[160px]">{s.mainSurgeon}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-center hidden xl:table-cell whitespace-nowrap">{getDurationText(s)}</td>
                      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => onEdit(s)}
                            className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {confirmDelete === s.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => { onDelete(s.id); setConfirmDelete(null) }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(s.id)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <tr>
                        <td colSpan={6} className="px-4 pb-4 pt-2 bg-slate-50/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white rounded-xl p-3.5 border border-slate-100">
                              <p className="font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5" /> Diagnósticos
                              </p>
                              <p className="text-slate-800 font-medium">{s.primaryDiagnosis}</p>
                              {s.secondaryDiagnosis && <p className="text-slate-500 mt-1">{s.secondaryDiagnosis}</p>}
                            </div>
                            <div className="bg-white rounded-xl p-3.5 border border-slate-100">
                              <p className="font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" /> Equipo
                              </p>
                              <p className="text-slate-800 font-medium">{s.mainSurgeon}</p>
                              {s.residents?.length > 0 && <p className="text-slate-500 mt-1">Res: {s.residents.join(', ')}</p>}
                              {s.additionalAssistants && <p className="text-slate-500 mt-0.5">Asist: {s.additionalAssistants}</p>}
                            </div>
                            <div className="bg-white rounded-xl p-3.5 border border-slate-100">
                              <p className="font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                                <Settings className="w-3.5 h-3.5" /> Material
                              </p>
                              {s.materialCompany ? (
                                <>
                                  <p className="text-slate-800 font-medium">{s.materialCompany}</p>
                                  {s.screws?.length > 0 && getTotalScrews(s) > 0 && (
                                    <p className="text-slate-500 mt-1">Tornillos: {getTotalScrews(s)} uds — {s.screws.filter(sc => sc.size).map(sc => `${sc.size}×${sc.quantity}`).join(', ')}</p>
                                  )}
                                  {s.barsQuantity && s.barsQuantity !== '0' && <p className="text-slate-500">Barras: {s.barsQuantity}</p>}
                                  {s.crosslinkUsed && <p className="text-slate-500">Crosslink: {s.crosslinkQuantity || 1} ud.</p>}
                                  {s.titaniumMeshUsed && <p className="text-slate-500">Malla Ti: {s.titaniumMeshSpecs || 'Sí'}</p>}
                                </>
                              ) : <p className="text-slate-400">Sin material registrado</p>}
                              {s.otherInstruments && <p className="text-slate-500 mt-1">{s.otherInstruments}</p>}
                            </div>
                            {s.observations && (
                              <div className="sm:col-span-2 xl:col-span-3 bg-amber-50 rounded-xl p-3.5 border border-amber-100">
                                <p className="font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" /> Observaciones
                                </p>
                                <p className="text-amber-900 leading-relaxed">{s.observations}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// INVENTORY / SUPPLIERS
// ============================================================

const MATERIAL_TYPES = [
  { icon: '🔩', label: 'Tornillos pediculares', desc: 'Fijación posterior columna' },
  { icon: '📏', label: 'Barras Ti / CrCo', desc: 'Varillas para sistemas de fijación' },
  { icon: '⬛', label: 'Cages / Implantes', desc: 'TLIF, PLIF, ALIF, cervicales' },
  { icon: '🔲', label: 'Placas cervicales', desc: 'Fijación anterior cervical' },
  { icon: '🟦', label: 'Mallas de titanio', desc: 'Cranioplastía y craneotomía' },
  { icon: '📡', label: 'Neuronavegación', desc: 'Guía intraoperatoria por imagen' },
  { icon: '🔗', label: 'Crosslinks', desc: 'Conectores transversales' },
  { icon: '🧬', label: 'Parche dural', desc: 'Expansores de duramadre' },
]

function Inventory({ suppliers, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', specialty: '', contact: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setForm({ name: '', specialty: '', contact: '' }); setEditId(null); setShowForm(true) }
  const openEdit = (s) => { setForm({ name: s.name, specialty: s.specialty, contact: s.contact }); setEditId(s.id); setShowForm(true) }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editId) await onUpdate(editId, form)
      else await onAdd(form)
      setShowForm(false); setEditId(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Proveedores e Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de empresas y tipos de material</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Agregar proveedor
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-teal-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Nombre de la empresa" required>
              <input type="text" placeholder="Ej: Medtronic" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={iCls} />
            </Field>
            <Field label="Especialidad / productos">
              <input type="text" placeholder="Ej: Columna, Trauma" value={form.specialty}
                onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} className={iCls} />
            </Field>
            <Field label="Contacto / Email">
              <input type="email" placeholder="email@empresa.com" value={form.contact}
                onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} className={iCls} />
            </Field>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
              Cancelar
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-500" />
          <h3 className="font-semibold text-slate-700 text-sm">Empresas proveedoras</h3>
          <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">{suppliers.length}</span>
        </div>
        {suppliers.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Sin proveedores registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {suppliers.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">{s.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500 truncate">{s.specialty || 'Sin especialidad'}</p>
                  {s.contact && <p className="text-xs text-teal-600 mt-0.5">{s.contact}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(s)}
                    className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {confirmDelete === s.id ? (
                    <div className="flex gap-1">
                      <button onClick={async () => { await onDelete(s.id); setConfirmDelete(null) }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(s.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-700 text-sm">Tipos de material de referencia</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {MATERIAL_TYPES.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-700 leading-tight">{t.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// VIEW TITLE MAP
// ============================================================

const VIEW_TITLES = {
  'dashboard': 'Panel de Control',
  'new-surgery': 'Registrar Cirugía',
  'history': 'Historial de Cirugías',
  'inventory': 'Proveedores e Inventario',
}

// ============================================================
// SCREENS: Setup, Login, Loading
// ============================================================

function SetupScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold">NeuroGestión</span>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 text-amber-400 mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold text-sm">Configuración de Firebase requerida</p>
          </div>
          <p className="text-slate-400 text-sm mb-5 leading-relaxed">
            Para activar la base de datos compartida entre todos los médicos del servicio, completa los siguientes pasos:
          </p>
          <ol className="space-y-3 text-sm">
            {[
              <>Ve a <span className="text-teal-400 font-mono">console.firebase.google.com</span> y crea un proyecto</>,
              <>En <strong className="text-white">Firestore Database</strong>, crea una base de datos en modo producción</>,
              <>En <strong className="text-white">Authentication → Sign-in method</strong>, activa Google</>,
              <>En <strong className="text-white">Project Settings → General → Tu aplicación</strong>, copia la config SDK</>,
              <>Pega los valores en <span className="text-teal-400 font-mono">src/firebase.js</span> y ejecuta <span className="text-teal-400 font-mono">npm run deploy</span></>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-teal-600/30 text-teal-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-slate-300 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 pt-5 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Mientras tanto la app funciona en modo local (datos en este navegador). Edita <span className="font-mono text-slate-400">src/firebase.js</span> para activar el modo nube.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin, loading }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-900">
          <Brain className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">NeuroGestión</h1>
        <p className="text-slate-400 text-sm mb-2">Servicio Dr. Marco Melgarejo</p>
        <p className="text-slate-500 text-xs mb-8">Sistema de Gestión Quirúrgica · Neurocirugía</p>
        <button onClick={onLogin} disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-60">
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            : <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
          }
          {loading ? 'Verificando acceso...' : 'Continuar con Google'}
        </button>
        <p className="text-slate-600 text-xs mt-4">
          Solo personal del Servicio de Neurocirugía
        </p>
      </div>
    </div>
  )
}

function LoadingScreen({ message = 'Cargando datos...' }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
        <Brain className="w-7 h-7 text-white" />
      </div>
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

// ============================================================
// APP ROOT
// ============================================================

export default function App() {
  // ── Auth state (Firebase modo anónimo) ───────────────────
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(isConfigured)

  // ── Data state ────────────────────────────────────────────
  const [surgeries, setSurgeries] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dbError, setDbError] = useState(null)
  const seeded = useRef(false)

  // ── Local (non-Firebase) fallback ─────────────────────────
  const [localSurgeries, setLocalSurgeries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ng_surgeries_v3')) || MOCK_SURGERIES }
    catch { return MOCK_SURGERIES }
  })
  const [localSuppliers, setLocalSuppliers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ng_suppliers_v2')) || INITIAL_SUPPLIERS }
    catch { return INITIAL_SUPPLIERS }
  })

  // ── UI state ──────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('dashboard')
  const [editingSurgery, setEditingSurgery] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // ── Persist local data ────────────────────────────────────
  useEffect(() => {
    if (!isConfigured) {
      localStorage.setItem('ng_surgeries_v3', JSON.stringify(localSurgeries))
    }
  }, [localSurgeries])
  useEffect(() => {
    if (!isConfigured) {
      localStorage.setItem('ng_suppliers_v2', JSON.stringify(localSuppliers))
    }
  }, [localSuppliers])

  // ── Firebase auth listener (auto sign-in anónimo) ────────
  useEffect(() => {
    if (!isConfigured) return
    return onAuthStateChanged(auth, async u => {
      if (u) {
        setUser(u)
        setAuthLoading(false)
      } else {
        // Sin sesión → entrar automáticamente de forma anónima
        try { await signInAnonymously(auth) }
        catch { setAuthLoading(false) }
      }
    })
  }, [])

  // ── Firestore subscriptions (when logged in) ──────────────
  useEffect(() => {
    if (!isConfigured || !user) return
    setDataLoading(true)
    setDbError(null)
    let unsub1, unsub2
    const init = async () => {
      if (!seeded.current) {
        seeded.current = true
        await seedIfEmpty(MOCK_SURGERIES, INITIAL_SUPPLIERS).catch(console.error)
      }
      unsub1 = subscribeSurgeries(
        data => { setSurgeries(data); setDataLoading(false) },
        err => { setDbError(err.message); setDataLoading(false) }
      )
      unsub2 = subscribeSuppliers(setSuppliers)
    }
    init().catch(err => { setDbError(err.message); setDataLoading(false) })
    return () => { unsub1?.(); unsub2?.() }
  }, [user])

  // ── Helpers ───────────────────────────────────────────────
  const activeSurgeries = isConfigured ? surgeries : localSurgeries
  const activeSuppliers = isConfigured ? suppliers : localSuppliers

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const navigate = v => { setEditingSurgery(null); setCurrentView(v) }

  const handleSignIn = async () => {
    setSigningIn(true)
    try { await signInWithPopup(auth, provider) }
    catch (e) { if (e.code !== 'auth/popup-closed-by-user') showToast(e.message, 'error') }
    finally { setSigningIn(false) }
  }

  const handleSignOut = async () => {
    await fbSignOut(auth)
    setSurgeries([]); setSuppliers([])
    seeded.current = false
  }

  // ── CRUD handlers ─────────────────────────────────────────
  const handleSaveSurgery = async data => {
    try {
      if (isConfigured) {
        if (editingSurgery) await updateSurgery(editingSurgery.id, data)
        else await addSurgery(data)
      } else {
        if (editingSurgery)
          setLocalSurgeries(p => p.map(s => s.id === editingSurgery.id ? { ...data, id: s.id } : s))
        else
          setLocalSurgeries(p => [...p, { ...data, id: Date.now() }])
      }
      showToast(editingSurgery ? 'Cirugía actualizada correctamente' : 'Cirugía registrada exitosamente')
      setEditingSurgery(null)
      setCurrentView('history')
    } catch (e) { showToast('Error al guardar: ' + e.message, 'error') }
  }

  const handleDelete = async id => {
    try {
      if (isConfigured) await deleteSurgery(id)
      else setLocalSurgeries(p => p.filter(s => s.id !== id))
      showToast('Registro eliminado', 'error')
    } catch (e) { showToast('Error al eliminar: ' + e.message, 'error') }
  }

  const handleEdit = s => { setEditingSurgery(s); setCurrentView('new-surgery') }
  const handleNewSurgery = () => { setEditingSurgery(null); setCurrentView('new-surgery') }
  const handleCancelForm = () => { setEditingSurgery(null); setCurrentView(editingSurgery ? 'history' : 'dashboard') }

  // ── Supplier callbacks ────────────────────────────────────
  const handleAddSupplier = async data => {
    if (isConfigured) await addSupplier(data)
    else setLocalSuppliers(p => [...p, { ...data, id: Date.now() }])
  }
  const handleUpdateSupplier = async (id, data) => {
    if (isConfigured) await updateSupplier(id, data)
    else setLocalSuppliers(p => p.map(s => s.id === id ? { ...s, ...data } : s))
  }
  const handleDeleteSupplier = async id => {
    if (isConfigured) await deleteSupplier(id)
    else setLocalSuppliers(p => p.filter(s => s.id !== id))
  }

  // ── Render gates ──────────────────────────────────────────
  if (isConfigured && (authLoading || dataLoading))
    return <LoadingScreen message={authLoading ? 'Conectando...' : 'Sincronizando datos...'} />

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Sidebar
          currentView={currentView}
          setCurrentView={navigate}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          user={user}
          onSignOut={isConfigured ? handleSignOut : null}
        />

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)} />
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar setOpen={setSidebarOpen} title={VIEW_TITLES[currentView] || 'NeuroGestión'} />

          {/* Cloud sync indicator */}
          {isConfigured && (
            <div className="px-4 md:px-6 py-1.5 bg-teal-50 border-b border-teal-100 flex items-center gap-2 flex-shrink-0">
              <Cloud className="w-3.5 h-3.5 text-teal-500" />
              <p className="text-xs text-teal-700 font-medium">Modo nube activo — datos sincronizados en tiempo real</p>
            </div>
          )}

          {dbError && (
            <div className="px-4 md:px-6 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-red-700">{dbError}</p>
              <button onClick={() => setDbError(null)}><X className="w-3.5 h-3.5 text-red-400" /></button>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {currentView === 'dashboard' && (
              <Dashboard surgeries={activeSurgeries} onNew={handleNewSurgery} />
            )}
            {currentView === 'new-surgery' && (
              <SurgeryForm
                onSave={handleSaveSurgery}
                editData={editingSurgery}
                onCancel={handleCancelForm}
                surgeons={SURGEONS}
                residents={RESIDENTS}
                suppliers={activeSuppliers}
                categories={SURGERY_CATEGORIES}
              />
            )}
            {currentView === 'history' && (
              <SurgeryHistory
                surgeries={activeSurgeries}
                onEdit={handleEdit}
                onDelete={handleDelete}
                categories={SURGERY_CATEGORIES}
              />
            )}
            {currentView === 'inventory' && (
              <Inventory
                suppliers={activeSuppliers}
                onAdd={handleAddSupplier}
                onUpdate={handleUpdateSupplier}
                onDelete={handleDeleteSupplier}
              />
            )}
          </main>
        </div>

        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </div>
    </>
  )
}
