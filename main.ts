

// do things, eventually

//WYLO
// currently following this guide: https://developers.google.com/looker-studio/connector/build
// not sure exactly what the data format is supposed to look like yet.

const cc = DataStudioApp.createCommunityConnector();

/*
    These are the functions Looker Studio itself calls:
    getAuthType sets up authentication (I think this might need some changes to use Sheets?)

    getConfig seems to be how to pass data through

*/

function getAuthType() {
    const AuthTypes = cc.AuthType;
    return cc.newAuthTypeResponse().setAuthType(AuthTypes.NONE).build();
}


function getConfig() {
    // https://developers.google.com/looker-studio/connector/reference#configtype
    const config = cc.getConfig();
    const sheetCoreConfigDemo = "timestamp:0,\nareaId:1\n"
    config.newInfo().setId('setup-main').setText("Single Sheet Setup");
    config.newTextInput().setId("sheetId").setName("Spreadsheet ID").setHelpText("The last string of characters in the URL for your spreadsheet").setPlaceholder("25-lOnG-BuNcHa-CH4rAct3RZ");
    config.newTextInput().setId("tabName").setName("Spreadsheet Tab Name").setHelpText("The name of the tab you're trying to access").setPlaceholder("demoData")
    config.newTextInput().setId("headerRow").setName("Header Row Position").setHelpText("Zero-indexed header row position").setPlaceholder(0)
    config.newCheckbox().setId("use_softColumns").setName("Use Softcoded Columns").setHelpText("If you think your underlying data might get a column or two in the future and you want it to automatically show up, set this to true.")
    config.newTextArea().setId("sheetCoreColumns").setName("SheetCore Column Config").setHelpText("your sheetCore columnConfig").setPlaceholder(sheetCoreConfigDemo)
    return config.build();
}

// interface schemaReturn {
    
// }

function getSchema(request) {
    // https://developers.google.com/looker-studio/connector/reference#getschema
    
    return {
        schema:getFields().build()
    }

}


function getData(request:getDataRequest) {
    // first step: load up config data
    const configData = request.configParams
    const configDataOutput: string = "currentConfig:\n" + JSON.stringify(JSON.parse(configData["sheetCoreColumns"])) + "use softcoded columns:" + configData["use_softColumns"]
    // cc.newUserError().setDebugText("DU_USER:" + JSON.stringify(configData)).setText(configDataOutput).throwException()
    
    let dataSheet:SheetData


    // I literally have no idea what this is doing...
    let requestedFields = getFields().forIds(
        request.fields.map(function (field) {
            return field.name
        })
    )

    try {

        let sheetConfig: sheetDataEntry = {
            requireRemote: true,
            sheetId:configData["sheetId"],
            tabName: configData["tabName"],
            headerRow: +configData["headerRow"],
            initialColumnOrder: undefined,
            includeSoftcodedColumns: false
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

    let outData: kiDataEntry[] = []
    const keysToKeep = ["kiDate","np"]
    for (const entry of rawData) {
        let output: kiDataEntry = {}
        for (const key of keysToKeep) {
            output[key] = entry[key]
        }
        outData.push(output)
    }

    return {
        schema: requestedFields.build(),
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