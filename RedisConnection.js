const redis  = require('redis');

const client = redis.createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

const RedisServer = async () =>{

   try{
       client.on('error',err => {if(process.env.NODE_ENV==="development") console.error('Redis connection error' + err)});
       await client.connect();
   }
   catch(err){
       client.disconnect();
   }
}

module.exports = {RedisServer,client};
