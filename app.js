const express = require('express')
const {connect} = require('./db.config')
const {UserRouter} = require('./Routes/admin.routes')
const cors = require('cors')
const app = express()

app.use(express.json())
app.use(cors())





app.use('/admin',UserRouter)



















app.listen(process.env.PORT, async()=>{
  try{
     await connect
     console.log('Everything is running perfect')
  }catch(err){
console.log(err)
  }
})