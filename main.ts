

// do things, eventually

//WYLO
// currently following this guide: https://developers.google.com/looker-studio/connector/build
// not sure exactly what the data format is supposed to look like yet.

const cc = DataStudioApp.createCommunityConnector();

const dsTypes = cc.FieldType
const dsAggTypes = cc.AggregationType


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

function getSchema(request) {
    let fields = cc.getFields()
    let columns = ['thirdDimension', 'areaId', 'np']
    columns.forEach(fieldId => {
        fields = _getField(fields, fieldId)
    })
    fields.setDefaultMetric('np')
    fields.setDefaultDimension('thirdDimension')
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



function getData(request: getDataRequest) {
    //following a guide from Medium.  Wish me luck.
    // https://medium.com/analytics-vidhya/creating-a-google-data-studio-connector-da7b35c6f8d5
    // https://developers.google.com/looker-studio/connector/reference#default
    let fields = cc.getFields();
    const fieldIds = request.fields.map(field => field.name);
    fieldIds.forEach(fieldId => {
        fields = _getField(fields, fieldId);
    });

    const kiData = generateData();
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

function getAuthType() {
    const AuthTypes = cc.AuthType;
    return cc.newAuthTypeResponse().setAuthType(AuthTypes.NONE).build();
}

interface firstRequestConfig {
    sheetId:string,
    tabName:string,
    headerRow:number,
    use_softColumns:boolean,
    sheetCoreColumns:string // gets converted to JSON
}

function convertToFirstRequest_(request:object):firstRequestConfig{
    const output:firstRequestConfig = {
        sheetId: '',
        tabName: '',
        headerRow: 0,
        use_softColumns: false,
        sheetCoreColumns: '',
        ...request
    }

    return output
}

const COLUMN_ID_PREFIX = "column_id_"

const DATA_TYPE_OPTIONS = {"NUMBER":"Number","TEXT":"Text","DATE_TIME":"Date Time","DATE":"Date","BOOLEAN":"Boolean"}

function getConfig(request) {
    const configParams = request["configParams"]
    const isFirstRequest = configParams === undefined
    // https://developers.google.com/looker-studio/connector/reference#configtype
    const config = cc.getConfig();
    if(isFirstRequest){
        config.setIsSteppedConfig(true)
    }
    const sheetCoreConfigDemo = "{\n    timestamp:0,\n    areaId:1\n}"
    config.newInfo().setId('setup-main').setText("Single Sheet Setup");
    config.newTextInput().setId("sheetId").setName("Spreadsheet ID").setHelpText("The last string of characters in the URL for your spreadsheet").setPlaceholder("25-lOnG-BuNcHa-CH4rAct3RZ");
    config.newTextInput().setId("tabName").setName("Spreadsheet Tab Name").setHelpText("The name of the tab you're trying to access").setPlaceholder("demoData")
    config.newTextInput().setId("headerRow").setName("Header Row Position").setHelpText("Zero-indexed header row position").setPlaceholder("0")
    config.newCheckbox().setId("use_softColumns").setName("Use Softcoded Columns").setHelpText("If you think your underlying data might get a column or two in the future and you want it to automatically show up, set this to true.")
    config.newTextArea().setId("sheetCoreColumns").setName("SheetCore Column Config").setHelpText("your sheetCore columnConfig").setPlaceholder(sheetCoreConfigDemo)

    const typedConfig = convertToFirstRequest_(request.configParams)
    console.log(typedConfig)
    if(!isFirstRequest){
        //step one: verify that sheets are accessible, and that the given column config is valid.
        try {
            SpreadsheetApp.openById(typedConfig.sheetId)
        } catch (error) {
            cc.newUserError().setDebugText("Unable to access spreadsheet").setText("Unable to access spreadsheet!").throwException()
        }
        try {
            {
                JSON.parse(typedConfig.sheetCoreColumns)
            }
        } catch (error) {
            cc.newUserError().setDebugText("JSON Parsing Error:" + error).setText("JSON Parsing Error: Please note that JSON spec requires double quotes around all keys\n" + error).throwException()

        }
        // at this point, we should be able to guarantee that things will at least mostly work.
        const columnConfig:columnConfig = JSON.parse(typedConfig.sheetCoreColumns)

        const columnKeys = Object.keys(columnConfig)

        for(const column of columnKeys){
            const option = config.newSelectSingle().setId(COLUMN_ID_PREFIX+column).setName(column)
            for(const entry in DATA_TYPE_OPTIONS){
                option.addOption(config.newOptionBuilder().setLabel(DATA_TYPE_OPTIONS[entry]).setValue(entry))
            }
        }

    }

    return config.build();
}

// interface schemaReturn {
    
// }

function getSchemaOld(request) {
    // https://developers.google.com/looker-studio/connector/reference#getschema
    
    return {
        schema:getFields().build()
    }

}

function isAdminUser() {
    return true
}

function testGetData() {
    console.log(getSchemaOld().schema);
    console.log(cc.getFields().build());
    const requestPartial = {
        configParams: {
            sheetId: "REPLACE_AT_RUNTIME",
            tabName: "data",
            headerRow: 0,
            use_softColumns: true,
            sheetCoreColumns: "{areaName: 0,log: 1,areaEmail: 2,isDuplicate: 3,formTimestamp: 4,areaID: 5,kiDate: 6,np: 7,sa: 8,bd: 9,bc: 10,rca: 11,rc: 12,cki: 13}"
        },
    };
    //@ts-ignore this is on purpose for testing.
    const test = getData(requestPartial);
    console.log(test);
}





function getDataOld(request:getDataRequest) {
    // first step: load up config data
    const configData = request.configParams
    // const configDataOutput: string = "currentConfig:\n" + JSON.stringify(JSON.parse(configData["sheetCoreColumns"])) + "use softcoded columns:" + configData["use_softColumns"]
    // cc.newUserError().setDebugText("DU_USER:" + JSON.stringify(configData)).setText(configDataOutput).throwException()
    
    let dataSheet:SheetData


    // I literally have no idea what this is doing...
    // let requestedFields = getFields().forIds(
    //     request.fields.map(function (field) {
    //         return field.name
    //     })
    // )
    let columnConfig: columnConfig
    // the JSON parser is a little bit finicky.  Adding error state for it.
    try {
        columnConfig = JSON.parse(configData["sheetCoreColumns"])
    } catch (error) {
        console.error(configData["sheetCoreColumns"])
        cc.newUserError().setDebugText("JSON Parsing Error:" + error).setText("JSON Parsing Error: Please note that JSON spec requires double quotes around all keys\n"+error).throwException()

    }
    let softColumns:boolean = Boolean(columnConfig["use_softColumns"])
    
    // create SheetData Class
    try {

        let sheetConfig: sheetDataEntry = {
            requireRemote: true,
            sheetId:configData["sheetId"],
            tabName: configData["tabName"],
            headerRow: +configData["headerRow"],
            initialColumnOrder: columnConfig,
            includeSoftcodedColumns: softColumns
        }

        dataSheet = new SheetData(new RawSheetData(sheetConfig))
    } catch (error) {
        cc.newUserError().setDebugText("DU_USER:" + "failed to initialize sheetData:" + error).setText("failed to initialize sheetData").throwException()

    }
    let rawData:kiDataEntry[]
    try {
        rawData = dataSheet.getData()
    } catch (error) {
        cc.newUserError().setDebugText("loading data failed").setText("Pulling from Sheets failed.").throwException()
    }

    // let outData: (string | number)[][] = []
    let outData = []
    const keysToKeep = ["kiDate","np"]
    for (const entry of rawData) {
        let row:(string|number)[] = []
        for (const key of keysToKeep) {
            row.push(entry[key])
        }
        outData.push({ values:row })
    }

    return {
        schema: cc.getFields().build(),
        data:outData
    }
}

// this function here is the one we'll modify with our own code in the future.
function getFields() {
    const fields = cc.getFields()
    const types = cc.FieldType
    const aggregations = cc.AggregationType;

    fields.newDimension().setId("kiDate").setName("KI Date").setType(types.YEAR_MONTH_DAY)
    fields.newDimension().setId("np").setName("New People").setType(types.NUMBER)
    
    return fields

}

// 
function test() {
    console.log(getAuthType);
}