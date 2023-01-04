const { Op } = require("sequelize");

const getUnpaidJobs = async (req, res) => {
  const {Contract, Job, } = req.app.get('models')

  const jobs = await Job.findAll({
      where: {
          paid: {
              [Op.not]: true
          }
      },
      include: {
          model: Contract,
          where: {
              status: ['in_progress', 'new'],
              [Op.or]: [{ContractorId: req.profile.id}, {ClientId: req.profile.id}],
          }
      },

  })

  res.json(jobs)
}

const payForJob = async (req, res) => {
  const {Profile, Job, Contract} = req.app.get('models')

  const [job, client] = await Promise.all([
      Job.findOne({
          where: {id: req.params.job_id},
          include: {
              model: Contract,
          }
      }),
      Profile.findOne({where: {id: req.profile.id}})
  ])  

  if (job.price > client.balance) {
      res.status(401).end()
      return
  }

  const contractor = await Profile.findOne({where: {id: job.Contract.ContractorId}})


  contractor.balance = contractor.balance + job.price
  client.balance = client.balance - job.price
  await Promise.all([contractor.save(), client.save()])        
  res.status(200).end()
}


module.exports = {getUnpaidJobs, payForJob}
