const depositToClientBalance = async (req, res) => {
  const {Profile, Job, Contract} = req.app.get('models')

  const contracts = await Contract.findAll({
      where: {ClientId: req.params.userId},
      include: {
          model: Job
      }
  })

  const constractsParsed = JSON.parse(JSON.stringify(contracts, null, 4))

  const jobs = constractsParsed.reduce((acc, contract) => {
      return [...acc, ...contract.Jobs]
  }, [])

  const jobPrices = jobs.reduce((acc, job) => {
      return acc + job.price
  }, 0)

  const maxDepositSum = (jobPrices/100) * 25

  if (req.body.depositSum > maxDepositSum) {
      res.status(401).end()
      return
  }
  else {
      await Profile.increment('balance', { by: req.body.depositSum, where: { id: req.params.userId } });
  }

  res.status(200).end()
}

module.exports = {depositToClientBalance}
