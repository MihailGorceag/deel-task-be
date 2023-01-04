const { Op } = require("sequelize");

const getContractById = async (req, res) =>{
  const {Contract} = req.app.get('models')
  const {id} = req.params

  const contract = await Contract.findOne({where: {id, ContractorId: req.profile.id}})

  if(!contract) return res.status(404).end()
  res.json(contract)
}

const getContracts = async (req, res) => {
  const {Contract} = req.app.get('models')

  const contracts = await Contract.findAll({where: {
      [Op.or]: [{ContractorId: req.profile.id}, {ClientId: req.profile.id}],
      status: ['in_progress', 'new']
  }}) 

  res.json(contracts)
}

module.exports = {getContractById, getContracts}