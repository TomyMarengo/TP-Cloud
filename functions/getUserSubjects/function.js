const {Pool} = require('pg')
const jwt = require('jsonwebtoken');

const credentials = {
  "host":"10.0.0.3",
  "database":"postgres",
  "port":"5432",
  "user":"postgres",
  "password":"testing1234"
}

const pool = new Pool(credentials);

const JWT_KEY = 'cloud-tp-key'; // exportar a process.env

exports.getUserSubjects = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if(req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  let code, response;
  
  let authHeader = req.headers['Authorization'];
  if(!authHeader) authHeader = req.headers['authorization']; // case sensitivity for HTTP/2 standard
  if(!authHeader) {
    res.status(403).json({msg: 'Unauthorized.'});
    return;
  }

  const userToken = authHeader.split('Bearer ')[1];
  if(!jwt.verify(userToken, JWT_KEY)) {
    res.status(403).json({msg: `Invalid token: ${userToken}`});
    return;
  }
  
  const {id} = jwt.decode(userToken);

  pool.connect((error, client, release) => {
    if(error) {
      res.status(500).json({msg: 'Error getting pg client'});
      return;
    }
    client.query(`SELECT s.* FROM subjects_users su INNER JOIN subjects s ON su.subject_id = s.id WHERE su.user_id = ${id};`)
    .then(res => {
      code = 200;
      response = res.rows;
    })
    .catch(err => {
      code = 400;
      response = err;
    })
    .finally(() => {
      client.release();
      res.status(code).json({msg: response});
    });
  });
}