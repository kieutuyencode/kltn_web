import {
  Calendar,
  Edit2,
  MapPin,
  Trash2,
  FileText,
  Settings,
  CheckSquare,
  History,
  PieChart,
} from "lucide-react";

interface EventCardProps {
  image: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  onManage?: () => void;
  onSummary?: () => void;
  onOrders?: () => void;
  onCheckIn?: () => void;
  onPaymentHistory?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const EventCard = ({
  image,
  title,
  date,
  time,
  location,
  address,
  onManage,
  onSummary,
  onOrders,
  onCheckIn,
  onPaymentHistory,
  onEdit,
  onDelete,
}: EventCardProps) => {
  const actionButtons = [
    { icon: Settings, label: "Quản trị", action: onManage },
    { icon: PieChart, label: "Tổng kết", action: onSummary },
    { icon: FileText, label: "Đơn hàng", action: onOrders },
    { icon: CheckSquare, label: "Check-in", action: onCheckIn },
    { icon: History, label: "Thanh toán", action: onPaymentHistory },
    { icon: Edit2, label: "Chỉnh sửa", action: onEdit },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="md:col-span-1">
          <img
            src={image}
            alt={title}
            className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
          />
        </div>

        <div className="md:col-span-2 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 font-medium">
                  {time}, {date}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 font-medium">{location}</p>
                <p className="text-gray-500 text-sm">{address}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
              {actionButtons.map((btn, index) => (
                <button
                  key={index}
                  onClick={btn.action}
                  className="flex flex-col items-center gap-2 text-gray-600 hover:text-red-600 transition-colors group"
                >
                  <div className="p-3 bg-gray-100 group-hover:bg-red-100 rounded-lg transition-colors">
                    <btn.icon className="w-6 h-6 text-gray-700 group-hover:text-red-600" />
                  </div>
                  <span className="text-xs font-medium">{btn.label}</span>
                </button>
              ))}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex flex-col items-center gap-2 text-gray-600 hover:text-red-600 transition-colors group"
                >
                  <div className="p-3 bg-gray-100 group-hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 className="w-6 h-6 text-gray-700 group-hover:text-red-600" />
                  </div>
                  <span className="text-xs font-medium">Xóa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
