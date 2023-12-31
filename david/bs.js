/* 
   Bootstrap5  (https://www.w3schools.com/bootstrap5/) ; 
   mysql tábla megjelenítése; katt eseményre rekord megjelenítése; popup ablakban rekord módosítás 
   SQL tokenizer
*/

const express = require('express');
const mysql = require('mysql');
const app    = express();
const session = require('express-session');
const port   = 3000;
app.use(express.static('public')); 
let session_data;


app.use(session({ key:'user_sid', secret:'nagyontitkos', resave:true, saveUninitialized:true }));


const conn = mysql.createConnection( {
  host: '10.2.0.20',  /*195.199.230.210 */
  user: 'user',
  port: "3306",
  password: 'Pite137',
  database: 'ITBOLT'     /* create_it_termekek.sql */
});

function strE(s) { return s.replace("'","").replace("\"","").replace("`",""),replace("\t","").replace("\\","");}

function gen_SQL(req) {
  const mezők = [ "ID_TERMEK", "NEV", "AR", "MENNYISEG", "MEEGYS"];
  // ---------------- sql tokenizer ... ---------------
  var where = "";
  var order  = (req.query.order? parseInt(req.query.order)         :   1);
  var limit  = (req.query.limit? parseInt(req.query.limit)         : 100);
  var offset = (req.query.offset? parseInt(req.query.offset)       :   0);
  var id_kat = (req.query.kategoria? parseInt(req.query.kategoria) :  -1);
  var név    = (req.query.nev? req.query.nev :  "");
  var desc   = order < 0? "desc" : "";
  if (order < 0) { order *= -1; }

  if (id_kat > 0)      { where += `k.ID_KATEGORIA=${id_kat} and `;   }
  if (név.length > 0)  { where += `NEV like "${név}%" and `;   }
  if (where.length >0) { where = " where "+where.substring(0, where.length-4);; }

  var sql = 
    `SELECT ID_TERMEK, NEV, k.KATEGORIA AS KATEGORIA, AR, MENNYISEG, MEEGYS
      FROM IT_termekek t INNER JOIN IT_kategoriak k 
      ON t.ID_KATEGORIA = k.ID_KATEGORIA ${where} ORDER BY ${mezők[order-1]} ${desc}
      limit ${limit} offset ${limit*offset}  ;`;
  return (sql);
}

app.post('/tabla', (req, res) => {  
  var sql = gen_SQL(req);
  Send_to_JSON(req, res, sql);
});
let uj = true;

app.post('/logout',   (req, res) => { 
  session_data = req.session;
  uj = true;
  session_data.destroy(function(err) {
        res.json('Session destroy successfully');
        res.end();
    }); 
});


app.post('/login', (req, res) => {
  //session_data.destroy();
  session_data = req.session;
  if(session_data.NEV){
    const response_JSON_data = {
      id_user: session_data.ID_USER,
      nev: session_data.NEV}; 
    res.send(response_JSON_data);
    res.end();  
  }else{
    var sql = 
      `SELECT NEV, EMAIL, PASSWORD
        FROM userek
        WHERE EMAIL="${req.query.usrname}" AND PASSWORD=md5("${req.query.psw}");`;
    
    if(req.query.usrname !== "") uj = false
    conn.query(sql, (error, results) => {
      var data = error ? error : JSON.parse(JSON.stringify(results));
      if(results.length > 0){
        session_data.NEV = results[0]["NEV"];
        session_data.ID_USER = req.query.psw;
        const response_JSON_data = {
          id_user: session_data.ID_USER,
          nev: session_data.NEV}; 
        res.send(response_JSON_data);
        res.end();
      }else{
        if(uj){
          const response_JSON_data = {
            id_user: "blackyerrortkapottmarmegintelegemvanebbol12",
            nev: "blackyerrortkapottmarmegintelegemvanebbol12"}; 
          res.send(response_JSON_data);
          res.end();
        }else{
          const response_JSON_data = {
            id_user: null,
            nev: null}; 
          res.send(response_JSON_data);
          res.end();
        }
      }
  
    
  
    }); 
  }
      
  /*
	res.set('Content-Type', 'application/json; charset=UTF-8');
  res.send("belépés");
	res.end();
  */


});

app.post('/reccount', (req, res) => {  /* limit, offset nélkül? rekord lenne */
    var sql = gen_SQL(req);
    var poz = sql.toUpperCase().lastIndexOf("ORDER BY ");             // nem kell az order by (ha van)
    var sqlcount = "select count(*) as db from ("+sql.substring(0, poz)+") as tabla;"; 
    Send_to_JSON(req, res, sqlcount);
});

app.post('/kategoria', (req, res) => {  /* ---------- kategoria listadoboz ----------- */
    var sql = "SELECT ID_KATEGORIA, KATEGORIA from IT_kategoriak order by KATEGORIA";
    Send_to_JSON(req, res, sql);
});

app.post('/rekord/:id',(req, res) => {
    var sql = `select * from IT_termekek where ID_TERMEK=${req.params.id}`;
    Send_to_JSON(req, res, sql);
});

function Send_to_JSON (req, res, sql) {
  conn.query(sql, (error, results) => {
    var data = error ? error : JSON.parse(JSON.stringify(results));
    console.log(sql);  
    console.log(data); 
    res.set('Content-Type', 'application/json; charset=UTF-8');
    res.send(data);
    res.end();
  }); 
}

app.listen(port, function () { console.log(`bs app listening at http://localhost:${port}`); });