// request information provided by Looker studio.
interface getDataRequest {
    "configParams": object, // includes whatever stuff you asked for in getConfig
    "scriptParams": {
        "sampleExtraction": boolean,
        "lastRefresh": string;
    },
    "dateRange": {
        "startDate": string,
        "endDate": string;
    },
    "fields": fieldEntry[]
    "dimensionsFilters": [
        [{
            "fieldName": string,
            "values": string[],
            "type": DimensionsFilterType,
            "operator": FilterOperator;
        }]
    ];
}

type fieldEntry = {"name":string}



type DimensionsFilterType = "INCLUDE"|"EXCLUDE"

enum FilterOperator {
"EQUALS"="EQUALS",
"CONTAINS"="CONTAINS",
"REGEXP_PARTIAL_MATCH"="REGEXP_PARTIAL_MATCH",
"REGEXP_EXACT_MATCH"="REGEXP_EXACT_MATCH",
"IN_LIST"="IN_LIST",
"IS_NULL"="IS_NULL",
"BETWEEN"="BETWEEN",
"NUMERIC_GREATER_THAN"="NUMERIC_GREATER_THAN",
"NUMERIC_GREATER_THAN_OR_EQUAL"="NUMERIC_GREATER_THAN_OR_EQUAL",
"NUMERIC_LESS_THAN"="NUMERIC_LESS_THAN",
"NUMERIC_LESS_THAN_OR_EQUAL"="NUMERIC_LESS_THAN_OR_EQUAL",
}