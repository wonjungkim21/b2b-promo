const cors = require('cors');
const config = require('../config/config');

module.exports = cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('허용되지 않은 origin입니다.'));
    }
  },
});
