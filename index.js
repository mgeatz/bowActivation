console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = (event, context, callback) => {
  console.log('Raw event ', event);
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('Received context ', context);

  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? err.message : JSON.stringify(res),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE'
    },
  });

  if (event.Item !== undefined) {

    if (event.Item.Action === 'ACTIVE') {
      dynamo.deleteItem(JSON.parse(event.body), done);
    } else if (event.Item.Action === 'INACTIVE') {

      console.log('insert data');

      try {
        dynamo.putItem(event, done);
      } catch (e) {
        console.log('unable to insert ', e);
      }

    }

  } else {
    console.log('CHECK HEADERS...');
    console.log('event.headers.bow ', event.headers.bow);

    if (event.headers.bow === 'transactionverification') {
      switch (event.httpMethod) {
        case 'DELETE':
          console.log('DELETE request...');
          dynamo.deleteItem(JSON.parse(event.body), done);
          break;
        case 'GET':
          console.log('GET request...');
          dynamo.scan({ TableName: event.queryStringParameters.TableName }, done);
          break;
        case 'POST':
          console.log('POST request...');
          dynamo.putItem(JSON.parse(event.body), done);
          break;
        case 'PUT':
          console.log('PUT request...');
          dynamo.updateItem(JSON.parse(event.body), done);
          break;
        default:
          console.log('ERROR finding request...');
          done(new Error(`Unsupported method "${event.httpMethod}"`));
      }
    }

  }

};
