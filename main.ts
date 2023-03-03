

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
    cc.newUserError().setDebugText("DU_USER:" + JSON.stringify(configData)).setText("current config").throwException()
    
    
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