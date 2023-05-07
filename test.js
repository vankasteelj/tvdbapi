//// FILL ME ////
const apikey = '' // <your_api_key>
const id = 71663 // the simpsons' tvdb id
///////////////


console.time('Time elapsed')
const tvdb = new (require('./tvdb.js'))({
  apikey: apikey
})
  
tvdb.series.extended({id: id}).then(response => {
  console.log(response)
  console.log('\n\nTest status: %s', response.status)
  console.timeEnd('Time elapsed')
}).catch(error => {
  console.error(error)
  console.log('\n\nTest status: failed')
  console.timeEnd('Time elapsed')
})