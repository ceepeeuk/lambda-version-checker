const AWS = require('aws-sdk');
const Table = require('cli-table');

AWS.config.update({ region: 'eu-west-2'});

async function  getVersion(lambda, functions) {
    const functionsWithVersion = [];
    for (let i = 0; i < functions.length; i++) {
        const result =  await lambda.listTags({ Resource: functions[i].arn}).promise();
        functionsWithVersion.push({
            version: result.Tags.version || 'not set',
            ...functions[i],
        });
    }
    return functionsWithVersion;
}

async function getFunctions(env) {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: env});
    const lambda = new AWS.Lambda();
    const results = await lambda.listFunctions({}).promise();
    const pattern = new RegExp(`${env}-`, 'g');
    const functions = results.Functions.map(x => ({
        shortName: x.FunctionName.replace(pattern, ''),
        fullName: x.FunctionName,
        arn: x.FunctionArn,
    }));
    return getVersion(lambda, functions);
}

async function run() {
    const [dev, test, prod ] = await Promise.all([
        getFunctions('dev'),
        getFunctions('test'),
        getFunctions('prod'),
    ]);

    const table = new Table({
        head: ['name', 'dev', 'test', 'prod']
        , colWidths: [80, 20, 20, 20]
    });

    dev.sort((a, b) => (a.shortName > b.shortName) ? 1 : -1);
    dev.forEach(d => {
        table.push([
            d.shortName,
            d.version,
            test.find(x => d.shortName === x.shortName) !== undefined
              ? test.find(x => d.shortName === x.shortName).version
              : 'unreleased',
            prod.find(x => d.shortName === x.shortName) !== undefined
              ? prod.find(x => d.shortName === x.shortName).version
              : 'unreleased',
        ]);
    });

    console.log(table.toString());
}

run().then(() => console.log('\ndone'));
