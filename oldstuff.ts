



function getDataOld(request: getDataRequest) {
    // first step: load up config data
    const configData = request.configParams;
    // const configDataOutput: string = "currentConfig:\n" + JSON.stringify(JSON.parse(configData["sheetCoreColumns"])) + "use softcoded columns:" + configData["use_softColumns"]
    // cc.newUserError().setDebugText("DU_USER:" + JSON.stringify(configData)).setText(configDataOutput).throwException()

    let dataSheet: SheetData;


    // I literally have no idea what this is doing...
    // let requestedFields = getFields().forIds(
    //     request.fields.map(function (field) {
    //         return field.name
    //     })
    // )
    let columnConfig: columnConfig;
    // the JSON parser is a little bit finicky.  Adding error state for it.
    try {
        columnConfig = JSON.parse(configData["sheetCoreColumns"]);
    } catch (error) {
        console.error(configData["sheetCoreColumns"]);
        cc.newUserError().setDebugText("JSON Parsing Error:" + error).setText("JSON Parsing Error: Please note that JSON spec requires double quotes around all keys\n" + error).throwException();

    }
    let softColumns: boolean = Boolean(columnConfig["use_softColumns"]);

    // create SheetData Class
    try {

        let sheetConfig: sheetDataEntry = {
            requireRemote: true,
            sheetId: configData["sheetId"],
            tabName: configData["tabName"],
            headerRow: +configData["headerRow"],
            initialColumnOrder: columnConfig,
            includeSoftcodedColumns: softColumns
        };

        dataSheet = new SheetData(new RawSheetData(sheetConfig));
    } catch (error) {
        cc.newUserError().setDebugText("DU_USER:" + "failed to initialize sheetData:" + error).setText("failed to initialize sheetData").throwException();

    }
    let rawData: kiDataEntry[] = []
    try {
        rawData = dataSheet.getData();
    } catch (error) {
        cc.newUserError().setDebugText("loading data failed").setText("Pulling from Sheets failed.").throwException();
    }

    // let outData: (string | number)[][] = []
    let outData = [];
    const keysToKeep = ["kiDate", "np"];
    for (const entry of rawData) {
        let row: (string | number)[] = [];
        for (const key of keysToKeep) {
            row.push(entry[key]);
        }
        outData.push({ values: row });
    }

    return {
        schema: cc.getFields().build(),
        data: outData
    };
}


// this function here is the one we'll modify with our own code in the future.
function getFieldsOld() {
    const fields = cc.getFields();
    const types = cc.FieldType;
    const aggregations = cc.AggregationType;

    fields.newDimension().setId("kiDate").setName("KI Date").setType(types.YEAR_MONTH_DAY);
    fields.newDimension().setId("np").setName("New People").setType(types.NUMBER);

    return fields;

}

function getSchemaOld(request) {
    // https://developers.google.com/looker-studio/connector/reference#getschema

    return {
        schema: getFieldsOld().build()
    };

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