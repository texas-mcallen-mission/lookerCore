

// do things, eventually


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

    config.newInfo().setId('sheetId').setText("Enter Sheet ID");
    config.newTextInput().setId("package").setName("Please Enter a sheet id").setHelpText("I dunno what I'm doing").setPlaceholder("aaaaaa");

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