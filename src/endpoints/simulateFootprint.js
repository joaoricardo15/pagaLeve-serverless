'use strict'

module.exports.handler = async (event, context, callback) => {
    try {
        callback(null, {
            statusCode: 200,
            headers: {
                'Content-type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(event, null, 2)
        })
    } catch (error) {
        callback({
            statusCode: 500,
            headers: {
                'Content-type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(error, null, 2)
        })
    }
}

var numPeople = 0;
var zip_code;
var zipChecker;
var g_eFactorValue = 0;
var numVehicles = 1;
var grandEmissionsTotal = 0;
var grandReductionTotal = 0;
var homeEmissionTotal=0;
var totalAlreadyCorrection = 0;
var usAvgTotals=[0,0,0,0];           // home, transportation, waste, total
var userRevisedChartNums=[];
var progressBarTotals = [0,0,0];           // home, transportation, waste, 

var vehicleData = [[],[],[],[],[]];
var revisedVehicleData = [[],[],[],[],[]];
var userTotalEmissions = [0,0,0,0,0,0];            //  Natural Gas, Electricity, Fuel Oil, Propane, Transportation, Waste
var userRevisedTotalEmissions  = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[],[0,0,0],[0,0,0]];         //  maintenance is always at position [10]
userRevisedTotalEmissions[23] = [0,0,0];                //  instantiated here in the event the user skips the "% Green Electricity"
var emissionsSaved = 0;
var usAvg = [0,0,0,0,0,0];    //  0-3 utilities, 4 transportation, 5 Waste
var heatSource = "";
var maintCurrentSelect = "";
var userRecycling  = [[0,"newspapers"],[0,"glass"],[0,"plastic"],[0,"aluminum and steel cans"],[0,"magazines"]];      // 1 = Already Done, 2 = Will Do, 0 = Won't Do
var wasteProgress = [0,0,0,0,0];
var homeProgress = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var vehicleProgress = [,[]];         //  maintenance is always at position [0]
var totalExhaustAlreadySaved = 0;
var totalDollarsAlreadySaved = 0;
var totalExhaustWillSave = 0;
var totalDollarsWillSave = 0;

// Household Vehicles
var g_CO2_EMITTED_PER_GALLON_OF_GASOLINE = 19.6;
var g_NONCO2_EMITTED_PER_GALLON_OF_GASOLINE = 1.013684744044602;
var g_AVG_EMISSIONS_PER_VEHICLE = 10484;

// HOME ENERGY
//  -- NAT GAS
var g_AVG_NAT_GAS_PRICE_PER_THOUSAND_CUBIC_FEET = 10.68;
var g_AVG_NAT_GAS_PRICE_PER_THERM = 1.04;
var g_NAT_GAS_THERMS_EMISSIONS_FACTOR = 11.7;
var g_NAT_GAS_CUBIC_FEET_EMISSIONS_FACTOR = 119.58;
var g_NAT_GAS_AVG_EMISSIONS_PER_PERSON = 3071;    

//  -- ELECTRICITY
var g_AVG_ELEC_PRICE_PER_KILOWATT = 0.1188;
var g_ELEC_AVG_EMISSIONS_PER_PERSON = 5455;
var g_ELEC_AVG_COST_PER_PERSON = 43.61;

//  -- FUEL OIL
var g_AVG_FUEL_OIL_PRICE_PER_GALLON = 4.02;
var g_FUEL_OIL_EMISSIONS_FACTOR = 22.61;
var g_FUEL_OIL_AVG_EMISSIONS_PER_PERSON = 4848;    

//  -- Propane
var g_AVG_PROPANE_PRICE_PER_GALLON = 2.47;
var g_PROPANE_EMISSIONS_FACTOR = 12.43;
var g_PROPANE_AVG_EMISSIONS_PER_PERSON = 2243;    


// WASTE
var g_WASTE_AVG_PER_PERSON = 691.5;
var g_METAL_REDUCTION = -89.38;
var g_PLASTIC_REDUCTION = -35.56;
var g_GLASS_REDUCTION = -25.39;
var g_NEWSPAPER_REDUCTION = -113.14;
var g_MAGAZINE_REDUCTION = -27.46;
var g_TOTAL_EMISSIONS_AVG_PER_PERSON = 19702;


// ON THE ROAD
var g_AVG_COST_PER_MILE = 0.1964;
var g_VEHICLE_EFFICIENCY_IMPROVEMENTS = 0.07;
var g_AVG_GAS_PRICE_PER_GALLON = 3.68;

// AT HOME
var g_HEATING_SAVINGS_PER_DEGREE_OF_SETBACK = 0.03;
var g_PERCENT_NAT_GAS_TO_HEATING = 0.63;
var g_PERCENT_ELEC_TO_HEATING = 0.09;
var g_PERCENT_FUEL_OIL_TO_HEATING = 0.87;
var g_PERCENT_PROPANE_TO_HEATING = 0.70;
var g_PERCENT_ELEC_TO_COOLING = 0.14;
var g_COOLING_SAVINGS_PER_DEGREE_OF_SETBACK = 0.06;
var g_COMPUTER_SLEEP_SAVINGS = 107.1;
var g_KWH_PER_LOAD_LAUNDRY = 0.96;
var g_DRYER_SAVINGS = 769;
var g_LAMP_KWH_SAVINGS = 33;
var g_LAMP_DOLLAR_SAVINGS = 4;
var g_FRIDGE_REPLACE_KWH_SAVINGS = 322;
var g_BOILER_REPLACE_SAVINGS_NAT_GAS = 728;
var g_BOILER_REPLACE_SAVINGS_FUEL_OIL = 1056;
var g_BOILER_REPLACE_COST_SAVINGS = 78.34;
var g_SWITCH_WINDOWS_SAVINGS = 25210000;
var g_WINDOW_REPLACE_COST_SAVINGS = 150;


// CONVERSION FACTORS/CONSTANTS
var g_BTU_PER_1000CF_NAT_GAS = 1023000;
var g_BTU_PER_KWH = 3412;
var g_BTU_PER_GALLON_FUEL_OIL =  138691.09;
var g_BTU_PER_GALLON_PROPANE =  91335.94;
var g_NUM_WEEKS_PER_YEAR = 52;
var g_NUM_MONTHS_PER_YEAR = 12;

// EVENT TRACKING
var endTime = 0, startTime = 0, timeSpent = 0;
function runTheAjax(zip){
    var strippedZip = parseFloat(zip).toString();

    $("#error-zipcode").removeClass("errorMsg").addClass("displayNone");
    
    $.ajax({
        url: "data/egrid.csv",
        type: "get",
        success: function(data) {
            var e = data.split("\r");
            var condition=false;
            var counter=1;
            while(condition === false && counter < e.length){
                var a = e[counter].split(",");
                if (a[0] == strippedZip) {
                    g_eFactorValue = a[3] / 1000;
                    condition=true;
                }
                ++counter;
            }
            if (counter == e.length) {
                $("#invalidZip").removeClass("displayNone");
            }
            entryValidation();
        },
        error: function() {
            $("#invalidZip").removeClass("displayNone");
            entryValidation();
        },
        beforeSend: function(){
            $(".loader").show();
        },
        complete: function(){
            $(".loader").hide();
        }
    });
    displayErrorMessages();
}
function calcMilesPerYear(milesPerWeek){
    return milesPerWeek * 52;
}
function displayUsAvg(){
    $("#good-work").addClass("displayNone");
    
    var totalAvg=0;
    usAvgTotals[0]=0;
    
    for (var idx=0; idx<usAvg.length;idx++){
        if (usAvg[idx] == 1) {
            totalAvg += getterUsAvg(idx);             //  calculate/recalculate the average
            
            if (idx==4) {                              //  transportation
                usAvgTotals[1] = getterUsAvg(idx);
            }
            else if (idx==5) {                         //  waste
                usAvgTotals[2] = getterUsAvg(idx);
            }
        }
        if (idx==3) {
            usAvgTotals[0]=totalAvg;                        //  0-3 are the Utilities
        }
    }
    usAvgTotals[4] = totalAvg;
        
    //  Show on Report
    $("#us-avg .rowChart .rowItems .homeEnergyCharItem").attr("title",insertCommas(Math.round(usAvgTotals[0]))+" lbs.");
    $("#us-avg .rowChart .rowItems .transportationCharItem").attr("title",insertCommas(Math.round(usAvgTotals[1]))+" lbs.");
    $("#us-avg .rowChart .rowItems .wasteCharItem").attr("title",insertCommas(Math.round(usAvgTotals[2]))+" lbs.");

    $('.uS_avg').html(insertCommas(Math.round(usAvgTotals[4])));  // display
    
    if (grandEmissionsTotal < usAvgTotals[4]) {
        $("#good-work").removeClass("displayNone");
    }
}
function calcNaturalGas() {
    if (getterHeatSource()) {      //  Must enter a Heat Source first
        var gasInput = stripCommas($('#naturalGasTextInput').val());
        var gasSelect = $('#naturalGasSelectInput').val();
        var natGas = 0;
        
        if (gasSelect == "Dollars") {
            natGas = (gasInput / g_AVG_NAT_GAS_PRICE_PER_THOUSAND_CUBIC_FEET) * g_NAT_GAS_CUBIC_FEET_EMISSIONS_FACTOR * g_NUM_MONTHS_PER_YEAR;
        }
        else if (gasSelect == "Thousand Cubic Feet") {
            natGas = g_NAT_GAS_CUBIC_FEET_EMISSIONS_FACTOR * gasInput * g_NUM_MONTHS_PER_YEAR;
        }
        else if (gasSelect == "Therms") {
            natGas = g_NAT_GAS_THERMS_EMISSIONS_FACTOR * gasInput * g_NUM_MONTHS_PER_YEAR;
        }

        if (natGas >= 0) {
            homeProgress[1] = 1;         
            
            if (natGas > 0) {
                usAvg[0] = 1;   //  1 essentially means True for the function to add the US Avg for comparison and update page
            }
        }
        else {
            natGas = 0;     //  Catches NaN, "", and other non-numbers
            usAvg[0] = 0;   //  remove the US Avg and update page
            homeProgress[1] = 0;
        }
        
        $('.naturalGas .green-lb-total span').html(insertCommas(Math.round(natGas)));
        
        userTotalEmissions[0] = natGas;
        setterTotalEmissions();
        displayHomeProgressBar();
        displayUsAvg();
        
        if (grandReductionTotal > 0){
            if (userRevisedTotalEmissions[0][0] !== 0 && heatSource == "Natural Gas") {      //  this can only be reached when the user changes an initial entry
                calcWinterHeating();
            }
        }
    }
    else{
        document.getElementById("naturalGasTextInput").value = "";
    }
}
function calcElectric() {
    if (getterHeatSource()) {                                                //  Must enter a Heat Source first
        var electricInput = stripCommas($('#electricityTextInput').val());
        var elecSelect = $('#electricitySelectInput').val();
        var green_elec = stripCommas($('#electricityGreenTextInput').val());
        var elec;
        userTotalEmissions[1] = 0;
        
        
        if (isNaN(electricInput)) {
            document.getElementById("electricityTextInput").value = "";
            elec = 0;
            homeProgress[2] = 0;
            usAvg[1] = 0;
        }
        else{
            if (elecSelect == "Dollars") {
                elec = (electricInput / g_AVG_ELEC_PRICE_PER_KILOWATT) * g_eFactorValue * g_NUM_MONTHS_PER_YEAR;
            }
            else if (elecSelect == "kWh") {
                elec = electricInput * g_eFactorValue * g_NUM_MONTHS_PER_YEAR;
            }
            
            homeProgress[2] = 1;
            if (elec > 0) {
                usAvg[1] = 1;   //  1 essentially means True for the function to add the US Avg for comparison and update page
            }
        }

        userTotalEmissions[1] = elec;
        
        $('.electricity .green-lb-total span').html(insertCommas(Math.round(userTotalEmissions[1])));
            
                                        //  this can only be reached when the user changes an initial entry
        if (userRevisedTotalEmissions[0][0] !== 0 && heatSource == "Electricity") {    //  these need to be updated if electricity changes.
            calcWinterHeating();
        }
        if (userRevisedTotalEmissions[1][0] !== 0){
            calcSummerCooling();
        }
        if (userRevisedTotalEmissions[9][0] !== 0){
            calcGreenPower();
        }
        if (green_elec >= 0) {
            calcAlreadyGreenElec();
        }
        
        setterTotalEmissions();
        displayHomeProgressBar();
        displayUsAvg();
    }

    else{
        document.getElementById("electricityTextInput").value = "";
    }
}
function calcAlreadyGreenElec() {
    if (getterHeatSource()) {                                                //  Must enter a Heat Source first
        userRevisedTotalEmissions[23]=[0,0,0];
        var electricInput = stripCommas($('#electricityTextInput').val());
        $("#error-monthly-utility").removeClass("errorMsg").addClass("displayNone");
        var green_electricity = stripCommas($('#electricityGreenTextInput').val());
        var elec = userTotalEmissions[1];
        
        $("#error-monthly-electrical").removeClass("errorMsg").addClass("displayNone");
        
        if ( isNaN(green_electricity) || isNaN(electricInput) || (electricInput == undefined)){
            green_electricity = 0;
            
            if ((isNaN(electricInput) && electricInput == undefined)) {
                $("#error-monthly-electrical").removeClass("displayNone").addClass("errorMsg");
            }
            document.getElementById("electricityGreenTextInput").value = "";
        }
        
        var temp = elec;
        $('.currentGreenPwr').html(green_electricity);      // output in Report
        elec = elec * (1 - (green_electricity / 100));      // not considered for the Progress bar for really no good reason
        var eElec = Math.round(temp - elec);
        
        $('.currentGreenPwrCo2Saved').html(insertCommas(eElec));      // output in Report -- There are no $ savings - actually costs more.
        $('.electricity .green-lb-total span').html(insertCommas(Math.round(userTotalEmissions[1] - eElec)));
        
        if (green_electricity > 0) {
            userRevisedTotalEmissions[23]=[1,Math.abs(eElec),0];
        }
        
        if (userRevisedTotalEmissions[9][1] !== 0) {                 //  these need to be updated if green electricity changes.
            if (userRevisedTotalEmissions[9][1] < userRevisedTotalEmissions[23][1]){
                document.getElementById("increaseGreenInput").value = "";
            }
            calcGreenPower();
        }
    }
    else{
        document.getElementById("electricityGreenTextInput").value = "";
    }	

    setterTotalEmissions();
    displayErrorMessages();
}
function calcFuelOil() {
    if (getterHeatSource()) {
        var fuelOilInput = stripCommas($('#fuelTextInput').val());
        var fuelOilSelect = $('#fuelSelectInput').val();
        var fuelOil = 0;
        
        if (fuelOilSelect == "Dollars") {
            fuelOil = (fuelOilInput / g_AVG_FUEL_OIL_PRICE_PER_GALLON) * g_FUEL_OIL_EMISSIONS_FACTOR * g_NUM_MONTHS_PER_YEAR;
        }
        else if (fuelOilSelect == "Gallons") {
            fuelOil = g_FUEL_OIL_EMISSIONS_FACTOR * fuelOilInput * g_NUM_MONTHS_PER_YEAR;
        }
        
        if (fuelOil >= 0) {
            homeProgress[3] = 1;
            
            if (fuelOil > 0) {
                usAvg[2] = 1;   //  1 essentially means True for the function to add the US Avg for comparison and update page
            }
        }
        else {
            fuelOil = 0;
            usAvg[2] = 0;
            homeProgress[3] = 0;
        }
        
        $('.fuel .green-lb-total span').html(insertCommas(Math.round(fuelOil)));
        
        userTotalEmissions[2] = fuelOil;
        setterTotalEmissions();
        
        displayHomeProgressBar();
        displayUsAvg();
        
        if (grandReductionTotal > 0){                                                      //  this can only be reached when the user changes an initial entry
            if (userRevisedTotalEmissions[0][0] !== 0 && heatSource == "Fuel Oil") {
                calcWinterHeating();
            }
        }
    }
    else{
        $('#fuelTextInput').value = "";
    }
}
function calcPropane() {
    if (getterHeatSource()) {
        var propaneInput = stripCommas($('#propaneTextInput').val());
        var propaneSelect = $('#propaneSelectInput').val();
        var prop = 0;
        
        if (propaneSelect == "Dollars") {
            prop = (propaneInput / g_AVG_PROPANE_PRICE_PER_GALLON) * g_PROPANE_EMISSIONS_FACTOR * g_NUM_MONTHS_PER_YEAR;
        }
        else if (propaneSelect == "Gallons") {
            prop = g_PROPANE_EMISSIONS_FACTOR * propaneInput * g_NUM_MONTHS_PER_YEAR;
        }
        
        if (prop >= 0) {
            homeProgress[4] = 1;
            
            if (prop > 0) {
                usAvg[3] = 1;              //  1 essentially means True for the function to add the US Avg for comparison and update page
            }
        }
        else {
            prop = 0;
            usAvg[3] = 0;
            homeProgress[4] = 0;
        }
        
        $('.propane .green-lb-total span').html(insertCommas(Math.round(prop)));
        
        userTotalEmissions[3] = prop;
        setterTotalEmissions();
        
        displayHomeProgressBar();
        displayUsAvg();
        
        if (grandReductionTotal > 0){                                                      //  this can only be reached when the user changes an initial entry
            if (userRevisedTotalEmissions[0][0] !== 0 && heatSource == "Propane") {
                calcWinterHeating();
            }
        }
    }
    else{
        $('#propaneTextInput').value = "";
    }
}
function calcWinterHeating() {
    if (getterHeatSource()) {
        $("#error-monthly-utility").removeClass("errorMsg").addClass("displayNone");
        
        var utilityInput;
        var utilityUnit;
        var greenTotal;
        var utilityFactor;
        var utilityFactorPrice = 1;
        userRevisedTotalEmissions[0]=[0,0,0];
        homeProgress[5] = 0;
        
        if (heatSource == "Electricity") {
            utilityInput = stripCommas($('#electricityTextInput').val());
        }
        else if (heatSource == "Natural Gas") {
            utilityInput = stripCommas($('#naturalGasTextInput').val());
        }
        else if (heatSource == "Fuel Oil") {
            utilityInput = stripCommas($('#fuelTextInput').val());
        }
        else if (heatSource == "Propane") {
            utilityInput = stripCommas($('#propaneTextInput').val());
        }
        
        if (utilityInput > 0) {
            var winterHeat = stripCommas($('#energyHeat').val());
        
            if (winterHeat > 0) {
                // Get user input data from Utility for calculations
                if (heatSource == "Electricity") {
                    greenTotal = userTotalEmissions[1];
                    utilityUnit = $('#electricitySelectInput').val();
                    utilityFactor = g_PERCENT_ELEC_TO_HEATING;
                    
                    if (utilityUnit == 'kWh') {
                        utilityFactorPrice = g_AVG_ELEC_PRICE_PER_KILOWATT;
                    }
                }
                else if (heatSource == "Natural Gas") {
                    greenTotal = userTotalEmissions[0];
                    utilityUnit = $('#naturalGasSelectInput').val();
                    utilityFactor = g_PERCENT_NAT_GAS_TO_HEATING;
                    
                    if (utilityUnit == 'Therms') {
                        utilityFactorPrice = g_AVG_NAT_GAS_PRICE_PER_THERM;
                    } else if (utilityUnit != 'Dollars' && utilityUnit != 'Therms'){
                        utilityFactorPrice = g_AVG_NAT_GAS_PRICE_PER_THOUSAND_CUBIC_FEET;
                    }
                }
                else if (heatSource == "Fuel Oil") {
                    greenTotal = userTotalEmissions[2];
                    utilityUnit = $('#fuelSelectInput').val();
                    utilityFactor = g_PERCENT_FUEL_OIL_TO_HEATING;
                        
                    if (utilityUnit == 'Gallons') {
                        utilityFactorPrice = g_AVG_FUEL_OIL_PRICE_PER_GALLON;
                    }
                }
                else if (heatSource == "Propane") {
                    greenTotal = userTotalEmissions[3];
                    utilityUnit = $('#propaneSelectInput').val();
                    utilityFactor = g_PERCENT_PROPANE_TO_HEATING;
                    
                    if (utilityUnit == 'Gallons') {
                        utilityFactorPrice = g_AVG_PROPANE_PRICE_PER_GALLON;
                    }
                }
                        
                var dollarsSavedWinter = utilityInput * utilityFactor * utilityFactorPrice * g_HEATING_SAVINGS_PER_DEGREE_OF_SETBACK * winterHeat * g_NUM_MONTHS_PER_YEAR;
                var amountSavedWinter = greenTotal  * utilityFactor  * g_HEATING_SAVINGS_PER_DEGREE_OF_SETBACK * winterHeat;
                
                if (amountSavedWinter > 0) {
                    homeProgress[5] = 1;
                }
                userRevisedTotalEmissions[0]=[2,amountSavedWinter,dollarsSavedWinter];
            }
            else{
                document.getElementById("energyHeat").value = "";
            }
        }
        else{
            $("#error-monthly-utility").html("You must have an entry for Monthly "+heatSource+" bill.");
            $("#error-monthly-utility").removeClass("displayNone").addClass("errorMsg");
            
            document.getElementById("energyHeat").value = "";
        }
            
        $('.heat-energy-dollars-saved').html(insertCommas(Math.round(userRevisedTotalEmissions[0][2])));
        $('.heat-energy-co2-saved').html(insertCommas(Math.round(userRevisedTotalEmissions[0][1])));
        $('.heat-temp').html(insertCommas(Math.round(winterHeat)));                //  shows on the report page
        
        setterRevisedEmissions();
        displayHomeProgressBar();
    }
    else{                             //  need an entry for Heat Source
        document.getElementById("energyHeat").value = "";
    }
    displayErrorMessages();
}
function calcSummerCooling() {
    var utilityInput;
    var utilityUnit;
    var utilityFactor;
    var utilityFactorPrice = 1;
    userRevisedTotalEmissions[1] = [0,0,0];
    homeProgress[6] = 0;
    
    var elecTotal = stripCommas(userTotalEmissions[1]);  //  $('.electricity .green-lb-total span').val()
    
    if (elecTotal > 0) {
        $("#error-monthly-electrical").removeClass("errorMsg").addClass("displayNone");
        
        var summerAC = stripCommas($('#energyAC').val());
        
        if (isNaN(summerAC)) {
            document.getElementById("energyAC").value = "";
        }
        else {
            utilityInput = stripCommas($('#electricityTextInput').val());
            utilityUnit = $('#electricitySelectInput').val();
            utilityFactor = g_PERCENT_ELEC_TO_COOLING;
            
            if (utilityUnit == 'kWh') {
                utilityFactorPrice = g_AVG_ELEC_PRICE_PER_KILOWATT;
            }
            
            var amountSavedSummer = elecTotal * utilityFactor * g_COOLING_SAVINGS_PER_DEGREE_OF_SETBACK * summerAC;
            var dollarsSavedSummer = utilityInput * utilityFactor * utilityFactorPrice * g_COOLING_SAVINGS_PER_DEGREE_OF_SETBACK * summerAC * g_NUM_MONTHS_PER_YEAR;
            
            homeProgress[6] = 1;
            userRevisedTotalEmissions[1]=[2,amountSavedSummer,dollarsSavedSummer];
            
            $('.ac-temp').html(insertCommas(Math.round(summerAC)));      //  shows on the report page
        }
    }
    else{
        $("#error-monthly-electrical").removeClass("displayNone").addClass("errorMsg");
        document.getElementById("energyAC").value = "";
    }
    $('.ac-energy-dollars-saved').html(insertCommas(Math.round(userRevisedTotalEmissions[1][2])));
    $('.ac-energy-co2-saved').html(insertCommas(Math.round(userRevisedTotalEmissions[1][1])));
    
    displayErrorMessages();
    setterRevisedEmissions();
    displayHomeProgressBar();
}
function calcReplaceBulbs() {
    var elecTotal = userTotalEmissions[1];
    homeProgress[7] = 0;
    userRevisedTotalEmissions[2] = [0,0,0];
    
    var bulbInput = parseInt($('#lightsToReplace').val());

    if (isNaN(bulbInput)) {
        document.getElementById("lightsToReplace").value = "";
    }
    else{
        var co2Saved = bulbInput * g_LAMP_KWH_SAVINGS * g_eFactorValue;
        var dollarsSaved = bulbInput * g_LAMP_DOLLAR_SAVINGS;

        homeProgress[7] = 1;
        userRevisedTotalEmissions[2]=[2,co2Saved,dollarsSaved];
    
        $('.numBulb').html(insertCommas(Math.round(bulbInput)));
    }

    $('.lightEnergyDollarsSaved').html(Math.round(userRevisedTotalEmissions[2][2]));
    $('.lightEnergyCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[2][1])));
    
    setterRevisedEmissions();
    displayHomeProgressBar();
}
function calcComputerPower() {
    homeProgress[8] = 1;
    $('#pwrMgmtSelect').parent().next('.mobile-hook').children('div').css('color','#333').parent().next('.mobile-hook').children('div').css('color','#333');
    
    var userSelect = $('#pwrMgmtSelect').val();
    
    if (userSelect != 'Will Not Do') {
        var co2Saved = g_COMPUTER_SLEEP_SAVINGS * g_eFactorValue;
        var dollarsSaved = g_COMPUTER_SLEEP_SAVINGS * g_AVG_ELEC_PRICE_PER_KILOWATT;
        
        userRevisedTotalEmissions[3]=[2,co2Saved,dollarsSaved];
        
        if (userSelect == 'Already Done') {
            userRevisedTotalEmissions[3][0]=1;
            $('#pwrMgmtSelect').parent().next('.mobile-hook').children('div').css('color','#aaa').parent().next('.mobile-hook').children('div').css('color','#aaa');
        }
    }
    else if (userSelect == 'Will Not Do') {
        userRevisedTotalEmissions[3] = [0,0,0];
    }

    $('.computerPwrDollarsSaved').html(insertCommas(Math.round(userRevisedTotalEmissions[3][2])));
    $('.computerPwrCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[3][1])));
    
    setterRevisedEmissions();	
    displayHomeProgressBar();
}
function calcGreenPower(){
    $("#error-monthly-electrical").removeClass("errorMsg").addClass("displayNone");
    
    userRevisedTotalEmissions[9] = [0,0,0];                                                        // 1 = Already Done, 2 = Will Do, 0 = Won't Do
    homeProgress[9] = 0;
    
    if (userTotalEmissions[1] >= 0) {
        var rev_green_electricity = $('#increaseGreenInput').val();   // get user's input
        //if ((rev_green_electricity == null) || (rev_green_electricity == undefined) || (rev_green_electricity == "")) {

        if ((isNaN(rev_green_electricity)) || (rev_green_electricity == "")) {
            document.getElementById("increaseGreenInput").value = "";
        }
        else if (rev_green_electricity >= 0) {
            homeProgress[9] = 1;
            
            if (rev_green_electricity > 0) {
                var rev_elec = userTotalEmissions[1] * (1 - (rev_green_electricity / 100));          //  = elec * (1 - (green_electricity / 100));
                var co2Saved = userTotalEmissions[1] - rev_elec;
                userRevisedTotalEmissions[9]=[2,co2Saved,0];
            }
        }
    }
    else{
        $("#error-monthly-electrical").removeClass("displayNone").addClass("errorMsg");
        document.getElementById("increaseGreenInput").value = "";
    }
    
    $('.increaseGreenPwr').html(rev_green_electricity);   // output to report
    $('.increaseGreenPwrCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[9][1])));
    
    displayErrorMessages();
    setterRevisedEmissions();
    displayHomeProgressBar();
}
function calcColdWater() {
    var userInput = stripCommas($('#loadsPerWeek').val());
    var userSelect = $('#coldWaterSelect').val();
    userRevisedTotalEmissions[4]=[0,0,0];
    homeProgress[10] = 0;
    
    if (userSelect !== ""){
        $('#coldWaterSelect').parent('td').next('.mobile-hook').children('div').css('color','#333').parent().next('.mobile-hook').children('div').css('color','#333');
        
        if (isNaN(userInput)) {
            $('#loadsPerWeek').html('');
        }
        else{
            if (userInput > 0 && userSelect != 'Will Not Do') {
                co2Saved = g_KWH_PER_LOAD_LAUNDRY * g_NUM_WEEKS_PER_YEAR * userInput * g_eFactorValue;
                dollarsSaved = g_KWH_PER_LOAD_LAUNDRY * g_AVG_ELEC_PRICE_PER_KILOWATT * userInput * g_NUM_WEEKS_PER_YEAR;
                userRevisedTotalEmissions[4]=[2,co2Saved,dollarsSaved];                   //  userSelect == 'Will Do'
            
                if (userSelect == 'Already Done') {
                    $('#coldWaterSelect').parent().next('.mobile-hook').children('div').css('color','#aaa').parent().next('.mobile-hook').children('div').css('color','#aaa');
                    userRevisedTotalEmissions[4][0] = 1;
                }
            }
            homeProgress[10] = 1;
        }
    }
    $('.coldWaterDollarsSaved').html(insertCommas(Math.round(userRevisedTotalEmissions[4][2])));
    $('.coldWaterCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[4][1])));
    
    setterRevisedEmissions();
    displayHomeProgressBar();
}
function calcDryer() {
    var userSelect = $('#AirDrySelect').val();
    
    if (userSelect !== "") {
        userRevisedTotalEmissions[5]=[0,0,0];
        var percentSelect = $('#percentageAirDrySelect').val();
        homeProgress[11] = 1;
        var co2Saved;
        var dollarsSaved;
        var loadFactor=0;
        
        $('#AirDrySelect').parent().next('.mobile-hook').children('div').css('color','#333').parent().next('.mobile-hook').children('div').css('color','#333');
        
        if (userSelect != 'Will Not Do') {				
            if (percentSelect == 'All my Laundry') {
                loadFactor = 1;
            }
            else if (percentSelect == '50% of my Laundry') {
                loadFactor = 0.50;
            }
            else if (percentSelect == '20% of my Laundry') {
                loadFactor = 0.20;
            }
            else if (percentSelect == '10% of my Laundry') {
                loadFactor = 0.10;
            }
                
            dollarsSaved = g_DRYER_SAVINGS * g_AVG_ELEC_PRICE_PER_KILOWATT * loadFactor;
            co2Saved = g_DRYER_SAVINGS * g_eFactorValue * loadFactor;
            
            userRevisedTotalEmissions[5]=[2,co2Saved,dollarsSaved];
            
            if (userSelect == 'Already Done') {
                $('#AirDrySelect').parent('td').next('.mobile-hook').children('div').css('color','#aaa').parent().next('.mobile-hook').children('div').css('color','#aaa');
                userRevisedTotalEmissions[5][0]=[1];
            }
        }
        var str = (loadFactor * 100).toString() + "%";
            
        $('.airDryDollarsSaved').html(insertCommas(Math.round(userRevisedTotalEmissions[5][2])));
        $('.airDryCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[5][1])));
        $('.airDryPercent').html(str);
        
        setterRevisedEmissions();
        displayHomeProgressBar();
    }
}
function calcRefrigerator() {
    var userSelect = $('#fridgeSelect').val();
    homeProgress[12] = 1;
    userRevisedTotalEmissions[6]=[0,0,0];
    var co2Saved;
    var dollarsSaved;
    
    $('#fridgeSelect').parent().next('.mobile-hook').children('div').css('color','#333').parent().next('.mobile-hook').children('div').css('color','#333');
    
    if (userSelect != 'Will Not Do') {                //  shows calculations only for Will Do and Already Done
        dollarsSaved = g_FRIDGE_REPLACE_KWH_SAVINGS * g_AVG_ELEC_PRICE_PER_KILOWATT;
        co2Saved = g_FRIDGE_REPLACE_KWH_SAVINGS * g_eFactorValue;

        userRevisedTotalEmissions[6]=[2,co2Saved,dollarsSaved];

        if (userSelect == 'Already Done') {
            $('#fridgeSelect').parent().next('.mobile-hook').children('div').css('color','#aaa').parent().next('.mobile-hook').children('div').css('color','#aaa');
            userRevisedTotalEmissions[6][0]=1;
        }
    }
    $('.fridgeDollarsSaved').html(insertCommas(Math.round(userRevisedTotalEmissions[6][2])));
    $('.fridgeCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[6][1])));
    
    setterRevisedEmissions();
    displayHomeProgressBar();
}
function calcFurnace(){
    if (getterHeatSource()) {      //  must have a heat source set
        userRevisedTotalEmissions[7]=[0,0,0];
        homeProgress[13] = 1;
        var utility=0;
        
        $("#error-bill-primary-heat").removeClass("errorMsg").addClass("displayNone");
        $('#furnaceSelect').parent().next('.mobile-hook').children('div').css('color','#333').parent().next('.mobile-hook').children('div').css('color','#333');
        
        if (heatSource == "Electricity" || heatSource == "Propane") {
            $('#furnaceSelect').val("");
        }
        else{
            if (heatSource == "Natural Gas") {
                utility = userTotalEmissions[0];
            }
            else if (heatSource == "Fuel Oil") {
                utility = userTotalEmissions[2];
            }
                        
            if (utility === 0 || isNaN(utility)){
                $("#error-bill-primary-heat").html("Error: Please enter your an average monthly bill for your Primary Heating Source, "+heatSource+" first.");
                $("#error-bill-primary-heat").removeClass("displayNone").addClass("errorMsg");
                
                $('#furnaceSelect').val("");            // reset the select box
            }
            else{
                var userSelect = $('#furnaceSelect').val();
                var co2Saved=0;
                var dollarsSaved = 0;
        
                if (userSelect != 'Will Not Do') {
                    if (heatSource == "Natural Gas") {
                        co2Saved = g_BOILER_REPLACE_SAVINGS_NAT_GAS;
                        dollarsSaved = g_BOILER_REPLACE_COST_SAVINGS;
                    }
                    else if (heatSource == "Fuel Oil") {
                        co2Saved = g_BOILER_REPLACE_SAVINGS_FUEL_OIL;
                        dollarsSaved = g_BOILER_REPLACE_COST_SAVINGS;
                    }
                
                    userRevisedTotalEmissions[7]=[2,co2Saved,dollarsSaved];
            
                    if (userSelect == 'Already Done') {
                        $('#furnaceSelect').parent().next('.mobile-hook').children('div').css('color','#aaa').parent().next('.mobile-hook').children('div').css('color','#aaa');
                        userRevisedTotalEmissions[7][0]=1;
                    }
                }
            }
        }
        
        $('.furnaceDollarsSaved').html(insertCommas(Math.round(userRevisedTotalEmissions[7][2])));
        $('.furnaceCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[7][1])));
        
        displayErrorMessages();
        setterRevisedEmissions();
        displayHomeProgressBar();
    }
    else {
        $('#furnaceSelect option').prop('selected', function(){
            return this.defaultSelected;
        });
    }
}
function calcWindows(){
    if (getterHeatSource()) {
        userRevisedTotalEmissions[8]=[0,0,0];
        homeProgress[14] = 1;
        var userSelect=$('#windowSelect').val();
        var co2Saved = 0;
        var dollarsSaved = 0;
        homeProgress[14] = 1;

        $('#windowSelect').parent().next('.mobile-hook').children('div').css('color','#333').parent().next('.mobile-hook').children('div').css('color','#333');
        
        if (userSelect != 'Will Not Do') {
            if (heatSource == "Electricity") {
                co2Saved = g_eFactorValue*(g_SWITCH_WINDOWS_SAVINGS / g_BTU_PER_KWH);
            } else if (heatSource == "Natural Gas") {
                co2Saved = g_SWITCH_WINDOWS_SAVINGS / g_BTU_PER_1000CF_NAT_GAS * g_NAT_GAS_CUBIC_FEET_EMISSIONS_FACTOR;
            } else if (heatSource == "Fuel Oil") {
                co2Saved = g_SWITCH_WINDOWS_SAVINGS / g_BTU_PER_GALLON_FUEL_OIL * g_FUEL_OIL_EMISSIONS_FACTOR;
            } else if (heatSource == "Propane") {
                co2Saved = g_SWITCH_WINDOWS_SAVINGS / g_BTU_PER_GALLON_PROPANE * g_PROPANE_EMISSIONS_FACTOR;
            }
            dollarsSaved = g_WINDOW_REPLACE_COST_SAVINGS;
            userRevisedTotalEmissions[8]=[2,co2Saved,dollarsSaved];
            
            if (userSelect == 'Already Done') {
                $('#windowSelect').parent().next('.mobile-hook').children('div').css('color','#aaa').parent().next('.mobile-hook').children('div').css('color','#aaa');
                userRevisedTotalEmissions[8][0]=1;
            }
        }				
        $('.windowDollarsSaved').html(insertCommas(Math.round(dollarsSaved)));
        $('.windowCo2Saved').html(insertCommas(Math.round(co2Saved)));
        
        setterRevisedEmissions();
        displayHomeProgressBar();
    }
}
function calcVehicleExhaust(miles,mpg){
    var exhaust=0;
    exhaust = miles / mpg * g_CO2_EMITTED_PER_GALLON_OF_GASOLINE * g_NONCO2_EMITTED_PER_GALLON_OF_GASOLINE;
    
    if (isNaN(exhaust)) {
        exhaust = 0;
    }
    
    return exhaust;
}
function calcVehicleEmissions(id){
    $("#error-current-maintenance").removeClass("errorMsg").addClass("displayNone");
    
    var x = parseInt(id);
    var mileChecker = $('#vehicle' + x + 'Miles').val();
    var mpgChecker = $('#vehicle'+x+'GasMileage').val();

    if ((maintCurrentSelect != "") || (mileChecker === "" && mpgChecker === "")) {
        //alert("got in This far: "+mileChecker+" : " + mpgChecker);
        if ((mileChecker != "" && mpgChecker != "")) {
            //alert("got all the way in: "+mileChecker+" : " + mpgChecker);
            var miles = scrubInputText(mileChecker);               //  check for non number related characters
            document.getElementById('vehicle'+x+'Miles').value = miles;           //  if input contained non number related characters show revised number to user
            miles = stripCommas(miles);
            if ($('#vehicle'+x+'Select').val() == "Per Week") {                           // convert miles per week to miles per year first
                miles = calcMilesPerYear(miles);
            }

            var mpg = scrubInputText(mpgChecker);
            document.getElementById('vehicle'+x+'GasMileage').value = mpg;
            mpg = stripCommas(mpg);
            
            if (!isNaN(miles) && !isNaN(mpg)) {                     //  if the user enters 0 exhaust is NaN
                var exhaust = calcVehicleExhaust(miles,mpg);
                
                if (maintCurrentSelect == "Do Not Do") {
                    exhaust = exhaust * 1.04;
                }
            }
            else{
                exhaust = 0;
            }
            
            vehicleData[x-1][0] = miles;
            vehicleData[x-1][1] = mpg;
            vehicleData[x-1][2] = exhaust;
            
            if (isNaN(miles)) {      //  prevents showing NaN to user in Reduction
                miles=0;
            }
            if (isNaN(mpg)) {      //  prevents showing NaN to user in Reduction
                mpg=0;
            }
            
            $('.vehicleInfo'+x).html(insertCommas(miles) + ' miles/year, avg. ' + mpg + ' MPG');      //  display in Reduction
            $('.vehicle'+x+'Co2').html(insertCommas(Math.round(exhaust)));      //  display computed emission
    
            setterVehicleEmissions();
        }
    }
    else{
        //alert("this message 1");
        $("#error-current-maintenance").removeClass("displayNone").addClass("errorMsg");
        
        document.getElementById("vehicle" + id + "Miles").value = "";
        document.getElementById("vehicle" + id + "GasMileage").value = "";
    }
    displayErrorMessages();
}
function calculateMaintenance(){
    var dollarsSaved=0;
    var exhaustSaved=0;
    var showErrorMsg = false;
    
    for (var x=0;x<numVehicles;x++){
        if (!(isNaN(vehicleData[x][0])) && !(isNaN(vehicleData[x][1]))) {      //  miles = vehicleData[x][0], mpg = vehicleData[x][1]
            dollarsSaved += calcVehicleCost(vehicleData[x][0], vehicleData[x][1]) * g_VEHICLE_EFFICIENCY_IMPROVEMENTS;
            exhaustSaved += calcVehicleExhaust(vehicleData[x][0], vehicleData[x][1]) * g_VEHICLE_EFFICIENCY_IMPROVEMENTS;
        }
    }
    
    userRevisedTotalEmissions[10][1] = exhaustSaved;
    userRevisedTotalEmissions[10][2] = dollarsSaved;
    
    if ((userRevisedTotalEmissions[10][0]==1) || (userRevisedTotalEmissions[10][0]==2)) {
        $('.maintenanceDollarsSaved').html(insertCommas(Math.round(userRevisedTotalEmissions[10][2])));           // also shows on Report
        $('.maintenanceCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[10][1])));               // also shows on Report
        
        if (userRevisedTotalEmissions[10][0]==1) {
            $('.maintReducDollarsSaved').html(0);
            $('.maintReducCo2Saved').html(0);
        }
        else{
            $('.maintReducDollarsSaved').html(insertCommas(Math.round(userRevisedTotalEmissions[10][2])));
            $('.maintReducCo2Saved').html(insertCommas(Math.round(userRevisedTotalEmissions[10][1])));
        }
    }
    else{
        $('.maintReducDollarsSaved').html(0);
        $('.maintReducCo2Saved').html(0);
    }
    
    setterRevisedEmissions();
}
function calcVehicleCost(miles,mpg){
    var cost=0;
    // convert miles per week to miles per year first
    cost = miles / mpg * g_AVG_GAS_PRICE_PER_GALLON;
    return cost;
}
function getterWasteSavings(factor){
    var savings = 0;
    switch (factor) {
        case 0:
            savings = numPeople * g_NEWSPAPER_REDUCTION;
            break;
        case 1:
            savings = numPeople * g_GLASS_REDUCTION;
            break;
        case 2:
            savings = numPeople * g_PLASTIC_REDUCTION;
            break;
        case 3:
            savings = numPeople * g_METAL_REDUCTION;
            break;
        case 4:
            savings = numPeople * g_MAGAZINE_REDUCTION;
            break;
        default:
            break;
    }
    return savings;
}
function displayRecyclingTotals(){
    userTotalEmissions[5] = usAvgTotals[2];
    var alreadySaved = 0;
    var willSave = 0;
    var counterAlready = 0;
    var counterWill = 0;
    var strAlready="Recycling: ";
    var strWill="Recycle: ";
    
    userRevisedTotalEmissions[21]=[0,0,0];
    userRevisedTotalEmissions[22]=[0,0,0];
    
    for (var idx=0; idx<userRecycling.length;idx++) {
        if (userRecycling[idx][0] == 1) {                                                    //  1 = Already Done
            strAlready += userRecycling[idx][1]+", ";                                       //     Add the string to the output string
            alreadySaved += Math.abs(getterWasteSavings(idx));                                //     Add the total to the amount Already Saved
            counterAlready++;
        }
        else if (userRecycling[idx][0] == 2) {                                              //  2 = Will do
            willSave += Math.abs(getterWasteSavings(idx));
            strWill += userRecycling[idx][1]+", ";                                          //     Add the string to the output string
            counterWill++;
        }
    }
            
    willSave = Math.abs(Math.round(willSave));
    alreadySaved = Math.round(Math.abs(alreadySaved));
    userTotalEmissions[5] = usAvgTotals[2] - alreadySaved;
    
    $('.wasteAlreadySaved').html(insertCommas( alreadySaved ));                                     //  SubTotal of Already Saved - before subtraction from US Avg
    $('#userWasteCurrent').html(insertCommas(Math.round(userTotalEmissions[5])));		            //  Total after subtraction from US Avg
    $('.wasteWillSave').html(insertCommas( willSave ));                                                //  Total of Will Do

    if (willSave > 0) {
        userRevisedTotalEmissions[21]=[2,willSave,0];       //  by nature of the function this has to be tested for null
    }
    if (alreadySaved > 0) {
        userRevisedTotalEmissions[22]=[1,alreadySaved,0];       //  by nature of the function this has to be tested for null
    }

    var pos = strAlready.lastIndexOf(", ");
    strAlready = strAlready.slice(0,pos);
    $("#already-do .strRecycling").html(strAlready);
    
    var pos2 = strWill.lastIndexOf(", ");
    strWill = strWill.slice(0,pos2);
    $("#will-do .strRecycling").html(strWill);
    
    if (counterAlready == userRecycling.length) {                                   //  display this message if user recycles all items currently
        if ($('#good-job').hasClass("displayNone")) {
            $('#good-job').removeClass("displayNone");
            $('#start-recycling').addClass("displayNone");
            $('.removal-hook').hide();
        }
    }
    else {
        if ($('#start-recycling').hasClass("displayNone")) {
            $('#good-job').addClass("displayNone");
            $('#start-recycling').removeClass("displayNone");
            $('.removal-hook').show();
        }
    }
    
    if (counterAlready == userRecycling.length || counterWill == userRecycling.length) {
        progressBarTotals[2] = 100;
    }
    else{
        if (counterAlready > 0 && counterAlready < userRecycling.length) {
            progressBarTotals[2] = 50;
        }
        if (counterWill > 0 && counterWill < userRecycling.length) {
            progressBarTotals[2] += 50;
        }
    }
    $('#wasteProgressBar').attr('value', progressBarTotals[2]);
    $("#wasteProgressBar_IE").css("width", progressBarTotals[2] + "%");
    
    reportButtonDisplay();		
    setterTotalEmissions();
}