const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  if (!cpf) {
    return response.status(400).json({ error: 'CPF not informed!' });
  }

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(404).json({ error: 'Customer not found!' });
  }
  request.customer = customer;
  return next();
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    customer => cpf === customer.cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists!' });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });
  return response.status(201).send();
});

app.get('/account', (request, response) => {
  return response.json(customers);
});

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  if (!amount || amount <= 0) {
    return response.status(400).json({ error: 'Invalid amount!' });
  }

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00:00');

  const statement = customer.statement.filter(
    statement =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;

  if (!name) {
    return response.status(400).json({ error: 'Name not informed!' });
  }

  if (name === request.customer.name) {
    return response.status(400).json({ error: 'Name already in use!' });
  }

  request.customer.name = name;
  return response.status(201).send();
});

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);
});

app.listen(3333);
