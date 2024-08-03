const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const Stripe = require('stripe');
const stripe = Stripe('your-stripe-secret-key');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your-mysql-username',
  password: 'your-mysql-password',
  database: 'your-database-name'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});

// Route for handling payment
app.post('/buy-meals', async (req, res) => {
  const { amount, currency, customerName, customerEmail } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
      receipt_email: customerEmail,
    });

    // Store customer data in MySQL
    const customerData = { name: customerName, email: customerEmail, amount };
    const sql = 'INSERT INTO customers SET ?';
    db.query(sql, customerData, (err, result) => {
      if (err) throw err;
      console.log('Customer data inserted:', result.insertId);
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      message: 'Payment initiated successfully',
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send({ error: 'Payment initiation failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
