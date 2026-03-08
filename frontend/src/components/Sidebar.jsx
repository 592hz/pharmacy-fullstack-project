import { Link } from "react-router-dom"

export default function Sidebar() {

    return (
        <div style={{
            width: "220px",
            background: "#1e293b",
            color: "white",
            height: "100vh",
            padding: "20px"
        }}>

            <h2>Pharmacy</h2>

            <ul style={{ listStyle: "none", padding: 0 }}>

                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/products">Medicines</Link></li>
                <li><Link to="/orders">Sales</Link></li>
                <li><Link to="/users">Suppliers</Link></li>


            </ul>

        </div>
    )

}