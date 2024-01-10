const mongodb = require('mongodb');
const uri = 'mongodb+srv://benjaminschmelkin:R8aNkky1dquqQsh9@companies.jjo3zkx.mongodb.net/?retryWrites=true&w=majority';

const client = new mongodb.MongoClient(uri);
const db = client.db('cs20_final');

module.exports = { client, db };
