const e = require("express");
var axios = require('axios');
const express = require("express");
const router = express.Router();
let mongodb = require('../../function/mongodb');
var mssqlREPORT = require('../../function/mssqlR');

let DBNAME = "IncommingData_GASGW";
let COLECTIONNAME = "main_data_GASGW";
var request = require('request');


router.post('/getINCOMING', async (req, res) => {
    //-------------------------------------
    console.log(req.body);
    let input = req.body;
    //-------------------------------------
    let check = await mongodb.find(`PATTERN`, `PATTERN_01`, { "CP": parseInt(input['MATNR']).toString() });
    let ITEMs = await mongodb.find(`master_IC`, `ITEMs`, {});
    let datadb = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });



    checkout = check[0]['INCOMMING'];

    for (i = 0; i < checkout.length; i++) {
        for (j = 0; j < ITEMs.length; j++) {
            if (checkout[i]['ITEMs'] === ITEMs[j]['masterID']) {
                checkout[i]['ITEMsNAME'] = ITEMs[j]['ITEMs'];
                if (datadb.length > 0) {
                    if ((checkout[i]['ITEMsNAME'] in datadb[0])) {
                        checkout[i]['STATE'] = `${datadb[0][checkout[i]['ITEMsNAME']]['status']}`;
                    } else {
                        checkout[i]['STATE'] = '-';
                    }

                } else {
                    checkout[i]['STATE'] = '-';
                }
            }
        }

    }



    res.json(checkout);
});

router.post('/updateDataIncommingGOOD', async (req, res) => {
    console.log("-------- updateDataIncomming --------");
    // console.log(req.body);
    let input = req.body;
    //------------------------>>>

    // let output = await mongodb.find(DBNAME, COLECTIONNAME, { "CHARG": input['CHARG'] });
    let datadb = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });
    //{ $and: [ { MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] } ] }

    output = [{ "status": "nok" }];

    if (datadb.length > 0) {

        let ITEMsin = `${input['ITEM']}`;
        let datain = {
            "status": input['ITEMstatus'],
            "specialAccStatus": input['ITEMspecialAccStatus'],
            "specialAccCOMMENT": input['ITEMspecialAccCOMMENT'],
            "specialAccPiecesSelected": input['ITEMsPiecesSelected'],
            "specialAccPic01": input['ITEMspecialAccPic01'],
            "specialAccPic02": input['ITEMspecialAccPic02'],
            "specialAccPic03": input['ITEMspecialAccPic03'],
            "specialAccPic04": input['ITEMspecialAccPic04'],
            "specialAccPic05": input['ITEMspecialAccPic05'],
        }

        let updv = {};
        updv[ITEMsin] = datain;

        let upd = await mongodb.update(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] }, { $set: updv });
        output = [{ "status": "ok" }];

    } else {


        try {
            let resp = await axios.post('http://localhost:14110/getINCOMING', {
                "MATNR": parseInt(input['MATNR']).toString(),
                "CHARG": input['CHARG'],
            });
            // return resp.data;
            // console.log(resp.data);
            if (resp.status == 200) {
                let returnDATA = resp.data;
                //------------------------------------------------ NEW
                let checkITEMs = [];
                if (returnDATA.length > 0) {
                    for (i = 0; i < returnDATA.length; i++) {
                        checkITEMs.push({
                            "ITEMs": returnDATA[i][`ITEMsNAME`],
                        })
                    }
                }
                //------------------------------------------------ old version
                let UpdateData = {
                    "MATNR": parseInt(input['MATNR']).toString(),
                    "CHARG": input['CHARG'],
                    "MBLNR": input['MBLNR'],
                    "BWART": input['BWART'],
                    "MENGE": input['MENGE'],
                    "MEINS": input['MEINS'],
                    "MAT_FG": input['MAT_FG'],
                    "KUNNR": input['KUNNR'],
                    "SORTL": input['SORTL'],
                    "NAME1": input['NAME1'],
                    "CUST_LOT": input['CUST_LOT'],
                    "PART_NM": input['PART_NM'],
                    "PART_NO": input['PART_NO'],
                    "PROCESS": input['PROCESS'],
                    "OLDMAT_CP": input['OLDMAT_CP'],
                    "STATUS": input['STATUS'],
                    "UserNO": input['UserNO'],
                    "checkITEMs": checkITEMs,
                    "TS": Date.now()
                }
                let insertMany = await mongodb.insertMany(DBNAME, COLECTIONNAME, [UpdateData]);

                let ITEMsin = `${input['ITEM']}`;
                let datain = {
                    "status": input['ITEMstatus'],
                    "specialAccStatus": input['ITEMspecialAccStatus'],
                    "specialAccCOMMENT": input['ITEMspecialAccCOMMENT'],
                    "specialAccPiecesSelected": input['ITEMsPiecesSelected'],
                    "specialAccPic01": input['ITEMspecialAccPic01'],
                    "specialAccPic02": input['ITEMspecialAccPic02'],
                    "specialAccPic03": input['ITEMspecialAccPic03'],
                    "specialAccPic04": input['ITEMspecialAccPic04'],
                    "specialAccPic05": input['ITEMspecialAccPic05'],
                }

                let updv = {};
                updv[ITEMsin] = datain;

                let upd = await mongodb.update(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] }, { $set: updv });
                output = [{ "status": "ok" }];

                //------------------------------------------------ old version
            }
            // console.log(resp.data)s
        } catch (err) {
            output = 'error';
        }






    }


    let lastcheck = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });

    let passtosap = false;

    if (lastcheck[0]['checkITEMs'] !== undefined) {
        let cou = 0;
        for (i = 0; i < lastcheck[0]['checkITEMs'].length; i++) {
            if(lastcheck[0]['checkITEMs'][i]['ITEMs'] in lastcheck[0]){
                cou++;
            }
        }
        if(cou ===  lastcheck[0]['checkITEMs'].length){
            passtosap = true;
        }
    } else {
        passtosap = ("Appearance for rust" in lastcheck[0]) && ("Appearance for scratch" in lastcheck[0]);
    }



    if (passtosap) {

        if ((lastcheck[0]['Appearance for rust']['status'] === 'GOOD') && (lastcheck[0]['Appearance for scratch']['status'] === 'GOOD')) {

            // request.post(
            //     'http://tp-portal.thaiparker.co.th/API_QcReport/ZBAPI_getZPPIN006_IN_BP_GAS',
            //     {
            //         json: {
            //             "PERNR_ID": "135026",
            //             "AUARTID": "ZGB1",
            //             "P_MATNR": `0000000000${parseInt(input['MATNR']).toString()}`,
            //             "P_CHARG": `${input['CHARG']}`,
            //             "P_BWART": "321"
            //         }

            //     },
            //     function (error, response, body) {
            //         if (!error && response.statusCode == 200) {
            //             console.log(body);
            //         }
            //     }
            // );
            console.log(`SEND TO SAP ${parseInt(input['MATNR']).toString()}-${input['CHARG']}`)

        }

    }

    //------------------------<<<
    // output = [{ "status": "ok",}];
    res.json(output)
})

router.post('/updateDataIncommingWAIT', async (req, res) => {

    // console.log(req.body);
    let input = req.body;
    //------------------------>>>

    // let output = await mongodb.find(DBNAME, COLECTIONNAME, { "CHARG": input['CHARG'] });
    let datadb = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });
    //{ $and: [ { MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] } ] }

    if (datadb.length > 0) {

        let ITEMsin = `${input['ITEM']}`;
        let datain = {
            "status": input['ITEMstatus'],
            "specialAccStatus": input['ITEMspecialAccStatus'],
            "specialAccCOMMENT": input['ITEMspecialAccCOMMENT'],
            "specialAccPiecesSelected": input['ITEMsPiecesSelected'],
            "specialAccPic01": input['ITEMspecialAccPic01'],
            "specialAccPic02": input['ITEMspecialAccPic02'],
            "specialAccPic03": input['ITEMspecialAccPic03'],
            "specialAccPic04": input['ITEMspecialAccPic04'],
            "specialAccPic05": input['ITEMspecialAccPic05'],
        }

        let updv = {};
        updv[ITEMsin] = datain;

        let upd = await mongodb.update(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] }, { $set: updv });
        output = [{ "status": "ok" }];



    } else {
        try {
            let resp = await axios.post('http://localhost:14110/getINCOMING', {
                "MATNR": parseInt(input['MATNR']).toString(),
                "CHARG": input['CHARG'],
            });
            // return resp.data;
            // console.log(resp.data);
            if (resp.status == 200) {
                let returnDATA = resp.data;
                //------------------------------------------------ NEW
                let checkITEMs = [];
                if (returnDATA.length > 0) {
                    for (i = 0; i < returnDATA.length; i++) {
                        checkITEMs.push({
                            "ITEMs": returnDATA[i][`ITEMsNAME`],
                        })
                    }
                }
                //------------------------------------------------ old version
                let UpdateData = {
                    "MATNR": parseInt(input['MATNR']).toString(),
                    "CHARG": input['CHARG'],
                    "MBLNR": input['MBLNR'],
                    "BWART": input['BWART'],
                    "MENGE": input['MENGE'],
                    "MEINS": input['MEINS'],
                    "MAT_FG": input['MAT_FG'],
                    "KUNNR": input['KUNNR'],
                    "SORTL": input['SORTL'],
                    "NAME1": input['NAME1'],
                    "CUST_LOT": input['CUST_LOT'],
                    "PART_NM": input['PART_NM'],
                    "PART_NO": input['PART_NO'],
                    "PROCESS": input['PROCESS'],
                    "OLDMAT_CP": input['OLDMAT_CP'],
                    "STATUS": input['STATUS'],
                    "UserNO": input['UserNO'],
                    "TS": Date.now()
                }
                let insertMany = await mongodb.insertMany(DBNAME, COLECTIONNAME, [UpdateData]);

                let ITEMsin = `${input['ITEM']}`;
                let datain = {
                    "status": input['ITEMstatus'],
                    "specialAccStatus": input['ITEMspecialAccStatus'],
                    "specialAccCOMMENT": input['ITEMspecialAccCOMMENT'],
                    "specialAccPiecesSelected": input['ITEMsPiecesSelected'],
                    "specialAccPic01": input['ITEMspecialAccPic01'],
                    "specialAccPic02": input['ITEMspecialAccPic02'],
                    "specialAccPic03": input['ITEMspecialAccPic03'],
                    "specialAccPic04": input['ITEMspecialAccPic04'],
                    "specialAccPic05": input['ITEMspecialAccPic05'],
                }

                let updv = {};
                updv[ITEMsin] = datain;

                let upd = await mongodb.update(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] }, { $set: updv });
                output = [{ "status": "ok" }];
                //------------------------------------------------ old version
            }
            // console.log(resp.data)s
        } catch (err) {
            output = 'error';
        }

    }

    if (input['ITEMstatus'] == 'WAIT') {

        let ITEMsinw = `${input['ITEM']}`;

        let data = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });
        if (data.length > 0) {
            T1 = `${data[0]['MATNR']}-${data[0]['CHARG']}`;
            F01 = `${data[0]['MATNR']}`;
            F02 = `${data[0]['CHARG']}`;
            F03 = `${data[0]['MBLNR']}`;
            F04 = `${data[0]['BWART']}`;
            F05 = `${data[0]['MENGE']}`;
            F06 = `${data[0]['MEINS']}`;
            F07 = `${data[0]['MAT_FG']}`;
            F08 = `${data[0]['KUNNR']}`;
            F09 = `${data[0]['SORTL']}`;
            F10 = `${data[0]['NAME1']}`;
            F11 = `${data[0]['CUST_LOT']}`;
            F12 = `${data[0]['PART_NM']}`;
            F13 = `${data[0]['PART_NO']}`;
            F14 = `${data[0]['PROCESS']}`;
            F15 = `${data[0]['OLDMAT_CP']}`;
            F16 = `${data[0]['STATUS']}`;
            // F17 = `${data[0]['UserNO']}`;
            F17 = `Thitaree`;
            F20 = ``;
            F21 = ``;
            F22 = ``;

            if (data[0][`Appearance for rust`] !== undefined) {
                //
                if (data[0][`Appearance for rust`][`specialAccCOMMENT`] !== '') {
                    F20 = data[0][`Appearance for rust`][`specialAccCOMMENT`];
                }
            } else if (data[0][`Appearance for scratch`] !== undefined) {
                //
                if (data[0][`Appearance for scratch`][`specialAccCOMMENT`] !== '') {
                    F20 = data[0][`Appearance for scratch`][`specialAccCOMMENT`];
                }

            }

            query = ``;



            if (data[0][ITEMsinw]['status'].toString() === 'WAIT') {
                console.log(T1);
                fq1 = `DELETE FROM [INCOMING-Report].[dbo].[BPGAS12] where T1='${T1}'`
                let SEPICstepFQ1 = await mssqlREPORT.qureyR(fq1);

                fq2 = `DELETE FROM [INCOMING-Report].[dbo].[BPGAS12IMG] where T1='${T1}'`
                let SEPICstepFQ2 = await mssqlREPORT.qureyR(fq2);

                F18 = data[0][ITEMsinw]['specialAccPiecesSelected'];

                query01 = `INSERT INTO [INCOMING-Report].[dbo].[BPGAS12] (
                        T1,F01,F02,F03,F04,F05,F06,F07,F08,F09,F10,F11,F12,F13,F14,F15,F16,F17,F18,F20,F21,F22) 
                        VALUES 
                        ('${T1}','${F01}','${F02}','${F03}','${F04}','${F05}','${F06}','${F07}','${F08}','${F09}','${F10}','${F11}','${F12}','${F13}','${F14}','${F15}','${F16}','${F17}','${F18}','${F20}','${F21}','${F22}')`;

                let SEPICstep01 = await mssqlREPORT.qureyR(query01);

                picqueryINS = `Insert Into [INCOMING-Report].[dbo].[BPGAS12IMG] (T1) VALUES
                        ('${T1}') `

                let SEPICstep02 = await mssqlREPORT.qureyR(picqueryINS);
                //specialAccPic01



                query02 = ` update [INCOMING-Report].[dbo].[BPGAS12IMG]  set 
                        IMG01= '${data[0][ITEMsinw]['specialAccPic01']}',
                        IMG02= '${data[0][ITEMsinw]['specialAccPic02']}',
                        IMG03= '${data[0][ITEMsinw]['specialAccPic03']}',
                        IMG04= '${data[0][ITEMsinw]['specialAccPic04']}',
                        IMG05= '${data[0][ITEMsinw]['specialAccPic05']}'                            
                        where T1='${T1}' `

                let SEPICstep03 = await mssqlREPORT.qureyR(query02);

            }



        }
    }

    //------------------------<<<
    // output = [{ "status": "ok",}];
    res.json(output)
});

router.post('/updateDataIncommingGOOD_NA', async (req, res) => {

    console.log("updateDataIncommingGOOD_NA");
    let input = req.body;

    //------------------------>>>

    // let output = await mongodb.find(DBNAME, COLECTIONNAME, { "CHARG": input['CHARG'] });
    let datadb = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });
    //{ $and: [ { MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] } ] }
    output = [{ "status": "nok" }];

    if (datadb.length > 0) {

        let ITEMsin = `${input['ITEM']}`;

        console.log(datadb[0][ITEMsin]['ITEMspecialAccPic01']);
        let datain = {
            "status": input['ITEMstatus'],
            "specialAccStatus": input['ITEMspecialAccStatus'],
            "specialAccCOMMENT": datadb[0][ITEMsin]['specialAccCOMMENT'],
            "specialAccPiecesSelected": datadb[0][ITEMsin]['specialAccPiecesSelected'],
            "specialAccPic01": datadb[0][ITEMsin]['specialAccPic01'],
            "specialAccPic02": datadb[0][ITEMsin]['specialAccPic02'],
            "specialAccPic03": datadb[0][ITEMsin]['specialAccPic03'],
            "specialAccPic04": datadb[0][ITEMsin]['specialAccPic04'],
            "specialAccPic05": datadb[0][ITEMsin]['specialAccPic05'],
        }

        let updv = {};
        updv[ITEMsin] = datain;

        let upd = await mongodb.update(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] }, { $set: updv });
        output = [{ "status": "ok" }];



    }



    let lastcheck = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });

    let passtosap = false;

    if (lastcheck[0]['checkITEMs'] !== undefined) {
        let cou = 0;
        for (i = 0; i < lastcheck[0]['checkITEMs'].length; i++) {
            if(lastcheck[0]['checkITEMs'][i]['ITEMs'] in lastcheck[0]){
                cou++;
            }
        }
        if(cou ===  lastcheck[0]['checkITEMs'].length){
            passtosap = true;
        }
    } else {
        passtosap = ("Appearance for rust" in lastcheck[0]) && ("Appearance for scratch" in lastcheck[0]);
    }

    if (passtosap) {

        if ((lastcheck[0]['Appearance for rust']['status'] === 'GOOD') && (lastcheck[0]['Appearance for scratch']['status'] === 'GOOD')) {

            // request.post(
            //     'http://tp-portal.thaiparker.co.th/API_QcReport/ZBAPI_getZPPIN006_IN_BP_GAS',
            //     {
            //         json: {
            //             "PERNR_ID": "135026",
            //             "AUARTID": "ZGB1",
            //             "P_MATNR": `0000000000${parseInt(input['MATNR']).toString()}`,
            //             "P_CHARG": `${input['CHARG']}`,
            //             "P_BWART": "321"
            //         }

            //     },
            //     function (error, response, body) {
            //         if (!error && response.statusCode == 200) {
            //             console.log(body);
            //         }
            //     }
            // );
            console.log('SEND TO SAP')

        }

    }

    //------------------------<<<
    // output = [{ "status": "ok",}];
    res.json(output)
});

router.post('/updateDataIncommingNOGOOD', async (req, res) => {

    // console.log(req.body);
    let input = req.body;
    //------------------------>>>

    // let output = await mongodb.find(DBNAME, COLECTIONNAME, { "CHARG": input['CHARG'] });
    let datadb = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });
    //{ $and: [ { MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] } ] }
    output = [{ "status": "nok" }];
    if (datadb.length > 0) {

        let ITEMsin = `${input['ITEM']}`;
        let datain = {
            "status": input['ITEMstatus'],
            "specialAccStatus": input['ITEMspecialAccStatus'],
            "specialAccCOMMENT": datadb[0][ITEMsin]['specialAccCOMMENT'],
            "specialAccPiecesSelected": datadb[0][ITEMsin]['specialAccPiecesSelected'],
            "specialAccPic01": datadb[0][ITEMsin]['specialAccPic01'],
            "specialAccPic02": datadb[0][ITEMsin]['specialAccPic02'],
            "specialAccPic03": datadb[0][ITEMsin]['specialAccPic03'],
            "specialAccPic04": datadb[0][ITEMsin]['specialAccPic04'],
            "specialAccPic05": datadb[0][ITEMsin]['specialAccPic05'],
        }

        let updv = {};
        updv[ITEMsin] = datain;

        let upd = await mongodb.update(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] }, { $set: updv });
        output = [{ "status": "ok" }];



    }



    let lastcheck = await mongodb.find(DBNAME, COLECTIONNAME, { $and: [{ MATNR: parseInt(input['MATNR']).toString() }, { CHARG: input['CHARG'] }] });

    let passtosap = false;

    if (lastcheck[0]['checkITEMs'] !== undefined) {
        let cou = 0;
        for (i = 0; i < lastcheck[0]['checkITEMs'].length; i++) {
            if(lastcheck[0]['checkITEMs'][i]['ITEMs'] in lastcheck[0]){
                cou++;
            }
        }
        if(cou ===  lastcheck[0]['checkITEMs'].length){
            passtosap = true;
        }
    } else {
        passtosap = ("Appearance for rust" in lastcheck[0]) && ("Appearance for scratch" in lastcheck[0]);
    }

    if (passtosap) {

        if ((lastcheck[0]['Appearance for rust']['status'] === 'GOOD') && (lastcheck[0]['Appearance for scratch']['status'] === 'GOOD')) {

            // request.post(
            //     'http://tp-portal.thaiparker.co.th/API_QcReport/ZBAPI_getZPPIN006_IN_BP_GAS',
            //     {
            //         json: {
            //             "PERNR_ID": "135026",
            //             "AUARTID": "ZGB1",
            //             "P_MATNR": `0000000000${parseInt(input['MATNR']).toString()}`,
            //             "P_CHARG": `${input['CHARG']}`,
            //             "P_BWART": "321"
            //         }

            //     },
            //     function (error, response, body) {
            //         if (!error && response.statusCode == 200) {
            //             console.log(body);
            //         }
            //     }
            // );
            console.log('SEND TO SAP')

        }

    }

    //------------------------<<<
    // output = [{ "status": "ok",}];
    res.json(output)
});




module.exports = router;

// let check = await mongodb.find(PREMIXserver,dbin,{"MATNO":input['MATNO'] });
// let upd = await mongodb.update(PREMIXserver,dbin,{ "MATNO":input['MATNO'] }, { $set: input });
// var ins = await mongodb.insertMany(HYDROPHILICserver,dbin,[input]);

