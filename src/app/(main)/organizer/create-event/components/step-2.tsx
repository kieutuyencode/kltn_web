// src/components/event-creation/Step2_WithDialog.tsx

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import {
  GripVertical,
  MoreVertical,
  Pencil,
  PlusCircle,
  Ticket,
  Trash2,
} from "lucide-react";

// --- Định nghĩa kiểu dữ liệu ---
type Ticket = {
  id: string;
  name: string;
};

type EventSessionType = {
  id: string;
  startTime: string;
  endTime: string;
  tickets: Ticket[];
};

// --- Dữ liệu giả lập ---
const initialSessions: EventSessionType[] = [
  {
    id: "session-1",
    startTime: "2025-10-27T00:00",
    endTime: "2025-10-28T14:29",
    tickets: [{ id: "ticket-1", name: "Vé 1" }],
  },
  {
    id: "session-2",
    startTime: "2025-10-30T09:18",
    endTime: "2025-10-30T12:00",
    tickets: [],
  },
];

// --- Component Form bên trong Dialog ---
const SessionFormContent = ({
  session,
  onSave,
  onCancel,
}: {
  session: EventSessionType | null;
  onSave: (data: EventSessionType) => void;
  onCancel: () => void;
}) => {
  const [startTime, setStartTime] = useState(
    session?.startTime || new Date().toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    session?.endTime || new Date().toISOString().slice(0, 16)
  );
  const [tickets, setTickets] = useState<Ticket[]>(session?.tickets || []);

  const handleSave = () => {
    onSave({
      id: session?.id || `session-${Date.now()}`,
      startTime,
      endTime,
      tickets,
    });
  };

  const handleAddTicket = () => {
    setTickets([
      ...tickets,
      { id: `ticket-${Date.now()}`, name: `Vé ${tickets.length + 1}` },
    ]);
  };

  const handleRemoveTicket = (ticketId: string) => {
    setTickets(tickets.filter((t) => t.id !== ticketId));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {session ? "Chỉnh sửa suất diễn" : "Tạo suất diễn mới"}
        </DialogTitle>
        <DialogDescription>
          Nhập thông tin chi tiết cho suất diễn của bạn. Nhấn lưu khi hoàn tất.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Ngày sự kiện</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="mb-2 block">
                Thời gian bắt đầu
              </Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="mb-2 block">
                Thời gian kết thúc
              </Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">
            <span className="text-red-600">*</span> Loại vé
          </h3>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-2">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-gray-500 cursor-move" />
                    <Ticket className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-sm text-gray-800">
                      {ticket.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-red-600"
                      onClick={() => handleRemoveTicket(ticket.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Chưa có loại vé nào.
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm p-2"
            onClick={handleAddTicket}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Tạo loại vé mới
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button className="bg-red-600 hover:bg-red-700" onClick={handleSave}>
          Lưu
        </Button>
      </DialogFooter>
    </>
  );
};

// --- Component chính: Step2 ---
export const Step2 = () => {
  const [sessions, setSessions] = useState<EventSessionType[]>(initialSessions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSessionType | null>(
    null
  );

  const handleOpenDialogForEdit = (session: EventSessionType) => {
    setEditingSession(session);
    setIsDialogOpen(true);
  };

  const handleOpenDialogForCreate = () => {
    setEditingSession(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Có một độ trễ nhỏ để animation của dialog hoàn tất trước khi reset form
    setTimeout(() => setEditingSession(null), 300);
  };

  const handleSaveSession = (data: EventSessionType) => {
    const index = sessions.findIndex((s) => s.id === data.id);
    if (index > -1) {
      const newSessions = [...sessions];
      newSessions[index] = data;
      setSessions(newSessions);
    } else {
      setSessions([...sessions, data]);
    }
    handleCloseDialog();
  };

  const handleRemoveSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  return (
    <div className="w-full space-y-7">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Thời Gian</h2>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
            <SelectItem value="past">Đã diễn ra</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">
                    {new Date(session.startTime).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(session.startTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-sm text-gray-500">
                    {session.tickets.length} Loại vé
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenDialogForEdit(session)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-primary"
                    onClick={() => handleRemoveSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-5 w-5 text-gray-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={handleOpenDialogForCreate}>
        <PlusCircle className="h-5 w-5 mr-2" />
        Tạo suất diễn
      </Button>

      {/* --- Dialog để Tạo/Sửa --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {/* Render content chỉ khi dialog mở để đảm bảo form được reset đúng cách */}
          {isDialogOpen && (
            <SessionFormContent
              session={editingSession}
              onSave={handleSaveSession}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
