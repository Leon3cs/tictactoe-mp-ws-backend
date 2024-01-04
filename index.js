import express from "express";
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { router as matchRouter } from './routers/match.js'

// create an express app and use JSON
let app = new express();
app.use(express.json());

// setup the root level GET to return swagger
const swaggerDocument = YAML.load('./docs/api.yml')
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/match', matchRouter)

// start listening
const port = process.env.PORT || 8000
app.listen(port, () => {
    console.log(`Listening for request on port ${port}`)
});
