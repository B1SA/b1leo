/* Module to interact with SQL Database (PostreSQL) */
/** Persistence Layer (PostGree) library */
var pgClient;

module.exports = {
    Initialize: function (callback) {
        return (Initialize(callback));
    },
    Select: function (callback) {
        return (Select(callback));
    },
    SelectImages: function (callback) {
        return (SelectImages(callback));
    },
    SelectErpItems: function (origin, callback) {
        return (SelectErpItems(origin, callback));
    },
    SelectErpItemsPrices: function (origin, callback) {
        return (SelectErpItemsPrices(origin, callback));
    },
    Insert: function (data, callback) {
        return (Insert(data, callback));
    },
    InsertPrice: function (data, callback) {
        return (InsertPrice(data, callback));
    },
    UpdateVector: function (data, callback) {
        return (UpdateVector(data, callback));
    },
    setClient: function (inClient) { pgClient = inClient; },
    Clean: function (callback) {
        return (Clean(callback));
    }
}

function Initialize(callback) {
    console.log('Initializing PostgreSQL database')

    var query = 'CREATE TABLE IF NOT EXISTS '
        + 'smbmkt_items (productid varchar(256) NOT NULL, origin varchar(10) NOT NULL, image varchar(500), imgvector text,'
        + 'PRIMARY KEY (productid, origin)); '
        + 'CREATE TABLE IF NOT EXISTS '
        + 'smbmkt_itemsprice (productid varchar(256) NOT NULL, origin varchar(10) NOT NULL, price decimal, currency varchar(10),'
        + 'PRIMARY KEY (productid, origin)); '


    if (pgClient) {
        pgClient.query(query, function (err, result) {
            if (err) {
                console.error("Error Initializing PostgreSQL db: " + err.message)
                callback(err.message)
            } else {
                console.log('PostgreDB initialized')
                callback(null)
            }
        });
    }
}

function Select(callback) {
    var query = 'SELECT * FROM smbmkt_items'
    pgClient.query(query, function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result.rows)
        }
    });
}

function SelectErpItems(origin, callback) {
    var query = 'SELECT * FROM smbmkt_items where origin = $1'
    pgClient.query(query, [origin], function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result.rows)
        }
    });
}

function SelectErpItemsPrices(origin, callback) {
    var query = 'SELECT * FROM smbmkt_itemsprice where origin = $1'
    pgClient.query(query, [origin], function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result.rows)
        }
    });
}

function SelectImages(callback) {
    var query = 'SELECT * FROM smbmkt_items where imgvector IS NOT null'
    pgClient.query(query, function (err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result.rows)
        }
    });
}

function Insert(data, callback) {
    if (!data.hasOwnProperty('imgvector')) {
        data.imgvector = null;
    }

    console.log('PG Inserting Table data for ' + data.origin + ' item ' + data.productid)

    var query = 'INSERT INTO smbmkt_items(productid,origin,image,imgvector) '
        + 'VALUES($1, $2, $3, $4) '
        + 'ON CONFLICT (productid,origin) DO UPDATE '
        + 'SET image = $3'

    pgClient.query(query, [data.productid, data.origin, data.image, data.imgvector], function (err, result) {
        if (err) {
            console.error(err)
            if (typeof callback === "function") { callback(err) }
        } else {
            if (typeof callback === "function") { callback(null, result) }
        }
    });
}

function InsertPrice(data, callback) {
    
    console.log('PG Inserting Price data for ' + data.origin + ' item ' + data.productid)

    var query = 'INSERT INTO smbmkt_itemsprice(productid,origin,price,currency) '
        + 'VALUES($1, $2, $3, $4) '
        + 'ON CONFLICT (productid,origin) DO UPDATE '
        + 'SET price = $3, currency = $4'

    pgClient.query(query, [data.productid, data.origin, data.price, data.currency], function (err, result) {
        if (err) {
            console.error(err)
            if (typeof callback === "function") { callback(err) }
        } else {
            if (typeof callback === "function") { callback(null, result) }
        }
    });
}

function UpdateVector(data, callback) {
    console.log('PG Updating Vector Table for ' + data.origin + ' item ' + data.productid)

    var pgvector = data.imgvector;
    pgvector ="["+pgvector.toString()+"]" 

    var query = 'UPDATE smbmkt_items SET imgvector = $3 WHERE productid = $1 and origin = $2';
    
    pgClient.query(query, [data.productid, data.origin, pgvector], function (err, result) {
        if (err) {
            console.error(err)
            if (typeof callback === "function") { callback(err) }
        } else {
            if (typeof callback === "function") { callback(null, result) }
        }
    });
}

function Clean(callback) {
    var query = 'DELETE FROM smbmkt_items'
    pgClient.query(query, function (err, result) {
        if (err) {
            console.error("Clean DB " + err)
            callback(err)
        } else {
            callback(null, result.rows)
        }
    });
}