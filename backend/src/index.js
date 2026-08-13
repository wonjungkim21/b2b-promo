const config = require('./config/config');
const app = require('./app');

app.listen(config.port, () => {
  console.log(`서버가 포트 ${config.port}에서 실행중입니다.`);
});
