const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbpath = path.join(__dirname, 'covid19India.db')

let db = null
const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server run Successfully')
    })
  } catch (err) {
    console.log(err.message())
    process.exit(1)
  }
}
initializeDbServer()

//API 1
const convertresponseToObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
app.get('/states/', async (request, response) => {
  const GetallDataquery = `
    SELECT * 
    FROM state;
    `
  const resultArr = await db.all(GetallDataquery)
  response.send(
    resultArr.map(eachitem => {
      return convertresponseToObject(eachitem)
    }),
  )
})

//API 2
app.get('/states/:stateId/', async (request, response) => {
  const stateId = request.params
  const getoneonjectOnId = `
  SELECT *
  FROM state
  WHERE 
    state_id = ${stateId};
  `
  const result = await db.get(getoneonjectOnId)
  const stateDetails = convertresponseToObject(result)
  response.send(stateDetails)
})
//API 3
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postQuery = `
  INSERT INTO district
    (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
  `
  const addDistrict = await db.run(postQuery)
  const districtId = addDistrict.lastID
  response.send('District Successfully Added')
})

//API 4
const convertdistrictsnakeToCamel = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
app.get('/districts/:districtId/', async (request, response) => {
  const districtId = request.params
  const DistrictOnDistrictId = `
  SELECT *
  FROM district
  where
    district_id = ${districtId};
  `
  const districtObject = await db.get(DistrictOnDistrictId)
  response.send(convertdistrictsnakeToCamel(districtObject))
})

//API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const districtId = request.params
  const deleteDistrictQuery = `
  DELETE FROM district
  WHERE district_id = ${districtId};
  `
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//API 6
app.put('/districts/:districtId/', async (request, response) => {
  const districtId = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const UpdateDistrict = `
  UPDATE district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE 
    district_id = ${districtId};
  `
  await db.run(UpdateDistrict)
  response.send('District Details Updated')
})

// API 7
const convertSnakeAsCamel = dbObject => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  }
}
app.get('/states/:stateId/stats/', async (request, response) => {
  const stateId = request.params
  const StatisticsOfDistrict = `
  SELECT
    sum(cases) as cases,
    sum(cured) as cured,
    sum(active) as active,
    sum(deaths) as deaths
  FROM district
  WHERE 
    state_id = ${stateId};
  `
  const stats = await db.run(StatisticsOfDistrict)
  //const statisticsreturnObject = convertSnakeAsCamel(resultStatistics)
  response.send({
    totalCases: stats["cases"],
    totalCured: stats["cured"],
    totalActive: stats["active"],
    totalDeaths: stats["deaths"]
  })
})

//Api 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const districtId = request.params
  const stateNameQuery = `
  SELECT 
    *
  FROM state innerjoin district
    on state.state_id = district.state_id
  where district_id = ${districtId}
  ;`
  const stateNameResult = await db.get(stateNameQuery)
  response.send(
    stateNameResult.map(eachItem => ({stateName: eachItem.state_name})),
  )
})
module.exports = app
