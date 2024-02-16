const mongoose = require('mongoose')
const NewsSchema = mongoose.Schema({
 ImageURL:{
    type:String,
    required:true
},
title:{
    type:String,
    required:true
},
Description:{
    type:String,
    required:true
},
Date:{
 type:String,
 required:true
},
header:{
    type:String,
    required:true
}
},{
    versionKey:false
})

const News = mongoose.model('New', NewsSchema)

module.exports = {News}