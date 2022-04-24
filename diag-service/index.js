const fileUpload = require('express-fileupload');
const express = require('express')
const { createLogger } = require("winston");
const LokiTransport = require("winston-loki");
const promBundle = require('express-prom-bundle');

const app = express();

const port = 8000;

const logger = createLogger({
    transports: [
      new LokiTransport({
        host: "http://loki:3100",
        interval: 5,
        labels: {
          job: 'nodejs'
        }
      })
    ]
  })

const metricsMiddleware = promBundle({
    buckets: [0.1, 0.4, 0.7],
    autoregister: true,
    includeStatusCode: true,
    includePath: true,
    includeMethod: true,
    promClient: {
        collectDefaultMetrics: {
        }
    },
});

app.use(metricsMiddleware);
const diagDir = 'diags';
app.use(fileUpload());
app.use(express.static(diagDir));

app.post('/upload', (req, res) => {
    const route = req.originalUrl;

    if (!req.files || Object.keys(req.files).length === 0) {
        const label = { env: 'dev' };
        const message = 'No files uploaded'; 
        logger['warn']({ message, label });
        return res.status(400).send(message);
    }
    let diag = req.files.diag;
    if(diag){
        if(diag.name.endsWith('.tgz')){
            diag.mv(`${diagDir}/${diag.name}`, function (err) {
                if (err) {
                const label = { env: 'dev' };
                logger['error']({ err, label });
                return res.status(500).send(err);
                }
            });
        }else{
            const label = { env: 'dev' };
            const message = 'diag files can only be .tgz files';
            logger['error']({ message , label });
            return res.status(500).send(message);
        }
    }else{
        const label = { env: 'dev' };
        const message = 'diag key not found in body';
        logger['error']({ message , label });
            return res.status(500).send(message);
    }

    const label = { env: 'dev' };
    const message = `File ${diag.name} uploaded`; 
    logger['info']({ message, label });
    res.send(`File ${diag.name} uploaded`);
})

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.get('/download/:id', (req, res) => {
    res.sendFile(req.params.id, {root: diagDir});
})

app.get('/', (req, res) => {
    res.send('Diag Service');
});

app.listen(port, () => {
    console.log(`App is listening on port ${port}!, metrics are exposed on http://localhost:8000/metrics`);
});