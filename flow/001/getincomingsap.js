const express = require("express");
var axios = require('axios');
const router = express.Router();
// var mssql = require('./../../function/mssql');
var mongodb = require('./../../function/mongodb');
var mongodbMAIN = require('./../../function/mongodbMAIN');
// var mssqlREPORT = require('../../function/mssqlR');


let DBNAME = "IncommingData_GASGW";
let COLECTIONNAME = "main_data_GASGW";
var request = require('request');
// var b64toBlob = require('b64-to-blob');

function _base64ToArrayBuffer(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function objectIdWithTimestamp(timestamp) {
    /* Convert string date to Date object (otherwise assume timestamp is a date) */
    if (typeof (timestamp) == 'string') {
        timestamp = new Date(timestamp);
    }

    /* Convert date object to hex seconds since Unix epoch */
    var hexSeconds = Math.floor(timestamp / 1000).toString(16);

    /* Create an ObjectId with that hex timestamp */
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId
}

router.post('/tblSAPGoodReceive_get', async (req, res) => {
    console.log("-------- tblSAPGoodReceive_get --------");
    // console.log(req.body);
    let input = req.body;
    //--------------------------------->
    // output = {};

    // let querystring = `SELECT  *
    // FROM [SAPData_BP_GAS].[dbo].[tblSAPGoodReceive] `;
    // let query = await mssql.qurey(querystring);

    let query = await mongodbMAIN.find("SAPincoming", "tblSAPGoodReceive", { $and: [{ "Plant": "GWGAS" }] });

    // let queryposting = `SELECT  * FROM [SAPData_BP_GAS].[dbo].[tblSAPPostIncoming]`;

    // let querypost = await mssql.qurey(queryposting);
    // let querypostdata = querypost[`recordsets`][0]
    let querypost = await mongodbMAIN.find("SAPincoming", "tblSAPPostIncoming", { $and: [{ "Plant": "GWGAS" }] });
    let querypostdata = querypost[0]['data'];
    // return res.json(querypostdata);

    

    // let data
    let output_dataBuffer = query[0]['data']
    if(output_dataBuffer.length >0){
        for(i=0 ;i<output_dataBuffer.length;i++){
            output_dataBuffer[i]['MATNR'] = parseInt(output_dataBuffer[i]['MATNR']).toString();
        }
    }
    
    let output_data = output_dataBuffer
    // let data = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [ { MATNR: output_data[0]['MATNR'] }, { CHARG: output_data[0]['CHARG'] } ] });


    //---------------------------------------->

    let output_data_fil = [];
    let output_data_fil_uni = [];
    let output_data_fil_NOuni = [];
    var sl = output_data;
    var out = [];

    for (i = 0, l = sl.length; i < l; i++) {
        var unique = true;
        for (j = 0; j < output_data_fil_uni.length; j++) {
            if ((parseInt(output_data[i]['MATNR']).toString() === parseInt(output_data_fil_uni[j]['MATNR']).toString()) && (output_data[i]['CHARG'] === output_data_fil_uni[j]['CHARG'])) {
                unique = false;
            }
        }
        if (unique) {
            output_data_fil_uni.push(sl[i]);
        } else {
            output_data_fil_NOuni.push(sl[i]);
        }
    }

    for (i = 0, l = output_data_fil_uni.length; i < l; i++) {
        var unique = true;
        for (j = 0; j < output_data_fil_NOuni.length; j++) {
            if ((parseInt(output_data_fil_uni[i]['MATNR']).toString() === parseInt(output_data_fil_NOuni[j]['MATNR']).toString()) && (output_data_fil_uni[i]['CHARG'] === output_data_fil_NOuni[j]['CHARG'])) {
                if ((output_data_fil_uni[i]['BWART'] === '504') || (output_data_fil_NOuni[j]['BWART'] === '504')) {
                    // console.log(output_data_fil_uni[i]['MATNR']);
                    unique = false;
                    break;
                }

            }
        }
        if (unique) {
            output_data_fil.push(output_data_fil_uni[i]);
        }
    }



    output_data = output_data_fil;
    let data = [];
    //created_at: {$gte: ISODate("2010-04-29T00:00:00.000Z"),$lt: ISODate("2010-05-01T00:00:00.000Z")}
    data = await mongodb.find(DBNAME, COLECTIONNAME, {});


    // console.log(data[0]["MATNR"]);
    // console.log(output_data_fil[0]["MATNR"]);
    // console.log(output_data[0]['MATNR']);
    // console.log(output_data[0]['CHARG'] );
    if (data.length > 0) {
        for (i = 0; i < output_data.length; i++) {
            indata = [];
            for (j = 0; j < data.length; j++) {
                if ((parseInt(data[j]["MATNR"]).toString() === parseInt(output_data[i]["MATNR"]).toString()) && (data[j]["CHARG"].toString() === output_data[i]["CHARG"].toString())) {
                    indata[0] = data[j];

                }

            }

            if (indata[0] === undefined) {
                indata[0] = [];
            }

            // data = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [ { MATNR: `${output_data[i]['MATNR']}` }, { CHARG: output_data[i]['CHARG'] } ] });
            if (indata.length > 0) {

                // if(arr.some(item => item.name === 'Blofeld')){

                // }

                // console.log("Appearance for rust" in indata[0]);
                // console.log("Appearance for scratch" in indata[0]);
                // console.log( indata)

                if ("Appearance for rust" in indata[0]) {
                    output_data[i]["Appearance for rust_status"] = indata[0]['Appearance for rust']['status']
                } else {
                    output_data[i]["Appearance for rust_status"] = '-'
                }
                if ("Appearance for scratch" in indata[0]) {
                    output_data[i]["Appearance for scratch_status"] = indata[0]['Appearance for scratch']['status']
                } else {
                    output_data[i]["Appearance for scratch_status"] = '-'
                }

            } else {
                output_data[i]["Appearance for rust_status"] = '-'
                output_data[i]["Appearance for scratch_status"] = '-'

            }
        }
    }

    kj = 0
    output_data_kj = [];

    for (i = 0; i < output_data_fil.length; i++) {
        if (output_data_fil[i]["Appearance for rust_status"] === 'GOOD' && output_data_fil[i]["Appearance for scratch_status"] === 'GOOD') {

        } else {
            output_data_kj[kj] = output_data_fil[i];
            kj++
        }

    }

    let output_data_fil2 = [];

    for (i = 0; i < output_data_kj.length; i++) {
        let have = '';
        for (j = 0; j < querypostdata.length; j++) {
            if ((parseInt(output_data_kj[i]['MATNR']).toString() === parseInt(querypostdata[j]['MATNR']).toString()) && (output_data_kj[i]['CHARG'] === querypostdata[j]['CHARG'])) {
                have = 'ok'
                break;
            }
        }
        if (have !== 'ok') {
            output_data_fil2.push(output_data_kj[i]);
        }
    }

    let output_data_fil3 = [];
    for (i = 0; i < output_data_fil2.length; i++) {

        if (output_data_fil2[i]['BWART'] === '504') {

        } else {
            output_data_fil3.push(output_data_fil2[i]);
        }
    }

    // console.log(output_data_kj.length);
    // console.log(output_data_fil.length);
    // console.log(output_data_fil2.length);
    // console.log(output_data_fil3);
    //<---------------------------------
    let output = [{ "status": "ok", "output": output_data_fil3 }];
    return res.json(output)
})

router.post('/refreshdatafromSAP-GWGAS', async (req, res) => {
    console.log("-------- refreshdatafromSAP-GWGAS --------");
    // console.log(req.body);
    let input = req.body;
    //--------------------------------->
    let output = [];

    if (input[`LAST_DATE`] !== null && input[`LAST_TIME`] !== null) {
        try {
            let resp = await axios.post('http://tp-portal.thaiparker.co.th/API_QcReport/ZBAPI_getZPPIN013_OUT', {
                "IMP_PRCTR": "25000",       //GW-GAS
                "IMP_WERKS": "2200",        //GW
                "LAST_DATE": input[`LAST_DATE`],
                "LAST_TIME": input[`LAST_TIME`]
            });
            // return resp.data;
            // console.log(resp.data);
            if (resp.status == 200) {
                let returnDATA = resp.data;
                if (returnDATA[`hasData`].toString().toUpperCase() === `TRUE`) {
                    let UPDATEdata = {
                        "Plant": "GWGAS",
                        "data": returnDATA[`Rows`]
                    }
                    // let upd = await mongodbMAIN.insertMany("SAPincoming", "tblSAPGoodReceive",  [UPDATEdata]  );
                    let upd = await mongodbMAIN.update("SAPincoming", "tblSAPGoodReceive", { "Plant": 'GWGAS' }, { $set: UPDATEdata });
                    output = 'OK01'
                }

            }
            // console.log(resp.data)s
        } catch (err) {
            output = 'error';
        }

        try {
            let resp = await axios.post('http://tp-portal.thaiparker.co.th/API_QcReport/ZBAPI_getZPPIN014_OUT', {
                "IMP_PRCTR": "25000",       //GW-GAS
                "IMP_WERKS": "2200",        //GW
                "LAST_DATE": input[`LAST_DATE`],
                "LAST_TIME": input[`LAST_TIME`]
            });
            // return resp.data;
            // console.log(resp.data);
            if (resp.status == 200) {
                let returnDATA = resp.data;
                if (returnDATA[`hasData`].toString().toUpperCase() === `TRUE`) {
                    let UPDATEdata = {
                        "Plant": "GWGAS",
                        "data": returnDATA[`Rows`]
                    }
                    // let upd = await mongodbMAIN.insertMany("SAPincoming", "tblSAPPostIncoming",  [UPDATEdata]  );
                    let upd = await mongodbMAIN.update("SAPincoming", "tblSAPPostIncoming", { "Plant": 'GWGAS' }, { $set: UPDATEdata });
                    output = 'OK02'
                }

            }
            // console.log(resp.data)
        } catch (err) {
            output = 'error';
        }

    }



    //--------------------------------->
    res.json(output)
})




module.exports = router;