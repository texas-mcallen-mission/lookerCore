

// do things, eventually


const cc = DataStudioApp.createCommunityConnector();

function getAuthType() {
    const AuthTypes = cc.AuthType;
    return cc.newAuthTypeResponse().setAuthType(AuthTypes.NONE).build();
}

function test() {
    console.log(getAuthType);
}

function getConfig() {
    const config = cc.getConfig();

    config.newInfo().setId('sheetId').setText("Enter Sheet ID");
    config.newTextInput().setId("package").setName("Please Enter a sheet id").setHelpText("I dunno what I'm doing").setPlaceholder("aaaaaa");

    return config.build();
}