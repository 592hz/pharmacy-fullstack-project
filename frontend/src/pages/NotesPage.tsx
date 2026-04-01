import { useState } from "react"
import { Plus, Trash2, Search, StickyNote, Calendar, Edit3, X, Save } from "lucide-react"
import { toast } from "sonner"
import type { Note } from "@/lib/schemas"
import { noteSchema } from "@/lib/schemas"
import { noteService } from "@/services/note.service"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"
import { getErrorMessage } from "@/lib/utils"

const COLORS = [
    "bg-yellow-100 border-yellow-200 text-yellow-800",
    "bg-blue-100 border-blue-200 text-blue-800",
    "bg-green-100 border-green-200 text-green-800",
    "bg-red-100 border-red-200 text-red-800",
    "bg-purple-100 border-purple-200 text-purple-800",
    "bg-pink-100 border-pink-200 text-pink-800",
]

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [isAdding, setIsAdding] = useState(false)
    const [editingNote, setEditingNote] = useState<Note | null>(null)

    // Form state
    const [newTitle, setNewTitle] = useState("")
    const [newContent, setNewContent] = useState("")
    const [selectedColor, setSelectedColor] = useState(COLORS[0])

    const fetchNotes = async () => {
        setIsLoading(true)
        try {
            const data = await noteService.getAll()
            setNotes(data)
        } catch (error: unknown) {
            toast.error("Không thể tải ghi chú: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotes()
    }, [])

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )

    const handleAddNote = async () => {
        const result = noteSchema.safeParse({
            title: newTitle,
            content: newContent,
        })

        if (!result.success) {
            toast.error(result.error.issues[0].message)
            return
        }

        try {
            const date = new Date().toISOString()
            const newNote = await noteService.create({
                ...result.data,
                date: date,
                color: selectedColor
            })

            const completeNote: Note = {
                ...newNote,
                id: newNote.id || `NOTE${Date.now()}`,
                date: date
            }

            setNotes([completeNote, ...notes])

            setNewTitle("")
            setNewContent("")
            setIsAdding(false)
            toast.success("Đã thêm ghi chú mới")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await noteService.delete(id)
            setNotes(notes.filter(n => n.id !== id))
            toast.error("Đã xóa ghi chú")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const handleUpdateNote = async () => {
        if (!editingNote || !editingNote.id) return
        const result = noteSchema.safeParse(editingNote)
        if (!result.success) {
            toast.error(result.error.issues[0].message)
            return
        }

        try {
            const data = await noteService.update(editingNote.id!, editingNote)
            setNotes(notes.map(n => n.id === data.id ? data : n))
            setEditingNote(null)
            toast.success("Đã cập nhật ghi chú")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const fmtDate = (iso: string) => {
        const d = new Date(iso)
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-neutral-950 p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <StickyNote size={32} className="text-[#5c9a38]" />
                        Ghi chú & Nhắc nhở
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Quản lý các lưu ý quan trọng trong công việc hàng ngày</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5c9a38] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm ghi chú..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-[#5c9a38]/20 focus:border-[#5c9a38] transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all whitespace-nowrap"
                    >
                        {isLoading && <span className="text-[#5c9a38] animate-pulse mr-2 text-sm italic">Đang tải...</span>}
                        <Plus size={18} />
                        Tạo mới
                    </button>
                </div>
            </div>

            {/* Grid of Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Adding Note Card */}
                {isAdding && (
                    <div className={`rounded-3xl border-2 p-6 shadow-xl flex flex-col gap-4 animate-in zoom-in duration-300 ${selectedColor}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50 italic">Ghi chú mới</span>
                            <button onClick={() => setIsAdding(false)} className="opacity-40 hover:opacity-100 transition-opacity"><X size={18} /></button>
                        </div>
                        <input
                            type="text"
                            placeholder="Tiêu đề..."
                            className="bg-transparent border-none outline-none font-bold text-lg placeholder:text-current/30"
                            autoFocus
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            placeholder="Nội dung ghi chú..."
                            className="bg-transparent border-none outline-none text-sm resize-none flex-1 min-h-[100px] placeholder:text-current/30 leading-relaxed"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
                            <div className="flex gap-1.5">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${c.split(' ')[0]} ${selectedColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleAddNote}
                                className="bg-gray-800 text-white p-2 rounded-lg hover:bg-black transition-colors shadow-md"
                            >
                                <Save size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {filteredNotes.map(note => (
                    <div
                        key={note.id}
                        onClick={() => setEditingNote(note)}
                        className={`group relative rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col gap-3 min-h-[220px] ${note.color || 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'}`}
                    >
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-current transition-colors line-clamp-2">{note.title}</h3>
                            <button
                                onClick={(e) => handleDeleteNote(note.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed line-clamp-4 flex-1">{note.content}</p>
                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-black/5 opacity-50">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold tracking-tight uppercase">{fmtDate(note.date)}</span>
                        </div>
                        <div className="absolute right-6 bottom-4 opacity-0 group-hover:opacity-40 transition-opacity">
                            <Edit3 size={14} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredNotes.length === 0 && !isAdding && (
                <div className="flex flex-col items-center justify-center py-24 opacity-20">
                    <StickyNote size={80} />
                    <p className="text-xl font-bold mt-4">Không tìm thấy ghi chú nào</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200 ${editingNote.color || 'bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Chỉnh sửa ghi chú</span>
                            <button onClick={() => setEditingNote(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="text"
                                className="w-full bg-transparent border-b border-black/10 focus:border-[#5c9a38] outline-none font-bold text-2xl py-2"
                                value={editingNote.title}
                                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                            />
                            <textarea
                                className="w-full bg-transparent border-none outline-none text-base resize-none min-h-[200px] leading-relaxed"
                                value={editingNote.content}
                                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-black/5">
                            <div className="flex gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setEditingNote({ ...editingNote, color: c })}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${c.split(' ')[0]} ${editingNote.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleUpdateNote}
                                className="bg-gray-800 text-white px-8 py-3 rounded-2xl hover:bg-black transition-all shadow-lg font-bold active:scale-95"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
