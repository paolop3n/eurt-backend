require('dotenv').config();
const express = require('express');
const Web3 = require('web3');
const fs = require('fs');

const app = express();
app.use(express.json());

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));
const abi = JSON.parse(fs.readFileSync('./contract/EURT_ABI.json', 'utf8'));
const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Security headers
const helmet = require('helmet');
app.use(helmet());

// API key middleware
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== process.env.API_KEY) return res.status(401).send('Unauthorized');
  next();
});

// Mint endpoint
app.post('/mint', async (req, res) => {
  const { to, amount } = req.body;
  try {
    const tx = await contract.methods.mint(to, web3.utils.toWei(amount.toString(), 'ether')).send({
      from: account.address,
      gas: 100000,
    });
    res.send({ txHash: tx.transactionHash });
  } catch (err) {
    res.status(500).send({ error: 'Minting failed', details: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
