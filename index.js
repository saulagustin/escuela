import express from "express";
import fs, { write } from "fs"
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.use(express.json());

const readData = () => {
try{
    const data = fs.readFileSync("./db.json", "utf-8");
    return JSON.parse(data);   
}catch(err){
    console.error("Error leyendo db.json:", err);
    return { sclavos: [] };
};
};

const writedata = (data) =>{
    try{
        fs.writeFileSync("./db.json", JSON.stringify(data))
        return JSON.parse(data);
    }catch(error){
        console.log(error)
    };
};

app.get("/",(req,res) => {
    res.send("bienvenido a mi primer api con nodejs !¡");

});

app.get("/sclavos", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const sclavos = data.sclavos.find((s) => s.id === id);

    res.json(data.sclavos);
});

app.post("/sclavos", (req, res) =>{
const data = readData();
const body = req.body;
const newsclavos = {
    id: data.sclavos.length + 1,
    ...body
};
  data.sclavos.push(newSclavo);
  writedata(data);
  res.json(newSclavo);
});



app.listen(3000, () =>{
    console.log("servidor escuchando por el puerto 3000")
});

app.put("/sclavos/:id",(req, res) =>{

    const data =readData();
    const body = req.body;
    const id =parseInt(req.params.id);
    const sclavosIndex = data.sclavos.findIndex((slcavos) => sclavos.id ===id);
    data.sclavos[sclavosIndex]= {
    ...data.sclavos[sclavosIndex],
    ...body,
    };
writedata(data);
res.json({message:"Los datos del esclavo an diso actualizados"})

});