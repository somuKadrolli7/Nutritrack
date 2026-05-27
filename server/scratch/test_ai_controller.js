const ctrl = require('../controllers/aiController');
const httpMocks = require('node-mocks-http');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const req = httpMocks.createRequest({
  method: 'POST',
  url: '/api/ai/chat',
  body: { message: 'Hello' },
  user: { _id: '64f7fed310a84b4887b60425' } // mock object ID format
});

const res = httpMocks.createResponse();

// Mock req.io
req.io = {
  to: () => ({
    emit: () => {}
  })
};

console.log('Starting controller chat test...');
ctrl.chat(req, res).then(() => {
  console.log('Finished.');
  console.log('Status Code:', res.statusCode());
  console.log('Data:', res._getData());
}).catch(err => {
  console.error('Error caught outside:', err);
});
