const AWS = require('aws-sdk');
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
    dev.map(x => console.log({ env: 'dev', name: x.shortName, version: x.version}));
    test.map(x => console.log({ env: 'test', name: x.shortName, version: x.version}));
    prod.map(x => console.log({ env: 'prod', name: x.shortName, version: x.version}));
}

run().then(() => console.log('\ndone'));