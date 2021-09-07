import express, { response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const app = express()

app.use(express.json())

const customers = []

// Middleware
function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' })
  }

  req.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((balance, operation) => {
    if (operation.type === 'credit') {
      return balance + operation.amount
    } else {
      return balance - operation.amount
    }
  }, 0)

  return balance
}

app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if (customerAlreadyExists) {
    return res.status(422).json({ error: 'Customer already exists' })
  }

  const id = uuidv4()

  customers.push({
    cpf,
    name,
    id,
    statement: []
  })

  return res.status(201).send()
})

app.use(verifyIfExistsAccountCPF)

app.get('/statement', (req, res) => {
  return res.json(req.customer.statement)
})

app.post('/deposit', (req, res) => {
  const { description, amount } = req.body
  const { customer } = req

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)

  res.status(201).send()
})

app.post('/withdraw', (req, res) => {
  const { amount } = req.body
  const { customer } = req

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return res.status(422).json({ error: 'Insufficient funds' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)

  res.status(201).send()
})

app.listen(3000)
