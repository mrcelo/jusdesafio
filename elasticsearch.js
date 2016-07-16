var elasticsearch = require('elasticsearch');

var elasticClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log:  'info'
});

var indexName = "randomindex";


/**
 * Delete an existing index
 */
function deleteIndex() {
    return elasticClient.indices.delete({
        index: indexName
    });
}
exports.deleteIndex = deleteIndex;

/**
 * create the index
 */
function initIndex() {
    return elasticClient.indices.create({
        index: indexName
    });
}
exports.initIndex = initIndex;

/**
 * check if the index exists
 */
function indexExists() {
    return elasticClient.indices.exists({
        index: indexName
    });
}
exports.indexExists = indexExists;

function initMapping() {
    return elasticClient.indices.putMapping({
        index: indexName,
        type:  "entity",
        body:  {
            properties: {
                title:      { type: "string" },
                entitytype: { type: "string" },
                suggest:    {
                    type:            "completion",
                    analyzer:        "simple",
                    search_analyzer: "simple",
                    payloads:        true
                }
            }
        }
    });
}
exports.initMapping = initMapping;

// addEntity initializes the store; from app.js
function addEntity( entity ) {
    return elasticClient.index({
        index: indexName,
        type:  "entity",
        body:  {
            title:      entity.title,
            entitytype: entity.entitytype,
            suggest:    {
                input:   entity.title.split(" "),
                output:  entity.title,
                payload: entity.metadata || {}
            }
        }
    });
}
exports.addEntity = addEntity;

// createEntity creates at runtime
function createEntity( entity, callback ) {
    elasticClient.create({
        index: indexName,
        type:  "entity",
        body:  {
            title:      entity.title,
            entitytype: entity.entitytype,
            suggest:    {
                input:   entity.title.split(" "),
                output:  entity.title,
                payload: entity.metadata || {}
            }
        }
    }).then(function ( resp ) {
        callback(resp);
    }, function ( err ) {
        callback(err.message);
        console.log(err.message);
    });


}
exports.createEntity = createEntity;


function getSuggestions( input ) {
    return elasticClient.suggest({
        index: indexName,
        type:  "entity",
        body:  {
            docsuggest: {
                text:       input,
                completion: {
                    field: "suggest",
                    fuzzy: true
                }
            }
        }
    })
}

exports.getSuggestions = getSuggestions;


module.exports.searchForTitle = function ( searchData, callback ) {
    elasticClient.search({
        index: indexName,
        type:  'entity',
        body:  {
            query: {

                match: {
                    "title": searchData
                }


            }

        }
    }).then(function ( resp ) {
        callback(resp.hits.hits);
    }, function ( err ) {
        callback(err.message);
        console.log(err.message);
    });
};
module.exports.searchForType  = function ( searchData, callback ) {
    elasticClient.search({
        index: indexName,
        type:  'entity',
        body:  {
            query: {

                match: {
                    "entitytype": searchData
                }


            }

        }
    }).then(function ( resp ) {
        callback(resp.hits.hits);
    }, function ( err ) {
        callback(err.message);
        console.log(err.message);
    });
};

module.exports.searchForTypeAndTitle = function ( title, type, callback ) {
    elasticClient.search({
        index: indexName,
        type:  'entity',
        body:  {
            query: {

                bool: {
                    must: [
                        { "term": { "title": title } },
                        { "term": { "entitytype": type } }

                    ]


                }


            }

        }
    }).then(function ( resp ) {
        callback(resp.hits.hits);
    }, function ( err ) {
        callback(err.message);
        console.log(err.message);
    });
};
//
// function getEntitiesByType(input) {
//     return elasticClient.search({
//         index: 'indexName',
//         q: 'entitytype:' + input;
//
//     })
// }
// exports.getEntitiesByType = getEntitiesByType;

module.exports.search = function ( searchData, callback ) {
    elasticClient.search({
        index: indexName,
        type:  'entity',
        body:  {
            "query": {
                "wildcard": {

                    "title": {
                        "value": "*" + searchData + "*"
                    }
                }
            }

        }
    }).then(function ( resp ) {
        callback(resp.hits.hits);
    }, function ( err ) {
        callback(err.message);
        console.log(err.message);
    });
};


module.exports.getAll = function ( callback ) {
    elasticClient.search({
        index: indexName,
        type:  'entity',
        body:  {
            query: {

                match_all: {}


            }

        }
    }).then(function ( resp ) {
        callback(resp);
    }, function ( err ) {
        callback(err.message);
        console.log(err.message);
    });
};