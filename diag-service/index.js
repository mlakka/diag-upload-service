const fileUpload = require('express-fileupload');
const express = require('express')
const app = express();
const port = 8000;

const promBundle = require('express-prom-bundle')

const metricsMiddleware = promBundle({
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
const diagDir = 'diags'
app.use(fileUpload());
app.use(express.static(diagDir))

app.post('/upload', (req, res) => {
    const end = httpRequestTimer.startTimer();
    const route = req.originalUrl;

    if (!req.files || Object.keys(req.files).length === 0) {
        end({ route, code: res.status(400).statusCode, method: req.method })
        return res.send('No files uploaded.');
    }
    let diag = req.files.diag;
    diag.mv(`${diagDir}/${diag.name}`, function (err) {
        if (err) {
            end({ route, code: res.status(500).statusCode, method: req.method })
            return res.send(err);
        }
    });
    end({ route, code: res.status(200).statusCode, method: req.method })
    res.send(`File ${diag.name} uploaded`);
})

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.get('/download/:id', (req, res) => {
    res.sendFile(req.params.id, {root: diagDir})
})

app.get('/', (req, res) => {
    res.send('Diag Service')
});

app.listen(port, () => {
    console.log(`App is listening on port ${port}!, metrics are exposed on http://localhost:8000/metrics`)
});