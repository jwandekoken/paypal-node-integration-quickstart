const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

const create_payment_json = {
  "intent": "sale",
  "payer": {
    "payment_method": "paypal"
  },
  "redirect_urls": {
    "return_url": `${process.env.HOST}:${process.env.PORT}/payment-callback`,
    "cancel_url": `${process.env.HOST}:${process.env.PORT}/payment-cancel-callback`
  },
  "transactions": [{
    "item_list": {
      "items": [{
        "name": "Drogas",
        "sku": "666",
        "price": "50.00",
        "currency": "BRL",
        "quantity": 1
      }]
    },
    "amount": {
      "currency": "BRL",
      "total": "50.00"
    },
    "description": "This is the payment description."
  }]
};

exports.postCreatePayment = (req, res, next) => {
  paypal.payment.create(create_payment_json, (error, payment) => {

    if (error) {
      console.log('Payment creation failed', error);
      res.status(500).send(`Payment creation failed ${error}`);
      throw error;

    } else {
      console.log("Payment creation successfully", payment);

      let linkObj = {};

      // estamos loopando aqui pelo "payment.links" para pegar o link que possui rel igual a "approval_url"
      for(let i = 0; i < payment.links.length; i++) {

        if(payment.links[i].rel.toString() === "approval_url") {
          linkObj = payment.links[i];
        }
      }
      console.log('linkObj: ', linkObj);
      res.redirect(linkObj.href);
    }
  });
}

exports.paymentCallback = (req, res, next) => {
  // get payment data from url
  const paymentId = req.query.paymentId;
  const token = req.query.token;
  const payerId = req.query.PayerID;

  console.log('paymentId:', paymentId);
  console.log('token:', token);
  console.log('payerId:', payerId);

  // get payment data
  paypal.payment.get(paymentId, (error, paymentData) => {

    if (error) {
      console.log(error);
      throw error;

    } else {

      console.log("Get Payment Response: ", paymentData);
      //res.json(paymentData)

      // check payment data
      if(
        paymentData.httpStatusCode === 200 && 
        paymentData.state.toString() === "created" && 
        paymentData.id.toString() === paymentId.toString() &&
        payerId.toString() === paymentData.payer.payer_info.payer_id
        ) {

        // execute payment
        paypal.payment.execute(paymentData.id, { "payer_id" : payerId }, (error, executedPayment) => {

          if(error) {
            res.send("Ocorreu algum erro no pagamento");
          
          } else {
            console.log('executedPayment: ', executedPayment);
            res.status(200).json(executedPayment);
          }

        })
      }
    }
  });
}



