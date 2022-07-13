const sql = require('mssql');
const config = {
  user: "automation",
  password: "@utomation",
  // user: "sa",
  // password: "@utomatic99",
  database: "SAR",
  server: '172.20.30.46',
  // server: '172.23.10.51',
  pool: {
    // max: 10,
    // min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  }
}

exports.qureyR = async (input) => {
  try {
    await sql.connect(config)
    
    const result = await sql.query(input).then((v) => {
      // console.log(`---------------`);
      // console.log(v);  
      out = v;   
      // console.log(`---------------`);
      return v;
    
    }).then(() => sql.close())
  
    //  console.dir(result)
    return out;
  } catch (err) {
    return err;
  }
};


// .then((v) => console.log(v))
//     .then(() => sql.close())

