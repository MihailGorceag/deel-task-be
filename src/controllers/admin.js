const { Op } = require("sequelize");

const {groupBy} = require('../utils')

const getBestProfessional = async (req, res) => {
  const {Profile, Job, Contract} = req.app.get('models')
  const {start, end} = req.query

  const startTimeStamp = +new Date(start)
  const endTimeStamp = +new Date(end)

  const jobsInTimeRange = await Job.findAll({where: {
      paymentDate : {
          [Op.lte]: new Date(endTimeStamp),
          [Op.gte]: new Date(startTimeStamp)
      }
  }})


  const jobsInTimeParsed = JSON.parse(JSON.stringify(jobsInTimeRange, null, 2));


  const mapContractIdToJobPrices = jobsInTimeParsed.reduce((acc, job) => {
      if (acc[job.ContractId]) {
          acc[job.ContractId] = acc[job.ContractId] + job.price
          return acc
      }

      return {...acc, [job.ContractId]: job.price}
  }, {})
  

  let biggestPrice = 0
  let contractId = 0
  for (contractId in mapContractIdToJobPrices) {
      if (mapContractIdToJobPrices[contractId] > biggestPrice) {
          biggestPrice = mapContractIdToJobPrices[contractId]
          contractId = contractId
      }
  }


  const contract = await Contract.findOne({
      where: {id: contractId},
  })

  const bestProfessional = await Profile.findOne({where: {
      id: contract.ContractorId
  }})

  res.json({bestProfessional: bestProfessional.profession})
}

const getBestClients = async (req, res) => {
  const {Profile, Job, Contract} = req.app.get('models')
  const {start, end} = req.query
  const limit = req.query.limit || 2

  const startTimeStamp = +new Date(start)
  const endTimeStamp = +new Date(end)

  const jobsInTimeRange = await Job.findAll({
      where: {
          paymentDate : {
              [Op.lte]: new Date(endTimeStamp),
              [Op.gte]: new Date(startTimeStamp)
          },
      },
      include: {
          model: Contract,
          include: {
              model: Profile,
              as: 'Client',
              where: {
                  type: 'client'
              }
          }
      }
  })

  const jobsInTimeRangeParsed = JSON.parse(JSON.stringify(jobsInTimeRange, null, 2))


  const pricesAndClients = jobsInTimeRangeParsed.map((job) => {
      return {...job.Contract.Client, jobPrice: job.price}
  })


  const clientsGroupedById = groupBy(pricesAndClients, client => client.id)


  const clients = []
  for (clientId in clientsGroupedById) {
      const clientsWithTheSameId = clientsGroupedById[clientId]
      const merged = clientsWithTheSameId.reduce((acc, client) => {
          return {...client, ...acc, jobPrice: acc.jobPrice + client.jobPrice}
      }, {jobPrice: 0})

      clients.push(merged)
  }

  const clientsSortedByJobPrice = [...clients].sort((a, b) => {
      return a.jobPrice < b.jobPrice
  })


  const formatedListOfClients = clientsSortedByJobPrice.map(client => {
      return {
          id: client.id,
          fullName: `${client.firstName} ${client.lastName}`,
          paid: client.jobPrice
      }
  })

  res.json({clients: formatedListOfClients.slice(0, limit)})

}



module.exports = {getBestProfessional, getBestClients}