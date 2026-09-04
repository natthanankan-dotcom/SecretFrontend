import { useMemo, useState } from 'react'

/**
 * ตรงกับเฟรม "Dashboard Page" ใน Figma (node 119:2394 "Room Availability")
 *
 * backend มี endpoint `/api/rooms` จริง แต่คืนแค่เลขห้อง/ชั้น/ค่าเช่าตั้งต้น
 * ยังไม่มีตาราง lease ที่ผูกห้องกับผู้เช่า เลยไม่มีทางรู้สถานะ
 * ว่าง/มีผู้เช่า/ซ่อมบำรุง หรือชื่อผู้เช่า/ใบแจ้งซ่อมจริงได้เลย (README หัวข้อ
 * "ที่ยังไม่มี" ข้อ 1) หน้านี้เป็นหัวใจของแดชบอร์ด (สถานะห้องแบบสีสัน) เลยเลือก
 * ใช้ "ข้อมูลตัวอย่างจาก Figma ตรง ๆ" ทั้งกริด (SAMPLE_FLOORS) เพื่อให้ตรงดีไซน์
 * เป๊ะตามที่ขอ แทนที่จะไปพยายามผสมกับ /api/rooms ที่จริงแล้วไม่มีข้อมูลสถานะให้
 * ใช้ — พอมีตาราง lease + endpoint สถานะห้องจริงค่อยเปลี่ยนมาต่อ API แทน object
 * นี้ทั้งหมด (โครงสร้าง floor/room number ก็บังเอิญตรงกับ 24 ห้อง 2 ชั้นตาม
 * requirement ใน README อยู่แล้ว)
 */

type RoomStatus = 'available' | 'occupied' | 'maintenance'

interface Badge {
  type: 'lease' | 'ticket'
  text: string
}

interface SampleRoom {
  number: string
  status: RoomStatus
  tenant?: string
  badge?: Badge
}

const SAMPLE_FLOORS: { floor: number; rooms: SampleRoom[] }[] = [
  {
    floor: 1,
    rooms: [
      { number: '101', status: 'available' },
      { number: '102', status: 'occupied', tenant: 'Tanaka', badge: { type: 'lease', text: '12 days left' } },
      { number: '103', status: 'available' },
      { number: '104', status: 'available', badge: { type: 'ticket', text: 'AC servicing scheduled' } },
      { number: '105', status: 'available' },
      { number: '106', status: 'maintenance' },
      { number: '107', status: 'available' },
      { number: '108', status: 'available' },
      { number: '109', status: 'available' },
      { number: '110', status: 'available' },
      { number: '111', status: 'available' },
      { number: '112', status: 'available' },
    ],
  },
  {
    floor: 2,
    rooms: [
      { number: '201', status: 'occupied', tenant: 'Smith', badge: { type: 'ticket', text: 'Leaky faucet reported' } },
      { number: '202', status: 'available' },
      { number: '203', status: 'available' },
      { number: '204', status: 'available' },
      { number: '205', status: 'available' },
      { number: '206', status: 'maintenance' },
      { number: '207', status: 'occupied', tenant: 'Lee' },
      { number: '208', status: 'available' },
      { number: '209', status: 'available' },
      { number: '210', status: 'available' },
      { number: '211', status: 'available' },
      { number: '212', status: 'available' },
    ],
  },
]

const STATUS_DOT: Record<RoomStatus, string> = {
  available: '#7c9473',
  occupied: '#c98a4b',
  maintenance: '#b5533c',
}

const FILTERS: { id: RoomStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'occupied', label: 'Occupied' },
  { id: 'maintenance', label: 'Maintenance' },
]

function StatusDot({ status }: { status: RoomStatus }) {
  const color = STATUS_DOT[status]
  return (
    <span
      className="inline-block size-[11px] shrink-0 rounded-[5.5px]"
      style={{ backgroundColor: color, boxShadow: `0 0 0 4px ${color}33` }}
    />
  )
}

function RoomCard({ room }: { room: SampleRoom }) {
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-[#e7e0d3] bg-white px-3 pt-3 pb-3">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold text-[#2b2a26]">{room.number}</p>
        <StatusDot status={room.status} />
      </div>
      {room.tenant && <p className="text-center text-base text-[#4a463f]">{room.tenant}</p>}
      {room.status === 'maintenance' && !room.tenant && <p className="text-[11px] text-[#b5533c]">Maintenance</p>}
      {room.badge && (
        <span
          className={`w-fit rounded-full border px-2 py-[3px] text-[9.5px] font-semibold whitespace-nowrap ${
            room.badge.type === 'lease'
              ? 'border-[#d9a441] bg-[#fbf3de] text-[#8a5f16]'
              : 'border-[#b5533c] bg-[#fbeae5] text-[#b5533c]'
          }`}
        >
          {room.badge.type === 'lease' ? '⚠ ' : '🔧 '}
          {room.badge.text}
        </span>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const allRooms = useMemo(() => SAMPLE_FLOORS.flatMap((f) => f.rooms), [])
  const counts = useMemo(
    () => ({
      available: allRooms.filter((r) => r.status === 'available').length,
      occupied: allRooms.filter((r) => r.status === 'occupied').length,
      maintenance: allRooms.filter((r) => r.status === 'maintenance').length,
    }),
    [allRooms],
  )

  const visibleFloors = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SAMPLE_FLOORS.map((f) => ({
      floor: f.floor,
      rooms: f.rooms.filter((r) => {
        if (filter !== 'all' && r.status !== filter) return false
        if (q && !r.number.includes(q) && !(r.tenant ?? '').toLowerCase().includes(q)) return false
        return true
      }),
    })).filter((f) => f.rooms.length > 0)
  }, [filter, search])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-[34px] font-light text-[#2b2a26]">Room Availability</h1>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#7c9473]" />
            <p className="text-[13px] text-[#767065]">Live Overview</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex min-w-[86px] flex-col items-center gap-0.5 rounded-[10px] border border-[#e7e0d3] bg-white px-[18px] py-2.5">
            <p className="font-heading text-[32px] tracking-[-0.32px] text-[#6b5c4b]">{counts.available}</p>
            <p className="text-[10px] tracking-[0.6px] text-[#767065] uppercase">Available</p>
          </div>
          <div className="flex min-w-[86px] flex-col items-center gap-0.5 rounded-[10px] border border-[#e7e0d3] bg-white px-[18px] py-2.5">
            <p className="font-heading text-[32px] tracking-[-0.32px] text-[#6b5c4b]">{counts.occupied}</p>
            <p className="text-[10px] tracking-[0.6px] text-[#767065] uppercase">Occupied</p>
          </div>
          <div className="flex min-w-[86px] flex-col items-center gap-0.5 rounded-[10px] border border-[#e7e0d3] bg-white px-[18px] py-2.5">
            <p className="font-heading text-[32px] tracking-[-0.32px] text-[#6b5c4b]">{counts.maintenance}</p>
            <p className="text-[10px] tracking-[0.6px] text-[#767065] uppercase">Maint.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-[20px] border px-4 py-[7px] text-[13px] ${
                filter === f.id
                  ? 'border-[#5b3b3b] bg-[#5b3b3b] text-white'
                  : 'border-[#e7e0d3] bg-white text-[#767065] hover:border-[#d9a441]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex min-w-[200px] items-center gap-2 rounded-[20px] border border-[#e7e0d3] bg-white px-3.5 py-[7px]">
          <span className="text-[13px]">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room or tenant..."
            className="min-w-[160px] text-[13px] text-[#2b2a26] outline-none placeholder:text-[#757575]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-1.5">
        <div className="flex items-center gap-1.5">
          <span className="size-[9px] rounded-full bg-[#7c9473]" />
          <p className="text-[12.5px] text-[#767065]">Available</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-[9px] rounded-full bg-[#c98a4b]" />
          <p className="text-[12.5px] text-[#767065]">Occupied</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-[9px] rounded-full bg-[#b5533c]" />
          <p className="text-[12.5px] text-[#767065]">Maintenance (offline)</p>
        </div>
        <p className="border-l border-[#e7e0d3] pl-4 text-[12.5px] text-[#767065]">🔧 Maintenance ticket open</p>
        <p className="text-[12.5px] text-[#767065]">⚠ Lease ending soon</p>
      </div>

      <div className="flex flex-col gap-4 pt-2">
        {visibleFloors.length === 0 && (
          <p className="py-10 text-center text-sm text-[#767065]">ไม่พบห้องที่ตรงกับคำค้นหา/ตัวกรอง</p>
        )}
        {visibleFloors.map((f) => (
          <section key={f.floor} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold text-[#2b2a26]">Floor {f.floor}</h2>
              <div className="h-px flex-1 bg-[#e7e0d3]" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {f.rooms.map((room) => (
                <RoomCard key={room.number} room={room} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(212,194,195,0.3)] bg-[#f6f3f2] px-6 py-8 -mx-6 sm:-mx-8">
        <p className="font-heading text-2xl text-brand">© 2026 Sakura Soul. The Art of Serenity.</p>
        <div className="flex gap-4 text-xs font-medium text-ink-muted">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Sustainability</span>
        </div>
      </div>
    </div>
  )
}
