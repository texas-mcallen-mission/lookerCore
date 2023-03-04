

// do things, eventually

//WYLO
// currently following this guide: https://developers.google.com/looker-studio/connector/build
// not sure exactly what the data format is supposed to look like yet.

const cc = DataStudioApp.createCommunityConnector();

const dsTypes = cc.FieldType
const dsAggTypes = cc.AggregationType

function getAuthType() {
    const AuthTypes = cc.AuthType;
    return cc.newAuthTypeResponse().setAuthType(AuthTypes.NONE).build();
}

interface firstRequestConfig {
    sheetId: string,
    tabName: string,
    headerRow: number,
    use_softColumns: boolean,
    sheetCoreColumns: string; // gets converted to JSON
}

function convertToFirstRequest_(request: object): firstRequestConfig {
    const output: firstRequestConfig = {
        sheetId: '',
        tabName: '',
        headerRow: 0,
        use_softColumns: false,
        sheetCoreColumns: '',
        ...request
    };

    return output;
}

const COLUMN_ID_PREFIX = "column_id_";

const DATA_TYPE_OPTIONS = { "NUMBER": "Number", "TEXT": "Text", "DATE_TIME": "Date Time", "DATE": "Date", "BOOLEAN": "Boolean" };

function getConfig(request) {
    const configParams = request["configParams"];
    const isFirstRequest = configParams === undefined;
    // https://developers.google.com/looker-studio/connector/reference#configtype
    const config = cc.getConfig();
    if (isFirstRequest) {
        config.setIsSteppedConfig(true);
    }
    const sheetCoreConfigDemo = "{\n    timestamp:0,\n    areaId:1\n}";
    config.newInfo().setId('setup-main').setText("Single Sheet Setup");
    config.newTextInput().setId("sheetId").setName("Spreadsheet ID").setHelpText("The last string of characters in the URL for your spreadsheet").setPlaceholder("25-lOnG-BuNcHa-CH4rAct3RZ");
    config.newTextInput().setId("tabName").setName("Spreadsheet Tab Name").setHelpText("The name of the tab you're trying to access").setPlaceholder("demoData");
    config.newTextInput().setId("headerRow").setName("Header Row Position").setHelpText("Zero-indexed header row position").setPlaceholder("0");
    config.newCheckbox().setId("use_softColumns").setName("Use Softcoded Columns").setHelpText("If you think your underlying data might get a column or two in the future and you want it to automatically show up, set this to true.");
    config.newTextArea().setId("sheetCoreColumns").setName("SheetCore Column Config").setHelpText("your sheetCore columnConfig").setPlaceholder(sheetCoreConfigDemo);

    const typedConfig = convertToFirstRequest_(request.configParams);
    console.log(typedConfig);
    if (!isFirstRequest) {
        //step one: verify that sheets are accessible, and that the given column config is valid.
        try {
            SpreadsheetApp.openById(typedConfig.sheetId);
        } catch (error) {
            cc.newUserError().setDebugText("Unable to access spreadsheet").setText("Unable to access spreadsheet!").throwException();
        }
        try {
            {
                JSON.parse(typedConfig.sheetCoreColumns);
            }
        } catch (error) {
            cc.newUserError().setDebugText("JSON Parsing Error:" + error).setText("JSON Parsing Error: Please note that JSON spec requires double quotes around all keys\n" + error).throwException();

        }
        // at this point, we should be able to guarantee that things will at least mostly work.
        const columnConfig: columnConfig = JSON.parse(typedConfig.sheetCoreColumns);

        const columnKeys = Object.keys(columnConfig);

        for (const column of columnKeys) {
            const option = config.newSelectSingle().setId(COLUMN_ID_PREFIX + column).setName(column);
            for (const entry in DATA_TYPE_OPTIONS) {
                option.addOption(config.newOptionBuilder().setLabel(DATA_TYPE_OPTIONS[entry]).setValue(entry));
            }
        }

    }

    return config.build();
}


// pushFest
function _getField(fields: GoogleAppsScript.Data_Studio.Fields, fieldId) {
    switch (fieldId) {
        case 'thirdDimension':
            fields.newDimension()
                .setId('thirdDimension')
                .setType(dsTypes.TEXT);
            break;
        case 'areaId':
            fields.newDimension()
                .setId('areaId')
                .setType(dsTypes.TEXT);
            break;
        case 'np':
            fields.newMetric()
                .setId('np')
                .setType(dsTypes.NUMBER).setAggregation(dsAggTypes.SUM)
            break;
        default:
            throw new Error('invalid fieldId: ${fieldId}');
    }
    return fields;
}

interface convertedConfigData {
    sheetId: string,
    tabName: string,
    headerRow: number,
    use_softColumns: boolean,
    sheetCoreColumns: string,
    columnConfig:columnConfig, // might as well do this here instead of json parsing it EVERYWHERE
    columnTypes:columnData
}

interface columnData {
    [index:string]:"NUMBER"|"TEXT"|"DATE_TIME"|"DATE"|"BOOLEAN" // these are the types accessible via the dropdown
}

function convertToConfigData(configParams: object): convertedConfigData{
    // Because there doesn't seem to be a way to nest things in the data studio configurator
    // and so we've stuck a big string at the beginning to disambiguate the config stuff from the column configuration
    // here's how we convert it back into something useful again.
    const output:convertedConfigData = {
        sheetId: '',
        tabName: '',
        headerRow: 0,
        use_softColumns: false,
        sheetCoreColumns: '',
        columnConfig: {},
        columnTypes: {}
    }
    for (const key in configParams) {
        // if COLUMN_ID_PREFIX is part of the key, we don't toss it directly into the output.
        if (key.includes(COLUMN_ID_PREFIX)) {
            let name = String(key).replace(COLUMN_ID_PREFIX, "");
            output.columnTypes[name] = configParams[key];
        } else if (key == "sheetCoreColumns") {
            output.columnConfig = JSON.parse(configParams[key])
            output.sheetCoreColumns = configParams[key]
        } else {
            output[key] = configParams[key]
        }
    }

    return output
}

function addDimension_(fields: GoogleAppsScript.Data_Studio.Fields): GoogleAppsScript.Data_Studio.Field{
    return fields.newDimension()
}

function addMetric_(fields: GoogleAppsScript.Data_Studio.Fields): GoogleAppsScript.Data_Studio.Field {
    return fields.newMetric();
}

function getFields(fields:GoogleAppsScript.Data_Studio.Fields, columns: columnData) {
    for (const key in columns) {
        const switcher = columns[key]
        switch (switcher) {
            case "NUMBER":
                addMetric_(fields).setId(key).setAggregation(dsAggTypes.AUTO).setType(dsTypes.NUMBER);
                break;
            case "BOOLEAN":
                addDimension_(fields).setId(key).setType(dsTypes.BOOLEAN);
                break;
            case "DATE":
                addDimension_(fields).setId(key).setType(dsTypes.YEAR_MONTH_DAY);
                break;
            case "DATE_TIME":
                addDimension_(fields).setId(key).setType(dsTypes.YEAR_MONTH_DAY_SECOND);
                break;
            case "TEXT":
                addDimension_(fields).setId(key).setType(dsTypes.TEXT);
                break;
            
        }
    }
}

function getSchema(request) {
    let fields = cc.getFields()
    // get config data back out:
    let configParams = request["configParams"]
    let configData = convertToConfigData(configParams)
    getFields(fields, configData.columnTypes)
    
    // let columns = ['thirdDimension', 'areaId', 'np']
    // columns.forEach(fieldId => {
    //     fields = _getField(fields, fieldId)
    // })
    // fields.setDefaultMetric('np')
    // fields.setDefaultDimension('thirdDimension')
    return {
        'schema':fields.build()
    }
}

function generateData(): kiDataEntry[]{
    const output: kiDataEntry[] = []
    for (let i = 0; i < 20; i++){
        const entry = {
            "areaId": "A" + Math.floor(Math.random() * 10000),
            "np": Math.floor(Math.random() * 10),
            "thirdDimension": "F"+Math.floor(Math.random() * 1000)
        }
        output.push(entry)
    }
    return output
}

function generateBetterData(columnData: columnData): kiDataEntry[]{
    const output = []

    for (let i = 0; i < 20; i++){
        const outEntry: kiDataEntry = {}
        for (let column in columnData) {
            switch (columnData[column]) {
                case "BOOLEAN":
                    outEntry[column] = true
                    break;
                case "NUMBER":
                    outEntry[column] = Math.floor(Math.random() * 20);
                    break;
                case "DATE":
                    outEntry[column] = new Date();
                    break;
                case "DATE_TIME":
                    outEntry[column] = new Date();
                    break;
                case "TEXT":
                    outEntry[column] = "AAA" + Math.floor(Math.random() * 1000);
                    break;
                default:
                    break;
            }
        }
    }

    return output
}

function getData(request: getDataRequest) {
    //following a guide from Medium.  Wish me luck.
    // https://medium.com/analytics-vidhya/creating-a-google-data-studio-connector-da7b35c6f8d5
    // https://developers.google.com/looker-studio/connector/reference#default
    let fields = cc.getFields();
    // get config data back out:
    let configParams = request["configParams"];

    
    let configData = convertToConfigData(configParams);
    let unCulledColumns = configData.columnTypes

    const fieldIds:string[] = request.fields.map(field => field.name);
    
    let culledColumns: columnData = {}
    
    for (const fieldId of fieldIds) {
        culledColumns[fieldId] = unCulledColumns[fieldId]
    }

    getFields(fields, culledColumns)
    for (const fieldId of fieldIds) {
        fields = _getField(fields, fieldId)
    }
    // fieldIds.forEach(fieldId => {
    //     fields = _getField(fields, fieldId);
    // });

    const kiData = generateBetterData(culledColumns);
    let dataOut: { values: (string | number)[] }[] = []
    
    for(let entry of kiData){
        const output = []
        for (let key of fieldIds) {
            output.push(entry[key])
        }
        dataOut.push({ values: output })

    }
    console.log(fieldIds)
    console.log(Object.keys(kiData[0]))
    console.log
    // const testOutput = []

    return {
        schema: fields.build(),
        rows: dataOut,
        data:dataOut
    }


}



/*
    These are the functions Looker Studio itself calls:
    getAuthType sets up authentication (I think this might need some changes to use Sheets?)

    getConfig seems to be how to pass data through

*/




function isAdminUser() {
    return true
}





// 
function test() {
    console.log(getAuthType);
}