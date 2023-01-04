const express = require('express');
const bodyParser = require('body-parser');

const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')

const {getContractById, getContracts} = require('./controllers/contracts')
const {getUnpaidJobs, payForJob} = require('./controllers/jobs')
const {depositToClientBalance} = require('./controllers/balances')
const {getBestProfessional, getBestClients} = require('./controllers/admin')

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.get('/contracts/:id',getProfile, getContractById)
app.get('/contracts', getProfile, getContracts)

app.get(`/jobs/unpaid`, getProfile, getUnpaidJobs)
app.post('/jobs/:job_id/pay', getProfile, payForJob)

app.post('/balances/deposit/:userId', depositToClientBalance)

app.get('/admin/best-profession', getBestProfessional)
app.get('/admin/best-clients', getBestClients)

module.exports = app;
