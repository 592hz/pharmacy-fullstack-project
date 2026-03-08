
import {useEffect,useState} from "react"
import axios from "axios"

export default function Medicines(){

const [data,setData] = useState([])

useEffect(()=>{
axios.get("http://localhost:5000/api/medicines")
.then(res=>setData(res.data))
},[])

return(
<div>
<h2>Medicines</h2>

<table border="1" cellPadding="10">
<thead>
<tr>
<th>Name</th>
<th>Price</th>
<th>Stock</th>
</tr>
</thead>

<tbody>
{data.map(m=>(
<tr key={m._id}>
<td>{m.name}</td>
<td>{m.price}</td>
<td>{m.stock}</td>
</tr>
))}
</tbody>
</table>

</div>
)
}
