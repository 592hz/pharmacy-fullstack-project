import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from "chart.js"

import { Line } from "react-chartjs-2"
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)
export default function Dashboard() {
    const data = {
        labels: [
            "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
            "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
            "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
        ],
        datasets: [
            {
                label: "Doanh thu",
                data: new Array(31).fill(0),
                borderColor: "#1e88e5",
                backgroundColor: "#1e88e5"
            }
        ]
    }
    return (
        <div style={{ padding: 20 }}>
            {/* Thống kê */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 20
            }}>
                <Card title="Hóa đơn - Ngày" value="0" sub="0 - Trả lại" />
                <Card title="Nhập hàng - Tháng" value="0" sub="0 - Chờ liên thông" />
                <Card title="Hóa đơn - Tháng" value="0" sub="0 - Chờ liên thông" />
                <Card title="Hàng cận date" value="1" sub="1 - Đã hết hạn" />
            </div>
            <div style={{ display: "flex", marginTop: 20 }}>
                {/* Chart */}
                <div style={{
                    flex: 3,
                    background: "#fff",
                    padding: 20,
                    borderRadius: 10
                }}>
                    <h3>Doanh thu</h3>

                    <Line data={data} />
                </div>
            </div>
        </div>
    )
}

function Card({ title, value, sub }) {
    return (
        <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
        }}>
            <h4>{title}</h4>
            <h2 style={{ color: "#1976d2" }}>{value}</h2>
            <p style={{ color: "#666" }}>{sub}</p>
        </div>
    )
}
